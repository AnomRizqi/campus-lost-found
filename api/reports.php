<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Handle statistics request
        if (isset($_GET['stats']) && $_GET['stats'] === 'true') {
            try {
                // Count lost reports (approved)
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'approved' AND type = 'lost'");
                $stmt->execute();
                $totalLost = (int)$stmt->fetch()['count'];

                // Count found reports (approved)
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'approved' AND type = 'found'");
                $stmt->execute();
                $totalFound = (int)$stmt->fetch()['count'];

                // Count pending reports
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'");
                $stmt->execute();
                $totalPending = (int)$stmt->fetch()['count'];

                send_json([
                    'totalLost' => $totalLost,
                    'totalFound' => $totalFound,
                    'totalPending' => $totalPending
                ]);
            } catch (PDOException $e) {
                send_json(['error' => 'Failed to fetch statistics: ' . $e->getMessage()], 500);
            }
            break;
        }

        // Handle fetching list of reports
        $status = $_GET['status'] ?? '';
        $userId = $_GET['user_id'] ?? '';
        $all = $_GET['all'] ?? '';

        try {
            $sql = "SELECT r.*, p.full_name, p.email, p.role FROM reports r 
                    LEFT JOIN profiles p ON r.user_id = p.id";
            $where = [];
            $params = [];

            if ($all === 'true') {
                // Return all reports, no filter (for admin panel)
                // Nothing to filter
            } elseif ($status === 'pending') {
                // Only pending reports (for admin review)
                $where[] = "r.status = 'pending'";
            } elseif (!empty($userId)) {
                // Approved reports OR user's own reports (for home feed with user logged in)
                $where[] = "(r.status = 'approved' OR r.user_id = :user_id)";
                $params['user_id'] = $userId;
            } else {
                // Approved reports only (guest)
                $where[] = "r.status = 'approved'";
            }

            if (!empty($where)) {
                $sql .= " WHERE " . implode(' AND ', $where);
            }

            $sql .= " ORDER BY r.created_at DESC";

            // Add limit if provided (e.g., limit=3 for recent items in RightSidebar)
            if (isset($_GET['limit'])) {
                $limit = (int)$_GET['limit'];
                $sql .= " LIMIT $limit";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();

            // Structure to match Supabase nested data
            $reports = [];
            foreach ($rows as $row) {
                $reports[] = [
                    'id' => $row['id'],
                    'user_id' => $row['user_id'],
                    'type' => $row['type'],
                    'title' => $row['title'],
                    'description' => $row['description'],
                    'category' => $row['category'],
                    'location' => $row['location'],
                    'image_url' => $row['image_url'],
                    'contact_info' => $row['contact_info'],
                    'status' => $row['status'],
                    'created_at' => $row['created_at'],
                    'profiles' => [
                        'id' => $row['user_id'],
                        'full_name' => $row['full_name'],
                        'email' => $row['email'],
                        'role' => $row['role']
                    ]
                ];
            }

            send_json($reports);

        } catch (PDOException $e) {
            send_json(['error' => 'Failed to fetch reports: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Create Report OR Update Report (if action is specified or PUT fallback is used)
        $input = get_json_input();
        $id = $input['id'] ?? $_GET['id'] ?? '';

        // If id exists and this is POST, it might be an update action
        if (!empty($id)) {
            // Forward to update logic
            goto update_logic;
        }

        // Insert new report
        $userId = trim($input['user_id'] ?? '');
        $type = trim($input['type'] ?? 'lost');
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $category = trim($input['category'] ?? '');
        $location = trim($input['location'] ?? '');
        $imageUrl = trim($input['image_url'] ?? '') ?: null;
        $contactInfo = trim($input['contact_info'] ?? '');

        if (empty($userId) || empty($title) || empty($category) || empty($location) || empty($contactInfo) || empty($description)) {
            send_json(['error' => 'Required fields are missing.'], 400);
        }

        if (!in_array($type, ['lost', 'found'])) {
            $type = 'lost';
        }

        try {
            $reportId = generate_uuid();
            $stmt = $pdo->prepare("INSERT INTO reports (id, user_id, type, title, description, category, location, image_url, contact_info, status) 
                                  VALUES (:id, :user_id, :type, :title, :description, :category, :location, :image_url, :contact_info, 'pending')");
            $stmt->execute([
                'id' => $reportId,
                'user_id' => $userId,
                'type' => $type,
                'title' => $title,
                'description' => $description,
                'category' => $category,
                'location' => $location,
                'image_url' => $imageUrl,
                'contact_info' => $contactInfo
            ]);

            // Fetch created report with profile join
            $stmt = $pdo->prepare("SELECT r.*, p.full_name, p.email, p.role FROM reports r 
                                  LEFT JOIN profiles p ON r.user_id = p.id 
                                  WHERE r.id = :id");
            $stmt->execute(['id' => $reportId]);
            $row = $stmt->fetch();

            $report = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'type' => $row['type'],
                'title' => $row['title'],
                'description' => $row['description'],
                'category' => $row['category'],
                'location' => $row['location'],
                'image_url' => $row['image_url'],
                'contact_info' => $row['contact_info'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'profiles' => [
                    'id' => $row['user_id'],
                    'full_name' => $row['full_name'],
                    'email' => $row['email'],
                    'role' => $row['role']
                ]
            ];

            send_json($report, 201);

        } catch (PDOException $e) {
            send_json(['error' => 'Failed to create report: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
    case 'PATCH':
        $input = get_json_input();
        $id = $input['id'] ?? $_GET['id'] ?? '';

        update_logic:
        if (empty($id)) {
            send_json(['error' => 'Report ID is required for update.'], 400);
        }

        try {
            // Check if report exists
            $stmt = $pdo->prepare("SELECT id FROM reports WHERE id = :id");
            $stmt->execute(['id' => $id]);
            if (!$stmt->fetch()) {
                send_json(['error' => 'Report not found.'], 404);
            }

            // Prepare dynamic update query
            $updateFields = [];
            $params = ['id' => $id];

            $fields = ['type', 'title', 'description', 'category', 'location', 'image_url', 'contact_info', 'status'];
            foreach ($fields as $field) {
                if (isset($input[$field])) {
                    $updateFields[] = "`$field` = :$field";
                    $params[$field] = is_string($input[$field]) ? trim($input[$field]) : $input[$field];
                }
            }

            if (empty($updateFields)) {
                send_json(['error' => 'No fields to update.'], 400);
            }

            $sql = "UPDATE reports SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Return updated report
            $stmt = $pdo->prepare("SELECT r.*, p.full_name, p.email, p.role FROM reports r 
                                  LEFT JOIN profiles p ON r.user_id = p.id 
                                  WHERE r.id = :id");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();

            $report = [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'type' => $row['type'],
                'title' => $row['title'],
                'description' => $row['description'],
                'category' => $row['category'],
                'location' => $row['location'],
                'image_url' => $row['image_url'],
                'contact_info' => $row['contact_info'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'profiles' => [
                    'id' => $row['user_id'],
                    'full_name' => $row['full_name'],
                    'email' => $row['email'],
                    'role' => $row['role']
                ]
            ];

            send_json($report);

        } catch (PDOException $e) {
            send_json(['error' => 'Failed to update report: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? get_json_input()['id'] ?? '';

        if (empty($id)) {
            send_json(['error' => 'Report ID is required for deletion.'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM reports WHERE id = :id");
            $stmt->execute(['id' => $id]);
            send_json(['success' => true, 'deleted_id' => $id]);
        } catch (PDOException $e) {
            send_json(['error' => 'Failed to delete report: ' . $e->getMessage()], 500);
        }
        break;

    default:
        send_json(['error' => 'Method not allowed'], 405);
}
?>
