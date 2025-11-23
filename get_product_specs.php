<?php
require_once 'db_connect.php'; // file kết nối DB

if (!isset($_GET['product_id'])) {
    echo json_encode(['error' => 'Missing product_id']);
    exit;
}

$product_id = intval($_GET['product_id']);

$stmt = $dbh->prepare("SELECT * FROM product_specs WHERE product_id = ?");
$stmt->execute([$product_id]);
$specs = $stmt->fetch(PDO::FETCH_ASSOC);

if ($specs) {
    echo json_encode($specs);
} else {
    echo json_encode(['error' => 'Không tìm thấy thông số kỹ thuật']);
}
?>
