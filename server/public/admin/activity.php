<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require_admin();

$filter = trim((string) ($_GET['action'] ?? ''));
$logs = $filter !== ''
  ? Db::all(
      'SELECT a.*, u.name AS user_name, u.email AS user_email FROM activity_logs a
       LEFT JOIN users u ON u.id = a.user_id WHERE a.action LIKE ? ORDER BY a.id DESC LIMIT 200',
      [$filter . '%']
    )
  : Db::all(
      'SELECT a.*, u.name AS user_name, u.email AS user_email FROM activity_logs a
       LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT 200'
    );

$pageTitle = 'Activity';
$active = 'activity';
require __DIR__ . '/partials/header.php';
?>

<div class="panel">
  <h2>Activity log</h2>
  <form method="get" action="activity.php" class="form-row">
    <div class="field"><label>Filter by action prefix</label><input type="text" name="action" value="<?= e($filter) ?>" placeholder="e.g. auth. or admin."></div>
    <button class="btn btn-line" type="submit">Filter</button>
    <?php if ($filter !== ''): ?><a class="btn btn-line" href="activity.php">Reset</a><?php endif; ?>
  </form>
  <table>
    <thead><tr><th>When</th><th>Action</th><th>User</th><th>Meta</th><th>IP</th></tr></thead>
    <tbody>
      <?php foreach ($logs as $log): ?>
        <tr>
          <td class="muted"><?= e($log['created_at']) ?></td>
          <td><span class="badge badge-indigo"><?= e($log['action']) ?></span></td>
          <td><?= e($log['user_name'] ?? 'system') ?><br><span class="muted"><?= e($log['user_email'] ?? '') ?></span></td>
          <td class="mono"><?= e((string) ($log['meta_json'] ?? '')) ?></td>
          <td class="muted"><?= e($log['ip'] ?? '') ?></td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$logs): ?>
        <tr><td colspan="5" class="muted">No activity recorded.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/partials/footer.php'; ?>
