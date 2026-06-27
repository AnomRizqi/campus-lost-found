<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? '';
        try {
            if (!empty($id)) {
                // Fetch single profile
                $stmt = $pdo->prepare("SELECT id, full_name, email, role, created_at FROM profiles WHERE id = :id");
                $stmt->execute(['id' => $id]);
                $profile = $stmt->fetch();
                
                if (!$profile) {
                    send_json(['error' => 'Profile not found'], 404);
                }
                send_json($profile);
            } else {
                // Fetch all profiles (for admin)
                $stmt = $pdo->query("SELECT id, full_name, email, role, created_at FROM profiles ORDER BY created_at DESC");
                $profiles = $stmt->fetchAll();
                send_json($profiles);
            }
        } catch (PDOException $e) {
            send_json(['error' => 'Failed to fetch profile data: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
    case 'PUT':
    case 'PATCH':
        // Handle Create, Update, or Upsert
        $input = get_json_input();
        $id = $input['id'] ?? $_GET['id'] ?? '';
        
        if (empty($id)) {
            send_json(['error' => 'User ID is required for update or upsert.'], 400);
        }

        try {
            // Check if profile exists
            $stmt = $pdo->prepare("SELECT id FROM profiles WHERE id = :id");
            $stmt->execute(['id' => $id]);
            $exists = $stmt->fetch();

            if ($exists) {
                // Update
                $updateFields = [];
                $params = ['id' => $id];
                
                if (isset($input['full_name'])) {
                    $updateFields[] = 'full_name = :full_name';
                    $params['full_name'] = trim($input['full_name']);
                }
                if (isset($input['email'])) {
                    $updateFields[] = 'email = :email';
                    $params['email'] = trim($input['email']);
                }
                if (isset($input['role'])) {
                    $updateFields[] = 'role = :role';
                    $params['role'] = trim($input['role']);
                }
                if (isset($input['password'])) {
                    $updateFields[] = 'password_hash = :password_hash';
                    $params['password_hash'] = password_hash($input['password'], PASSWORD_BCRYPT);
                }

                if (empty($updateFields)) {
                    send_json(['error' => 'No fields to update.'], 400);
                }

                $sql = "UPDATE profiles SET " . implode(', ', $updateFields) . " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
            } else {
                // Insert (Upsert case where user does not exist)
                $fullName = trim($input['full_name'] ?? 'Anonymous User');
                $email = trim($input['email'] ?? '');
                $role = trim($input['role'] ?? 'user');
                $password = $input['password'] ?? 'default_password'; // fallback
                $passwordHash = password_hash($password, PASSWORD_BCRYPT);

                $stmt = $pdo->prepare("INSERT INTO profiles (id, full_name, email, role, password_hash) VALUES (:id, :full_name, :email, :role, :password_hash)");
                $stmt->execute([
                    'id' => $id,
                    'full_name' => $fullName,
                    'email' => $email,
                    'role' => $role,
                    'password_hash' => $passwordHash
                ]);
            }

            // Return updated/created profile
            $stmt = $pdo->prepare("SELECT id, full_name, email, role, created_at FROM profiles WHERE id = :id");
            $stmt->execute(['id' => $id]);
            send_json($stmt->fetch());

        } catch (PDOException $e) {
            send_json(['error' => 'Failed to update/upsert profile: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? get_json_input()['id'] ?? '';
        if (empty($id)) {
            send_json(['error' => 'User ID is required for deletion.'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM profiles WHERE id = :id");
            $stmt->execute(['id' => $id]);
            send_json(['success' => true, 'deleted_id' => $id]);
        } catch (PDOException $e) {
            send_json(['error' => 'Failed to delete profile: ' . $e->getMessage()], 500);
        }
        break;

    default:
        send_json(['error' => 'Method not allowed'], 405);
}
?>
