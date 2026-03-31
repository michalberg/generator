<?php
session_start();
require_once 'config.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header('Location: index.php');
    exit;
}

if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time'] > SESSION_TIMEOUT)) {
    session_destroy();
    header('Location: index.php?timeout=1');
    exit;
}

$_SESSION['login_time'] = time();
$markdown = file_get_contents(__DIR__ . '/manual-social-media-zeleni-2026.md');
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doporučení pro FB/IG – Zelení 2026</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <style>
        .manual-body {
            max-width: 800px;
            margin: 0 auto;
            padding: 32px 24px 64px;
        }
        .manual-body h1 { font-family: 'TuskerGrotesk', sans-serif; font-weight: 900; font-size: 36px; text-transform: uppercase; margin-bottom: 4px; }
        .manual-body h2 { font-family: 'TuskerGrotesk', sans-serif; font-weight: 900; font-size: 24px; text-transform: uppercase; margin: 40px 0 12px; border-bottom: 3px solid var(--green-primary); padding-bottom: 6px; }
        .manual-body h3 { font-family: 'UrbanGrotesk', sans-serif; font-weight: 700; font-size: 18px; margin: 28px 0 8px; }
        .manual-body h4 { font-family: 'UrbanGrotesk', sans-serif; font-weight: 600; font-size: 15px; margin: 20px 0 6px; color: #444; }
        .manual-body p  { font-family: 'UrbanGrotesk', sans-serif; font-weight: 400; font-size: 15px; line-height: 1.7; margin-bottom: 12px; }
        .manual-body ul, .manual-body ol { padding-left: 24px; margin-bottom: 12px; }
        .manual-body li { font-family: 'UrbanGrotesk', sans-serif; font-size: 15px; line-height: 1.7; margin-bottom: 4px; }
        .manual-body strong { font-weight: 700; }
        .manual-body blockquote { border-left: 4px solid var(--green-primary); margin: 16px 0; padding: 8px 16px; background: #f5f5f5; }
        .manual-body blockquote p { margin: 0; font-style: italic; }
        .manual-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
        .manual-body th { background: var(--black); color: var(--white); font-family: 'UrbanGrotesk', sans-serif; font-weight: 600; padding: 8px 12px; text-align: left; }
        .manual-body td { padding: 8px 12px; border-bottom: 1px solid #efefef; font-family: 'UrbanGrotesk', sans-serif; }
        .manual-body tr:nth-child(even) td { background: #fafafa; }
        .manual-body hr { border: none; border-top: 1px solid #efefef; margin: 32px 0; }
        .manual-body code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    </style>
</head>
<body>

<header class="app-header">
    <div class="app-header-logo">
        <span class="logo-zeleni">ZELENÍ</span>
        <h1>Generátor pro Instagram</h1>
    </div>
    <div class="app-header-right">
        <a href="app.php" class="btn-logout">← Zpět do generátoru</a>
        <a href="logout.php" class="btn-logout">Odhlásit se</a>
    </div>
</header>

<div class="manual-body" id="manual-content"></div>

<script src="https://cdn.jsdelivr.net/npm/marked@9/marked.min.js"></script>
<script>
    const md = <?= json_encode($markdown) ?>;
    document.getElementById('manual-content').innerHTML = marked.parse(md);
</script>
</body>
</html>
