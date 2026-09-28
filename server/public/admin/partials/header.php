<?php
/** @var string $pageTitle */
/** @var string $active */
$admin = admin_user();
$flashes = take_flashes();
$nav = [
  'index' => ['Dashboard', '▤'],
  'users' => ['Users', '◉'],
  'tokens' => ['Registration Tokens', '✦'],
  'tables' => ['Data Tables', '▦'],
  'activity' => ['Activity', '≣'],
  'settings' => ['Settings', '⚙'],
];
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($pageTitle ?? 'Admin') ?> · MESSA Admin</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark">M</span>
      <div>
        <strong>MESSA</strong>
        <small>Data-to-SMS</small>
      </div>
    </div>
    <nav>
      <?php foreach ($nav as $slug => [$label, $icon]): ?>
        <a class="nav-item <?= ($active ?? '') === $slug ? 'active' : '' ?>" href="<?= e($slug) ?>.php">
          <span class="nav-icon"><?= e($icon) ?></span><?= e($label) ?>
        </a>
      <?php endforeach; ?>
    </nav>
    <div class="sidebar-foot">
      <div class="who"><?= e($admin['name'] ?? 'Admin') ?><br><small><?= e($admin['email'] ?? '') ?></small></div>
      <a class="btn btn-ghost btn-sm" href="logout.php">Sign out</a>
    </div>
  </aside>

  <main class="content">
    <header class="topbar">
      <h1><?= e($pageTitle ?? 'Dashboard') ?></h1>
    </header>

    <?php foreach ($flashes as $f): ?>
      <div class="alert alert-<?= e($f['type']) ?>"><?= e($f['message']) ?></div>
    <?php endforeach; ?>
