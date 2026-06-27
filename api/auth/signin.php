<?php
require_once __DIR__ . '/../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    send_json(['error' => 'Email and password are required.'], 400);
}

try {
    // Fetch profile
    $stmt = $pdo->prepare("SELECT * FROM profiles WHERE email = :email");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        send_json(['error' => 'Invalid email or password.'], 401);
    }

    // Remove password hash from response
    unset($user['password_hash']);

    send_json([
        'success' => true,
        'user' => $user,
        'token' => 'local-session-token-' . $user['id']
    ]);

} catch (PDOException $e) {
    send_json(['error' => 'Authentication failed: ' . $e->getMessage()], 500);
}
?>
