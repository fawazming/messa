<?php
declare(strict_types=1);

function apply_cors(): void
{
  $origins = (string) config('security.cors_origins', '*');
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  if ($origins === '*') {
    header('Access-Control-Allow-Origin: *');
  } elseif ($origin !== '') {
    $allowed = array_map('trim', explode(',', $origins));
    if (in_array($origin, $allowed, true)) {
      header('Access-Control-Allow-Origin: ' . $origin);
      header('Vary: Origin');
    }
  }
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
  header('Access-Control-Max-Age: 86400');
}

function json_response($data, int $code = 200): void
{
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function json_error(string $message, int $code = 400, array $extra = []): void
{
  json_response(array_merge(['ok' => false, 'error' => $message], $extra), $code);
}

function read_json_body(): array
{
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') {
    return [];
  }
  $decoded = json_decode($raw, true);
  return is_array($decoded) ? $decoded : [];
}

function request_method(): string
{
  return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function request_path(): string
{
  $uri = $_SERVER['REQUEST_URI'] ?? '/';
  $path = parse_url($uri, PHP_URL_PATH) ?: '/';
  // Support /index.php/api/... fallback when mod_rewrite is unavailable.
  $script = $_SERVER['SCRIPT_NAME'] ?? '';
  if ($script !== '' && strpos($path, $script) === 0) {
    $path = substr($path, strlen($script));
  }
  if ($path === '' || $path === false) {
    $path = '/';
  }
  if ($path[0] !== '/') {
    $path = '/' . $path;
  }
  return rtrim($path, '/') === '' ? '/' : rtrim($path, '/');
}

function bearer_token(): ?string
{
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if ($header === '' && function_exists('apache_request_headers')) {
    $headers = apache_request_headers();
    foreach ($headers as $key => $value) {
      if (strcasecmp($key, 'Authorization') === 0) {
        $header = $value;
        break;
      }
    }
  }
  if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
    return trim($matches[1]);
  }
  return null;
}

function require_fields(array $data, array $fields): void
{
  $missing = [];
  foreach ($fields as $field) {
    if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
      $missing[] = $field;
    }
  }
  if ($missing) {
    json_error('Missing required field(s): ' . implode(', ', $missing), 422);
  }
}
