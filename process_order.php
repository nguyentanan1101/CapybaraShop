<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['items']) || !is_array($data['items'])) {
    echo json_encode(['status' => false, 'message' => 'Dữ liệu không hợp lệ']);
    exit;
}

$host = "localhost";
$dbname = "capybarashop";
$user = "root";
$pass = "";

// Kết nối database
try {
    $dbh = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['status' => false, 'message' => 'Lỗi kết nối database']);
    exit;
}

$items = $data['items'];
$user_id = 1; // mặc định user1

try {
    // Bắt đầu transaction
    $dbh->beginTransaction();

    // Kiểm tra tồn kho
    foreach ($items as $item) {
        $stmt = $dbh->prepare("SELECT quantity FROM products WHERE product_id = ?");
        $stmt->execute([$item['product_id']]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            throw new Exception("Sản phẩm ID {$item['product_id']} không tồn tại.");
        }

        if ($item['quantity'] > $product['quantity']) {
            throw new Exception("Sản phẩm ID {$item['product_id']} chỉ còn {$product['quantity']} sản phẩm.");
        }
    }

    // Tạo đơn hàng
    $stmt = $dbh->prepare("INSERT INTO orders (user_id) VALUES (?)");
    $stmt->execute([$user_id]);
    $order_id = $dbh->lastInsertId();

    // Lưu chi tiết đơn hàng & trừ số lượng
    foreach ($items as $item) {
        // Lấy giá hiện tại
        $stmt = $dbh->prepare("SELECT price, discount_price FROM products WHERE product_id = ?");
        $stmt->execute([$item['product_id']]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        $price = $product['discount_price'] ?? $product['price'];

        // Lưu order_item
        $stmt = $dbh->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)");
        $stmt->execute([$order_id, $item['product_id'], $item['quantity'], $price]);

        // Trừ tồn kho
        $stmt = $dbh->prepare("UPDATE products SET quantity = quantity - ? WHERE product_id = ?");
        $stmt->execute([$item['quantity'], $item['product_id']]);
    }

    $dbh->commit();

    echo json_encode(['status' => true, 'message' => 'Đặt hàng thành công']);
} catch (Exception $e) {
    $dbh->rollBack();
    echo json_encode(['status' => false, 'message' => $e->getMessage()]);
}
?>
