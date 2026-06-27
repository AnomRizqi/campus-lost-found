<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

// 1. Create uploads folder if it doesn't exist
$uploadDir = __DIR__ . '/uploads';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// 2. Validate file existence
if (!isset($_FILES['file'])) {
    send_json(['error' => 'No file uploaded.'], 400);
}

$file = $_FILES['file'];

// 3. Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    send_json(['error' => 'File upload error code: ' . $file['error']], 400);
}

// 4. Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    send_json(['error' => 'File size exceeds maximum limit of 5MB.'], 400);
}

// 5. Validate file type (image only)
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$fileInfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($fileInfo, $file['tmp_name']);
finfo_close($fileInfo);

if (!in_array($mimeType, $allowedTypes)) {
    send_json(['error' => 'Invalid file type. Only JPG, PNG, GIF, and WEBP images are allowed.'], 400);
}

// 6. Generate a unique file name
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
if (empty($ext)) {
    $ext = ($mimeType === 'image/png') ? 'png' : (($mimeType === 'image/gif') ? 'gif' : (($mimeType === 'image/webp') ? 'webp' : 'jpg'));
}
$fileName = uniqid('img_', true) . '.' . $ext;
$targetPath = $uploadDir . '/' . $fileName;

// 7. Move file to target directory
if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // 8. Generate dynamic absolute URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $scriptDir = dirname($_SERVER['REQUEST_URI']);
    
    // Clean scriptDir backslashes if on Windows
    $scriptDir = str_replace('\\', '/', $scriptDir);
    
    $publicUrl = $protocol . $host . $scriptDir . '/uploads/' . $fileName;

    send_json([
        'success' => true,
        'url' => $publicUrl,
        'fileName' => $fileName
    ]);
} else {
    send_json(['error' => 'Failed to save uploaded file.'], 500);
}
?>
