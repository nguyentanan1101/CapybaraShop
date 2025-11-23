<?php
header('Content-Type: application/json');

$host = "localhost";
$dbname = "capybarashop";
$user = "root";
$pass = "";

// Kết nối database
try {
    $dbh = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode([]);
    exit;
}

// Lấy tất cả sản phẩm còn hàng
try {
    $stmt = $dbh->prepare("SELECT product_id, product_name, price, discount_price, quantity, image_url FROM products");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($products);
} catch (PDOException $e) {
    echo json_encode([]);
}
?>
