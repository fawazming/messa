<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require_admin();

$stats = [
  'users' => (int) Db::value('SELECT COUNT(*) FROM users WHERE role = "user"'),
  'active_users' => (int) Db::value('SELECT COUNT(*) FROM users WHERE role = "user" AND status = "active"'),
  'suspended' => (int) Db::value('SELECT COUNT(*) FROM users WHERE status = "suspended"'),
  'tokens_unused' => (int) Db::value('SELECT COUNT(*) FROM registration_tokens WHERE status = "unused"'),
  'tokens_used' => (int) Db::value('SELECT COUNT(*) FROM registration_tokens WHERE status = "used"'),
  'tables' => (int) Db::value('SELECT COUNT(*) FROM data_tables'),
  'rows' => (int) Db::value('SELECT COALESCE(SUM(row_count), 0) FROM data_tables'),
];

$recentUsers = Db::all('SELECT id, name, email, status, created_at FROM users WHERE role = "user" ORDER BY id DESC LIMIT 6');
$recentActivity = Db::all(
  'SELECT a.*, u.name AS user_name FROM activity_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 8'
);

$pageTitle = 'Dashboard';
$active = 'index';
require __DIR__ . '/partials/header.php';
?>

<div class="grid">
  <div class="card">
    <div class="label">Users</div>
    <div class="value"><?= $stats['users'] ?></div>
    <div class="sub"><?= $stats['active_users'] ?> active · <?= $stats['suspended'] ?> suspended</div>
  </div>
  <div class="card">
    <div class="label">Unused tokens</div>
    <div class="value"><?= $stats['tokens_unused'] ?></div>
    <div class="sub"><?= $stats['tokens_used'] ?> redeemed</div>
  </div>
  <div class="card">
    <div class="label">Data tables</div>
    <div class="value"><?= $stats['tables'] ?></div>
    <div class="sub">across all accounts</div>
  </div>
  <div class="card">
    <div class="label">Rows stored</div>
    <div class="value"><?= number_format($stats['rows']) ?></div>
    <div class="sub">max 512 per table</div>
  </div>
</div>

<div class="panel">
  <h2>Quick actions</h2>
  <div class="actions">
    <a class="btn" href="tokens.php#generate">Generate registration tokens</a>
    <a class="btn btn-line" href="users.php">Manage users</a>
    <a class="btn btn-line" href="tables.php">Browse data tables</a>
  </div>
  <p class="muted" style="margin-top:14px">
    New users register in the MESSA app using a token bought via WhatsApp
    <strong><?= e(config('registration.whatsapp_display', '')) ?></strong>
    (<?= e(config('registration.vendor', '')) ?>) for
    <?= e(config('registration.currency', 'NGN')) ?> <?= number_format((int) config('registration.fee', 5000)) ?>.
  </p>
</div>

<div class="panel">
  <h2>Recent users</h2>
  <table>
    <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Joined</th></tr></thead>
    <tbody>
      <?php foreach ($recentUsers as $u): ?>
        <tr>
          <td><?= e($u['name']) ?></td>
          <td class="muted"><?= e($u['email']) ?></td>
          <td>
            <span class="badge <?= $u['status'] === 'active' ? 'badge-green' : 'badge-red' ?>">
              <?= e($u['status']) ?>
            </span>
          </td>
          <td class="muted"><?= e(time_ago_short($u['created_at'])) ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$recentUsers): ?>
        <tr><td colspan="4" class="muted">No users yet.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<div class="panel">
  <h2>Recent activity</h2>
  <table>
    <thead><tr><th>Action</th><th>User</th><th>When</th></tr></thead>
    <tbody>
      <?php foreach ($recentActivity as $log): ?>
        <tr>
          <td><span class="badge badge-indigo"><?= e($log['action']) ?></span></td>
          <td><?= e($log['user_name'] ?? 'system') ?></td>
          <td class="muted"><?= e(time_ago_short($log['created_at'])) ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$recentActivity): ?>
        <tr><td colspan="3" class="muted">No activity yet.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/partials/footer.php'; ?>
