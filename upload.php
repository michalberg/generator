<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['data'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No data']);
    exit;
}

$dataUrl = $input['data'];
if (!preg_match('/^data:(image\/[\w+]+);base64,(.+)$/s', $dataUrl, $matches)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data URL']);
    exit;
}

$mime = $matches[1];
$imageData = base64_decode($matches[2]);

$extMap = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
$ext = $extMap[$mime] ?? 'jpg';

$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

$filename = uniqid('img_', true) . '.' . $ext;
file_put_contents($uploadsDir . '/' . $filename, $imageData);

$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$url = $proto . '://' . $_SERVER['HTTP_HOST'] . '/uploads/' . $filename;

echo json_encode(['url' => $url]);
