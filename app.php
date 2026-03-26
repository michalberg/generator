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
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Generator – Zelení Brno</title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body>

<header class="app-header">
    <div class="app-header-logo">
        <span class="logo-zeleni">ZELENÍ</span>
        <h1>Generátor pro Instagram</h1>
    </div>
    <div class="app-header-right">
        <a href="logout.php" class="btn-logout">Odhlásit se</a>
    </div>
</header>

<div class="app-body">

    <aside class="sidebar" id="sidebar">
        <!-- Built by JS -->
    </aside>

    <main class="main-area">
        <div class="preview-area">
            <div class="ig-frame" id="ig-frame">
                <!-- Built by JS -->
            </div>
        </div>

        <div class="export-bar">
            <span class="slide-counter" id="slide-counter"></span>
            <button class="btn btn-secondary" id="btn-export-current">Exportovat slide</button>
            <button class="btn btn-primary" id="btn-export-all">Exportovat vše ZIP</button>
        </div>
    </main>

</div>

<script type="module" src="js/app.js"></script>
</body>
</html>
