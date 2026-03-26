<?php
session_start();
require_once 'config.php';

$error = '';

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    header('Location: app.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['password']) && $_POST['password'] === APP_PASSWORD) {
        $_SESSION['logged_in'] = true;
        $_SESSION['login_time'] = time();
        header('Location: app.php');
        exit;
    } else {
        $error = 'Nesprávné heslo';
    }
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Generator – Přihlášení</title>
    <link rel="stylesheet" href="assets/css/styles.css">
</head>
<body class="login-page">
    <div class="login-box">
        <div class="login-logo">
            <span class="logo-zeleni">ZELENÍ</span>
            <span class="logo-brno">Brno</span>
        </div>
        <h1>Social Generator</h1>
        <form method="POST">
            <?php if ($error): ?>
                <div class="error-msg"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            <?php if (isset($_GET['timeout'])): ?>
                <div class="error-msg">Relace vypršela, přihlaste se znovu.</div>
            <?php endif; ?>
            <input type="password" name="password" placeholder="Heslo" required autofocus>
            <button type="submit">Vstoupit</button>
        </form>
    </div>
</body>
</html>
