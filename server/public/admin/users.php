<?php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
$admin = require_admin();

if (request_method() === 'POST') {
  csrf_verify($_POST['csrf'] ?? null);
  $action = post('action');
  $id = (int) post('id');

  if ($action === 'create') {
    $name = post('name');
    $email = strtolower(post('email'));
    $password = (string) ($_POST['password'] ?? '');
    $role = post('role') === 'admin' ? 'admin' : 'user';
    if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
      flash('error', 'Provide a name, a valid email and a password of at least 6 characters.');
    } elseif (Db::value('SELECT id FROM users WHERE email = ?', [$email]) !== null) {
      flash('error', 'That email is already registered.');
    } else {
      Db::insert('users', [
        'name' => $name,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role,
        'status' => 'active',
        'max_tables' => 10,
        'max_rows' => 512,
        'created_at' => now(),
      ]);
      log_activity((int) $admin['id'], 'admin.user_create', ['email' => $email]);
      flash('success', 'User created.');
    }
  } elseif ($action === 'toggle_status' && $id !== (int) $admin['id']) {
    $user = Db::one('SELECT status FROM users WHERE id = ?', [$id]);
    if ($user) {
      $next = $user['status'] === 'active' ? 'suspended' : 'active';
      Db::update('users', ['status' => $next], 'id = :id', ['id' => $id]);
      log_activity((int) $admin['id'], 'admin.user_status', ['user_id' => $id, 'status' => $next]);
      flash('success', 'User status updated.');
    }
  } elseif ($action === 'toggle_role' && $id !== (int) $admin['id']) {
    $user = Db::one('SELECT role FROM users WHERE id = ?', [$id]);
    if ($user) {
      $next = $user['role'] === 'admin' ? 'user' : 'admin';
      Db::update('users', ['role' => $next], 'id = :id', ['id' => $id]);
      log_activity((int) $admin['id'], 'admin.user_role', ['user_id' => $id, 'role' => $next]);
      flash('success', 'User role updated.');
    }
  } elseif ($action === 'reset_password') {
    $temporary = substr(random_hex(8), 0, 10);
    Db::update('users', ['password_hash' => password_hash($temporary, PASSWORD_DEFAULT)], 'id = :id', ['id' => $id]);
    Db::update('api_tokens', ['revoked_at' => now()], 'user_id = :uid AND revoked_at IS NULL', ['uid' => $id]);
    log_activity((int) $admin['id'], 'admin.password_reset', ['user_id' => $id]);
    flash('success', 'Temporary password: ' . $temporary . ' — share it once, then ask the user to change it.');
  } elseif ($action === 'delete' && $id !== (int) $admin['id']) {
    Db::delete('users', 'id = :id', ['id' => $id]);
    log_activity((int) $admin['id'], 'admin.user_delete', ['user_id' => $id]);
    flash('success', 'User deleted.');
  }

  redirect('users.php');
}

$users = Db::all(
  'SELECT u.*, (SELECT COUNT(*) FROM data_tables t WHERE t.user_id = u.id) AS table_count
   FROM users u ORDER BY u.id DESC'
);

$pageTitle = 'Users';
$active = 'users';
require __DIR__ . '/partials/header.php';
?>

<div class="panel">
  <h2>Create user</h2>
  <form method="post" action="users.php" class="form-row">
    <input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>">
    <input type="hidden" name="action" value="create">
    <div class="field"><label>Name</label><input type="text" name="name" required></div>
    <div class="field"><label>Email</label><input type="email" name="email" required></div>
    <div class="field"><label>Password</label><input type="text" name="password" required></div>
    <div class="field"><label>Role</label>
      <select name="role"><option value="user">user</option><option value="admin">admin</option></select>
    </div>
    <button class="btn" type="submit">Create</button>
  </form>
</div>

<div class="panel">
  <h2>All users (<?= count($users) ?>)</h2>
  <table>
    <thead>
      <tr><th>#</th><th>User</th><th>Role</th><th>Status</th><th class="num">Tables</th><th>Joined</th><th>Last login</th><th>Actions</th></tr>
    </thead>
    <tbody>
      <?php foreach ($users as $u): ?>
        <tr>
          <td class="muted"><?= (int) $u['id'] ?></td>
          <td>
            <strong><?= e($u['name']) ?></strong><br>
            <span class="muted"><?= e($u['email']) ?></span>
            <?php if (!empty($u['phone'])): ?><br><span class="muted"><?= e($u['phone']) ?></span><?php endif; ?>
          </td>
          <td><span class="badge <?= $u['role'] === 'admin' ? 'badge-indigo' : 'badge-gray' ?>"><?= e($u['role']) ?></span></td>
          <td><span class="badge <?= $u['status'] === 'active' ? 'badge-green' : 'badge-red' ?>"><?= e($u['status']) ?></span></td>
          <td class="num"><?= (int) $u['table_count'] ?> / <?= (int) $u['max_tables'] ?></td>
          <td class="muted"><?= e(time_ago_short($u['created_at'])) ?></td>
          <td class="muted"><?= e(time_ago_short($u['last_login_at'])) ?></td>
          <td>
            <div class="actions">
              <?php if ((int) $u['id'] !== (int) $admin['id']): ?>
                <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="toggle_status"><input type="hidden" name="id" value="<?= (int) $u['id'] ?>"><button class="btn btn-sm btn-line" type="submit"><?= $u['status'] === 'active' ? 'Suspend' : 'Activate' ?></button></form>
                <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="toggle_role"><input type="hidden" name="id" value="<?= (int) $u['id'] ?>"><button class="btn btn-sm btn-line" type="submit"><?= $u['role'] === 'admin' ? 'Make user' : 'Make admin' ?></button></form>
              <?php endif; ?>
              <form method="post" class="inline"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="reset_password"><input type="hidden" name="id" value="<?= (int) $u['id'] ?>"><button class="btn btn-sm btn-line" type="submit">Reset password</button></form>
              <?php if ((int) $u['id'] !== (int) $admin['id']): ?>
                <form method="post" class="inline" onsubmit="return confirm('Delete this user and all their tables?')"><input type="hidden" name="csrf" value="<?= e(csrf_token()) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $u['id'] ?>"><button class="btn btn-sm btn-danger" type="submit">Delete</button></form>
              <?php endif; ?>
            </div>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>

<?php require __DIR__ . '/partials/footer.php'; ?>
