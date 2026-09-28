<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
$admin = require_admin();

if (request_method() === 'POST') {
  csrf_verify($_POST['csrf'] ?? null);
  if (post('action') === 'delete') {
    $id = (int) post('id');
    Db::delete('data_tables', 'id = :id', ['id' => $id]);
    log_activity((int) $admin['id'], 'admin.table_delete', ['table_id' => $id]);
    flash('success', 'Table deleted.');
  }
  redirect('tables.php');
}

$tables = Db::all(
  'SELECT t.*, u.name AS owner_name, u.email AS owner_email
   FROM data_tables t JOIN users u ON u.id = t.user_id
   ORDER BY t.id DESC LIMIT 300'
);

$pageTitle = 'Data Tables';
$active = 'tables';
require __DIR__ . '/partials/header.php';
?>

<div class="panel">
  <h2>All data tables (<?= count($tables) ?>)</h2>
  <p class="muted">Each user can keep up to 10 tables of 512 rows. Tables are syncable with
    <span class="mono">sheet.spacet.me</span> JSON endpoints and expose a public read-only URL.</p>
  <table>
    <thead><tr><th>Table</th><th>Owner</th><th class="num">Rows</th><th>Public URL</th><th>Updated</th><th>Actions</th></tr></thead>
    <tbody>
      <?php foreach ($tables as $t): ?>
        <tr>
          <td><strong><?= e($t['name']) ?></strong><br><span class="muted mono"><?= e($t['slug']) ?></span></td>
          <td><?= e($t['owner_name']) ?><br><span class="muted"><?= e($t['owner_email']) ?></span></td>
          <td class="num"><?= (int) $t['row_count'] ?></td>
          <td class="mono"><a href="<?= e($t['public_url'] ?? public_export_url($t['public_token'])) ?>" target="_blank" rel="noopener">.json</a></td>
          <td class="muted"><?= e(time_ago_short($t['updated_at'])) ?></td>
          <td>
            <div class="actions">
              <a class="btn btn-sm btn-line" href="table_view.php?id=<?= (int) $t['id'] ?>">View</a>
              <form method="post" class="inline" onsubmit="return confirm('Delete table and all rows?')"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $t['id'] ?>"><button class="btn btn-sm btn-danger" type="submit">Delete</button></form>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$tables): ?>
        <tr><td colspan="6" class="muted">No tables yet.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/partials/footer.php'; ?>
