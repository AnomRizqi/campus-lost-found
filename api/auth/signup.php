<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
$role = trim($input['role'] ?? 'user');

if (empty($email) || empty($password) || empty($fullName)) {
    send_json(['error' => 'All fields (email, password, full name) are required.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(['error' => 'Invalid email address format.'], 400);
}

if (strlen($password) < 6) {
    send_json(['error' => 'Password must be at least 6 characters.'], 400);
}

if (!in_array($role, ['user', 'admin'])) {
    $role = 'user';
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM profiles WHERE email = :email");
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        send_json(['error' => 'Email is already registered.'], 409);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $userId = generate_uuid();

    // Insert user
    $stmt = $pdo->prepare("INSERT INTO profiles (id, full_name, email, role, password_hash) VALUES (:id, :full_name, :email, :role, :password_hash)");
    $stmt->execute([
        'id' => $userId,
        'full_name' => $fullName,
        'email' => $email,
        'role' => $role,
        'password_hash' => $passwordHash
    ]);

    // Fetch and return the newly created profile
    $stmt = $pdo->prepare("SELECT id, full_name, email, role, created_at FROM profiles WHERE id = :id");
    $stmt->execute(['id' => $userId]);
    $userProfile = $stmt->fetch();

    send_json([
        'success' => true,
        'user' => $userProfile
    ]);

} catch (PDOException $e) {
    send_json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
}
?>
