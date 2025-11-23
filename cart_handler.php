<?php
header('Content-Type: application/json');
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action']) || !isset($data['product_id'])) {
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

$product_id = (int)$data['product_id'];
$quantity_requested = isset($data['quantity']) ? (int)$data['quantity'] : 1;

// Lấy tồn kho
$stmt = $dbh->prepare("SELECT quantity FROM products WHERE product_id = ?");
$stmt->execute([$product_id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    echo json_encode(['status' => false, 'message' => 'Sản phẩm không tồn tại', 'available' => 0]);
    exit;
}

$available = (int)$product['quantity'];

if ($quantity_requested <= $available) {
    echo json_encode(['status' => true, 'available' => $available]);
} else {
    echo json_encode([
        'status' => false,
        'message' => "Chỉ còn $available sản phẩm",
        'available' => $available
    ]);
}
?>
