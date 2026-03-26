<?php
session_start();
require_once '../config.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$text = $input['text'] ?? '';
$instruction = $input['instruction'] ?? 'zkrať';
$maxChars = intval($input['maxChars'] ?? 200);

if (empty($text)) {
    echo json_encode(['error' => 'No text provided']);
    exit;
}

if (empty(CLAUDE_API_KEY)) {
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$systemPrompt = "Jsi copywriter pro sociální sítě politické strany Zelení.
Upravuješ texty pro Instagram carousel.
Tón: energický, přímý, mladistvý, aktivistický.
Maximální délka výstupu: {$maxChars} znaků.
Vrať POUZE upravený text, nic jiného – žádné uvozovky, vysvětlení ani komentáře.";

$response = file_get_contents('https://api.anthropic.com/v1/messages', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => implode("\r\n", [
            'Content-Type: application/json',
            'x-api-key: ' . CLAUDE_API_KEY,
            'anthropic-version: 2023-06-01'
        ]),
        'content' => json_encode([
            'model' => 'claude-sonnet-4-20250514',
            'max_tokens' => 300,
            'system' => $systemPrompt,
            'messages' => [
                ['role' => 'user', 'content' => "Instrukce: {$instruction}\n\nPůvodní text:\n{$text}"]
            ]
        ])
    ]
]));

if ($response === false) {
    echo json_encode(['error' => 'API request failed']);
    exit;
}

$data = json_decode($response, true);
$refined = $data['content'][0]['text'] ?? $text;

echo json_encode(['refined' => trim($refined)]);
