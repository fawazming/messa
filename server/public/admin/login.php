<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';

if (admin_user()) {
  redirect('index.php');
}

$error = '';
if (request_method() === 'POST') {
  csrf_verify($_POST['csrf'] ?? null);
  $email = post('email');
  $password = (string) ($_POST['password'] ?? '');
  if (admin_login($email, $password)) {
    redirect('index.php');
  }
  $error = 'Invalid email or password.';
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in · MESSA Admin</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <div class="login-wrap">
    <form class="login-card" method="post" action="login.php">
      <h1>MESSA Admin</h1>
      <p>Sign in to manage users, tokens and data tables.</p>
      <?php if ($error !== ''): ?>
        <div class="alert alert-error"><?= e($error) ?></div>
      <?php endif; ?>
      <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
      <div class="field">
        <label for="email">Email</label>
        <input id="email" type="email" name="email" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input id="password" type="password" name="password" autocomplete="current-password" required>
      </div>
      <button class="btn" type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>
