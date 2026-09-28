<?php
declare(strict_types=1);

/* -------------------------------------------------------------------------- */
/* Password + API tokens                                                       */
/* -------------------------------------------------------------------------- */

function create_api_token(int $userId, ?string $label = null): string
{
  $plain = random_hex(32);
  Db::insert('api_tokens', [
    'user_id' => $userId,
    'token_hash' => hash('sha256', $plain),
    'label' => $label,
    'created_at' => now(),
  ]);
  return $plain;
}

function find_user_by_api_token(string $plain): ?array
{
  $row = Db::one(
    'SELECT u.* FROM api_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ? AND t.revoked_at IS NULL LIMIT 1',
    [hash('sha256', $plain)]
  );
  if (!$row || $row['status'] !== 'active') {
    return null;
  }
  Db::run('UPDATE api_tokens SET last_used_at = ? WHERE token_hash = ?', [now(), hash('sha256', $plain)]);
  return $row;
}

function current_api_user(): ?array
{
  $token = bearer_token();
  if ($token === null) {
    return null;
  }
  return find_user_by_api_token($token);
}

function require_api_user(): array
{
  $user = current_api_user();
  if (!$user) {
    json_error('Unauthorized. Please sign in again.', 401);
  }
  return $user;
}

function revoke_api_token(string $plain): void
{
  Db::run('UPDATE api_tokens SET revoked_at = ? WHERE token_hash = ?', [now(), hash('sha256', $plain)]);
}

/* -------------------------------------------------------------------------- */
/* Registration + login                                                        */
/* -------------------------------------------------------------------------- */

function register_user(array $input): array
{
  require_fields($input, ['name', 'email', 'password', 'token']);

  $name = trim((string) $input['name']);
  $email = strtolower(trim((string) $input['email']));
  $password = (string) $input['password'];
  $token = strtoupper(trim((string) $input['token']));
  $phone = isset($input['phone']) ? trim((string) $input['phone']) : null;

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Enter a valid email address.', 422);
  }
  if (strlen($password) < 6) {
    json_error('Password must be at least 6 characters.', 422);
  }
  if (Db::value('SELECT id FROM users WHERE email = ?', [$email]) !== null) {
    json_error('An account with this email already exists.', 409);
  }

  $tokenRow = Db::one('SELECT * FROM registration_tokens WHERE token = ? LIMIT 1', [$token]);
  if (!$tokenRow) {
    json_error('Invalid registration token. Contact RayyanTech on WhatsApp to get one.', 422);
  }
  if ($tokenRow['status'] !== 'unused') {
    json_error('This registration token has already been used or revoked.', 422);
  }
  if (!empty($tokenRow['expires_at']) && strtotime((string) $tokenRow['expires_at']) < time()) {
    json_error('This registration token has expired.', 422);
  }

  $userId = Db::insert('users', [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    'role' => 'user',
    'status' => 'active',
    'max_tables' => 10,
    'max_rows' => 512,
    'created_at' => now(),
    'last_login_at' => now(),
  ]);

  Db::update('registration_tokens', [
    'status' => 'used',
    'used_by' => $userId,
    'used_at' => now(),
  ], 'id = :id', ['id' => (int) $tokenRow['id']]);

  $apiToken = create_api_token($userId, 'app-registration');
  log_activity($userId, 'auth.register', ['email' => $email]);

  $user = Db::one('SELECT * FROM users WHERE id = ?', [$userId]);
  return [$user, $apiToken];
}

function login_user(string $email, string $password): ?array
{
  $user = Db::one('SELECT * FROM users WHERE email = ? LIMIT 1', [strtolower(trim($email))]);
  if (!$user || !password_verify($password, (string) $user['password_hash'])) {
    return null;
  }
  if ($user['status'] !== 'active') {
    return null;
  }
  Db::run('UPDATE users SET last_login_at = ? WHERE id = ?', [now(), (int) $user['id']]);
  log_activity((int) $user['id'], 'auth.login');
  return $user;
}

function public_user(array $user): array
{
  return [
    'id' => (int) $user['id'],
    'name' => $user['name'],
    'email' => $user['email'],
    'phone' => $user['phone'],
    'role' => $user['role'],
    'max_tables' => (int) $user['max_tables'],
    'max_rows' => (int) $user['max_rows'],
    'created_at' => $user['created_at'],
  ];
}

/* -------------------------------------------------------------------------- */
/* Admin dashboard session                                                     */
/* -------------------------------------------------------------------------- */

function admin_session_start(): void
{
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }
  session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
  ]);
  session_start();
}

function csrf_token(): string
{
  admin_session_start();
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = random_hex(16);
  }
  return (string) $_SESSION['csrf'];
}

function csrf_verify(?string $token): void
{
  admin_session_start();
  if (!$token || empty($_SESSION['csrf']) || !hash_equals((string) $_SESSION['csrf'], $token)) {
    http_response_code(419);
    exit('Invalid CSRF token. Please go back and try again.');
  }
}

function admin_user(): ?array
{
  admin_session_start();
  if (empty($_SESSION['admin_user_id'])) {
    return null;
  }
  $user = Db::one('SELECT * FROM users WHERE id = ? AND role = ? LIMIT 1', [(int) $_SESSION['admin_user_id'], 'admin']);
  if (!$user || $user['status'] !== 'active') {
    return null;
  }
  return $user;
}

function require_admin(): array
{
  $admin = admin_user();
  if (!$admin) {
    header('Location: login.php');
    exit;
  }
  return $admin;
}

function admin_login(string $email, string $password): bool
{
  $user = Db::one('SELECT * FROM users WHERE email = ? AND role = ? LIMIT 1', [strtolower(trim($email)), 'admin']);
  if (!$user || !password_verify($password, (string) $user['password_hash']) || $user['status'] !== 'active') {
    return false;
  }
  admin_session_start();
  session_regenerate_id(true);
  $_SESSION['admin_user_id'] = (int) $user['id'];
  Db::run('UPDATE users SET last_login_at = ? WHERE id = ?', [now(), (int) $user['id']]);
  log_activity((int) $user['id'], 'admin.login');
  return true;
}

function admin_logout(): void
{
  admin_session_start();
  $_SESSION = [];
  session_destroy();
}
