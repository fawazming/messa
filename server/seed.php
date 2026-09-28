<?php
declare(strict_types=1);

/**
 * CLI setup helper.
 *
 *   php server/seed.php --schema                 # create tables from sql/schema.sql
 *   php server/seed.php --token                  # print a fresh registration token
 *   php server/seed.php you@example.com Pass123 "Your Name"   # create/update an admin
 */

if (PHP_SAPI !== 'cli') {
  http_response_code(403);
  exit("This script can only be run from the command line.\n");
}

require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/tables.php';

$args = array_slice($argv, 1);

if (in_array('--schema', $args, true)) {
  $sql = file_get_contents(__DIR__ . '/sql/schema.sql');
  if ($sql === false) {
    fwrite(STDERR, "Could not read sql/schema.sql\n");
    exit(1);
  }
  foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
    if ($statement === '' || str_starts_with($statement, '--')) {
      continue;
    }
    Db::pdo()->exec($statement);
  }
  echo "Schema applied.\n";
  exit(0);
}

if (in_array('--token', $args, true)) {
  echo generate_registration_token() . "\n";
  exit(0);
}

$email = $args[0] ?? null;
$password = $args[1] ?? null;
$name = $args[2] ?? 'Administrator';

if (!$email || !$password) {
  fwrite(STDERR, "Usage: php seed.php <email> <password> [name]\n");
  fwrite(STDERR, "       php seed.php --schema\n");
  fwrite(STDERR, "       php seed.php --token\n");
  exit(1);
}

$email = strtolower($email);
$existing = Db::one('SELECT id FROM users WHERE email = ?', [$email]);
$data = [
  'name' => $name,
  'email' => $email,
  'password_hash' => password_hash($password, PASSWORD_DEFAULT),
  'role' => 'admin',
  'status' => 'active',
  'max_tables' => 100,
  'max_rows' => 100000,
];

if ($existing) {
  Db::update('users', $data, 'id = :id', ['id' => (int) $existing['id']]);
  echo "Admin updated: {$email}\n";
} else {
  $data['created_at'] = now();
  Db::insert('users', $data);
  echo "Admin created: {$email}\n";
}
