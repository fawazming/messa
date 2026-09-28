<?php
/**
 * MESSA server configuration.
 * Load order: defaults -> .env -> config.local.php (highest priority).
 */

$defaults = [
  'db' => [
    'host' => '127.0.0.1',
    'name' => 'messa',
    'user' => 'root',
    'pass' => '',
    'charset' => 'utf8mb4',
  ],
  'app' => [
    'base_url' => 'http://localhost:8080',
    'name' => 'MESSA',
    'timezone' => 'Africa/Lagos',
    'debug' => true,
  ],
  'registration' => [
    'fee' => 5000,
    'currency' => 'NGN',
    'whatsapp' => '2348108097322',
    'whatsapp_display' => '08108097322',
    'vendor' => 'RayyanTech',
    'token_prefix' => 'MESSA',
  ],
  'security' => [
    'cors_origins' => '*',
    'app_secret' => 'messa-development-secret',
  ],
];

/** Parse a simple KEY=VALUE .env file. */
$read_env = static function (string $file): array {
  if (!is_file($file)) {
    return [];
  }
  $vars = [];
  foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
      continue;
    }
    [$key, $value] = explode('=', $line, 2);
    $key = trim($key);
    $value = trim($value);
    if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[0] === substr($value, -1)) {
      $value = substr($value, 1, -1);
    }
    $vars[$key] = $value;
  }
  return $vars;
};

$env = $read_env(__DIR__ . '/.env');

$fromEnv = [];
$map = [
  'APP_BASE_URL' => ['app', 'base_url', 'string'],
  'APP_NAME' => ['app', 'name', 'string'],
  'APP_TIMEZONE' => ['app', 'timezone', 'string'],
  'APP_DEBUG' => ['app', 'debug', 'bool'],
  'APP_SECRET' => ['security', 'app_secret', 'string'],
  'CORS_ORIGINS' => ['security', 'cors_origins', 'string'],
  'DB_HOST' => ['db', 'host', 'string'],
  'DB_NAME' => ['db', 'name', 'string'],
  'DB_USER' => ['db', 'user', 'string'],
  'DB_PASS' => ['db', 'pass', 'string'],
  'DB_CHARSET' => ['db', 'charset', 'string'],
  'REG_FEE' => ['registration', 'fee', 'int'],
  'REG_CURRENCY' => ['registration', 'currency', 'string'],
  'WHATSAPP' => ['registration', 'whatsapp', 'string'],
  'WHATSAPP_DISPLAY' => ['registration', 'whatsapp_display', 'string'],
  'VENDOR' => ['registration', 'vendor', 'string'],
];
foreach ($map as $envKey => [$section, $key, $type]) {
  if (!array_key_exists($envKey, $env)) {
    continue;
  }
  $value = $env[$envKey];
  if ($type === 'int') {
    $value = (int) $value;
  } elseif ($type === 'bool') {
    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
  }
  $fromEnv[$section][$key] = $value;
}

$config = array_replace_recursive($defaults, $fromEnv);

$localFile = __DIR__ . '/config.local.php';
if (is_file($localFile)) {
  $loaded = require $localFile;
  if (is_array($loaded)) {
    $config = array_replace_recursive($config, $loaded);
  }
}

return $config;
