<?php
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Database Credentials
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'campus_lost_found';

try {
    // 1. Connect to MySQL Server (without selecting DB first)
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // 2. Create Database if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    // 3. Create Profiles Table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS `profiles` (
      `id` VARCHAR(36) NOT NULL,
      `full_name` VARCHAR(255) NOT NULL,
      `email` VARCHAR(255) NOT NULL,
      `role` ENUM('user', 'admin') DEFAULT 'user',
      `password_hash` VARCHAR(255) NOT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `idx_email` (`email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 4. Create Reports Table if it doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS `reports` (
      `id` VARCHAR(36) NOT NULL,
      `user_id` VARCHAR(36) NOT NULL,
      `type` ENUM('lost', 'found') NOT NULL,
      `title` VARCHAR(255) NOT NULL,
      `description` TEXT NOT NULL,
      `category` VARCHAR(100) NOT NULL,
      `location` VARCHAR(255) NOT NULL,
      `image_url` VARCHAR(512) DEFAULT NULL,
      `contact_info` VARCHAR(255) NOT NULL,
      `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      CONSTRAINT `fk_reports_profiles` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 5. Seed default admin if not exists
    $stmt = $pdo->prepare("SELECT id FROM profiles WHERE email = 'admin@campus.com'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        try {
            $adminId = generate_uuid();
            $adminPasswordHash = password_hash('admin123', PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT IGNORE INTO profiles (id, full_name, email, role, password_hash) VALUES (:id, :full_name, :email, 'admin', :password_hash)");
            $stmt->execute([
                'id' => $adminId,
                'full_name' => 'Admin Campus',
                'email' => 'admin@campus.com',
                'password_hash' => $adminPasswordHash
            ]);
        } catch (PDOException $ex) {
            // Ignore potential race-condition duplicate errors
        }
    }



} catch (PDOException $e) {
    send_json(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

// Helpers
function send_json($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function get_json_input() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

function generate_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>
