<?php
$hostname = 'localhost';
$username = 'root';
$password = '';
$dbname   = 'capybarashop';

try {
    $dbh = new PDO("mysql:host=$hostname;dbname=$dbname;charset=utf8", $username, $password);
    $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Kết nối database thất bại: " . $e->getMessage());
}

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Gán mặc định user1 vào session nếu chưa có
if (!isset($_SESSION['userID'])) {
    $stmt = $dbh->prepare("SELECT user_id FROM users WHERE username = ?");
    $stmt->execute(['user1']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        $_SESSION['userID'] = $user['user_id'];
    } else {
        die("Người dùng user1 không tồn tại trong database!");
    }
}
?>
