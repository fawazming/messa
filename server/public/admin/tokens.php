<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
$admin = require_admin();

if (request_method() === 'POST') {
  csrf_verify($_POST['csrf'] ?? null);
  $action = post('action');

  if ($action === 'generate') {
    $count = max(1, min(100, (int) post('count', '1')));
    $amount = max(0, (int) post('amount', (string) config('registration.fee', 5000)));
    $note = post('note');
    $expiresDays = (int) post('expires_days', '0');
    $expiresAt = $expiresDays > 0 ? date('Y-m-d H:i:s', time() + $expiresDays * 86400) : null;
    $created = [];
    for ($i = 0; $i < $count; $i++) {
      do {
        $token = generate_registration_token();
      } while (Db::value('SELECT id FROM registration_tokens WHERE token = ?', [$token]) !== null);
      Db::insert('registration_tokens', [
        'token' => $token,
        'amount' => $amount,
        'status' => 'unused',
        'note' => $note !== '' ? $note : null,
        'created_by' => (int) $admin['id'],
        'expires_at' => $expiresAt,
        'created_at' => now(),
      ]);
      $created[] = $token;
    }
    log_activity((int) $admin['id'], 'admin.tokens_generate', ['count' => $count, 'amount' => $amount]);
    flash('success', 'Generated ' . count($created) . ' token(s): ' . implode(', ', $created));
  } elseif ($action === 'revoke') {
    $id = (int) post('id');
    Db::run('UPDATE registration_tokens SET status = "revoked" WHERE id = ? AND status = "unused"', [$id]);
    log_activity((int) $admin['id'], 'admin.token_revoke', ['token_id' => $id]);
    flash('success', 'Token revoked.');
  } elseif ($action === 'delete') {
    $id = (int) post('id');
    Db::delete('registration_tokens', 'id = :id', ['id' => $id]);
    log_activity((int) $admin['id'], 'admin.token_delete', ['token_id' => $id]);
    flash('success', 'Token deleted.');
  }

  redirect('tokens.php');
}

$tokens = Db::all(
  'SELECT t.*, u.name AS used_by_name, u.email AS used_by_email
   FROM registration_tokens t LEFT JOIN users u ON u.id = t.used_by
   ORDER BY t.id DESC LIMIT 300'
);
$summary = [
  'unused' => (int) Db::value('SELECT COUNT(*) FROM registration_tokens WHERE status = "unused"'),
  'used' => (int) Db::value('SELECT COUNT(*) FROM registration_tokens WHERE status = "used"'),
  'revoked' => (int) Db::value('SELECT COUNT(*) FROM registration_tokens WHERE status = "revoked"'),
];

$pageTitle = 'Registration Tokens';
$active = 'tokens';
require __DIR__ . '/partials/header.php';
?>

<div class="grid">
  <div class="card"><div class="label">Unused</div><div class="value"><?= $summary['unused'] ?></div></div>
  <div class="card"><div class="label">Used</div><div class="value"><?= $summary['used'] ?></div></div>
  <div class="card"><div class="label">Revoked</div><div class="value"><?= $summary['revoked'] ?></div></div>
  <div class="card">
    <div class="label">Payment</div>
    <div class="value" style="font-size:20px"><?= e(config('registration.currency', 'NGN')) ?> <?= number_format((int) config('registration.fee', 5000)) ?></div>
    <div class="sub">WhatsApp <?= e(config('registration.whatsapp_display', '')) ?> · <?= e(config('registration.vendor', '')) ?></div>
  </div>
</div>

<div class="panel" id="generate">
  <h2>Generate tokens</h2>
  <p class="muted">Buyers pay <?= e(config('registration.currency', 'NGN')) ?> <?= number_format((int) config('registration.fee', 5000)) ?>
    via WhatsApp <strong><?= e(config('registration.whatsapp_display', '')) ?></strong> (<?= e(config('registration.vendor', '')) ?>),
    then you issue them a token to register in the app.</p>
  <form method="post" action="tokens.php" class="form-row">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="action" value="generate">
    <div class="field"><label>How many</label><input type="number" name="count" value="1" min="1" max="100"></div>
    <div class="field"><label>Amount (<?= e(config('registration.currency', 'NGN')) ?>)</label><input type="number" name="amount" value="<?= (int) config('registration.fee', 5000) ?>"></div>
    <div class="field"><label>Note / buyer</label><input type="text" name="note" placeholder="e.g. Abdul, paid via transfer"></div>
    <div class="field"><label>Expires in (days, 0 = never)</label><input type="number" name="expires_days" value="0" min="0"></div>
    <button class="btn" type="submit">Generate</button>
  </form>
  <p class="muted">Share this link with buyers: <a href="<?= e(whatsapp_link()) ?>" target="_blank" rel="noopener"><?= e(whatsapp_link()) ?></a></p>
</div>

<div class="panel">
  <h2>All tokens (<?= count($tokens) ?>)</h2>
  <table>
    <thead><tr><th>Token</th><th class="num">Amount</th><th>Status</th><th>Buyer</th><th>Used by</th><th>Created</th><th>Actions</th></tr></thead>
    <tbody>
      <?php foreach ($tokens as $t): ?>
        <tr>
          <td class="mono"><strong><?= e($t['token']) ?></strong><?php if (!empty($t['note'])): ?><br><span class="muted"><?= e($t['note']) ?></span><?php endif; ?></td>
          <td class="num"><?= number_format((int) $t['amount']) ?></td>
          <td>
            <?php
              $badge = $t['status'] === 'unused' ? 'badge-green' : ($t['status'] === 'used' ? 'badge-gray' : 'badge-red');
            ?>
            <span class="badge <?= $badge ?>"><?= e($t['status']) ?></span>
          </td>
          <td class="muted"><?= e(time_ago_short($t['created_at'])) ?></td>
          <td>
            <?php if ($t['used_by_name']): ?>
              <?= e($t['used_by_name']) ?><br><span class="muted"><?= e($t['used_by_email']) ?></span>
            <?php else: ?>
              <span class="muted">—</span>
            <?php endif; ?>
          </td>
          <td class="muted"><?= e($t['created_at']) ?></td>
          <td>
            <div class="actions">
              <?php if ($t['status'] === 'unused'): ?>
                <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="revoke"><input type="hidden" name="id" value="<?= (int) $t['id'] ?>"><button class="btn btn-sm btn-line" type="submit">Revoke</button></form>
              <?php endif; ?>
              <form method="post" class="inline" onsubmit="return confirm('Delete this token?')"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $t['id'] ?>"><button class="btn btn-sm btn-danger" type="submit">Delete</button></form>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
      <?php if (!$tokens): ?>
        <tr><td colspan="7" class="muted">No tokens yet. Generate some above.</td></tr>
      <?php endif; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/partials/footer.php'; ?>
