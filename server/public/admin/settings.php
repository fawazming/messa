<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
require_admin();

$checks = [
  'PHP version' => PHP_VERSION,
  'PDO MySQL' => extension_loaded('pdo_mysql') ? 'available' : 'MISSING',
  'cURL' => extension_loaded('curl') ? 'available' : 'not loaded (falls back to file_get_contents)',
  'OpenSSL' => extension_loaded('openssl') ? 'available' : 'MISSING',
  'mbstring' => extension_loaded('mbstring') ? 'available' : 'not loaded',
  'Database' => 'connected',
];

try {
  Db::value('SELECT 1');
} catch (Throwable $error) {
  $checks['Database'] = 'ERROR: ' . $error->getMessage();
}

$pageTitle = 'Settings';
$active = 'settings';
require __DIR__ . '/partials/header.php';
?>

<div class="panel">
  <h2>Environment</h2>
  <table>
    <tbody>
      <tr><td class="muted">App name</td><td><?= e(config('app.name', 'MESSA')) ?></td></tr>
      <tr><td class="muted">Base URL</td><td class="mono"><?= e(config('app.base_url', '')) ?></td></tr>
      <tr><td class="muted">Timezone</td><td><?= e(config('app.timezone', 'UTC')) ?></td></tr>
      <tr><td class="muted">Debug mode</td><td><?= config('app.debug') ? 'ON (disable in production)' : 'off' ?></td></tr>
      <tr><td class="muted">CORS origins</td><td class="mono"><?= e(config('security.cors_origins', '*')) ?></td></tr>
      <tr><td class="muted">Database</td><td class="mono"><?= e(config('db.user', '')) ?>@<?= e(config('db.host', '')) ?>/<?= e(config('db.name', '')) ?></td></tr>
      <tr><td class="muted">Registration fee</td><td><?= e(config('registration.currency', 'NGN')) ?> <?= number_format((int) config('registration.fee', 5000)) ?></td></tr>
      <tr><td class="muted">WhatsApp</td><td><?= e(config('registration.whatsapp_display', '')) ?> (<?= e(config('registration.vendor', '')) ?>)</td></tr>
    </tbody>
  </table>
  <p class="muted" style="margin-top:12px">
    Edit these values in <span class="mono">server/.env</span> (gitignored) or
    <span class="mono">server/config.local.php</span>. Set <span class="mono">APP_DEBUG=false</span> in production.
  </p>
</div>

<div class="panel">
  <h2>System checks</h2>
  <table>
    <tbody>
      <?php foreach ($checks as $label => $value): ?>
        <tr>
          <td class="muted"><?= e($label) ?></td>
          <td>
            <?php $ok = stripos((string) $value, 'missing') === false && stripos((string) $value, 'error') === false; ?>
            <span class="badge <?= $ok ? 'badge-green' : 'badge-red' ?>"><?= e((string) $value) ?></span>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<div class="panel">
  <h2>Deployment notes</h2>
  <ol class="muted" style="line-height:1.7">
    <li>Import <span class="mono">server/sql/schema.sql</span> into the configured MySQL database.</li>
    <li>Create an admin account: <span class="mono">php server/seed.php you@example.com "StrongPass123" "Your Name"</span></li>
    <li>Point the domain <span class="mono">messa.sgm.ng</span> document root to <span class="mono">server/public</span>.</li>
    <li>Ensure <span class="mono">mod_rewrite</span> is enabled so <span class="mono">/api/*</span> and <span class="mono">/sheet/*.json</span> route through <span class="mono">index.php</span>.</li>
    <li>Add the API base URL <span class="mono"><?= e(rtrim((string) config('app.base_url', ''), '/')) ?>/api</span> in the MESSA app.</li>
  </ol>
</div>

<?php require __DIR__ . '/partials/footer.php'; ?>
