<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require_admin();

$id = get_int('id');
$table = Db::one(
  'SELECT t.*, u.name AS owner_name, u.email AS owner_email
   FROM data_tables t JOIN users u ON u.id = t.user_id WHERE t.id = ?',
  [$id]
);

if (!$table) {
  flash('error', 'Table not found.');
  redirect('tables.php');
}

$rows = get_rows($id);
$columns = decode_columns($table['columns_json'] ?? null);
if (!$columns && $rows) {
  $columns = array_keys($rows[0]['data']);
}

$pageTitle = 'Table · ' . $table['name'];
$active = 'tables';
require __DIR__ . '/partials/header.php';
?>

<div class="panel">
  <h2><?= e($table['name']) ?></h2>
  <p class="muted">
    Owner: <strong><?= e($table['owner_name']) ?></strong> (<?= e($table['owner_email']) ?>) ·
    <?= (int) $table['row_count'] ?> rows · updated <?= e(time_ago_short($table['updated_at'])) ?>
  </p>
  <p class="mono">
    Public JSON: <a href="<?= e(public_export_url($table['public_token'])) ?>" target="_blank" rel="noopener"><?= e(public_export_url($table['public_token'])) ?></a><br>
    <?php if (!empty($table['source_url'])): ?>
      Source: <?= e($table['source_url']) ?><br>
    <?php endif; ?>
  </p>
</div>

<div class="panel">
  <h2>Rows (<?= count($rows) ?>)</h2>
  <div style="overflow:auto">
    <table>
      <thead>
        <tr><th>#</th><?php foreach ($columns as $column): ?><th><?= e($column) ?></th><?php endforeach; ?></tr>
      </thead>
      <tbody>
        <?php foreach ($rows as $row): ?>
          <tr>
            <td class="muted"><?= (int) $row['position'] + 1 ?></td>
            <?php foreach ($columns as $column): ?>
              <td><?= e((string) ($row['data'][$column] ?? '')) ?></td>
            <?php endforeach; ?>
          </tr>
        <?php endforeach; ?>
        <?php if (!$rows): ?>
          <tr><td class="muted" colspan="<?= count($columns) + 1 ?>">This table is empty.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>
</div>

<p><a class="btn btn-line" href="tables.php">← Back to tables</a></p>

<?php require __DIR__ . '/partials/footer.php'; ?>
