<?php
declare(strict_types=1);

require __DIR__ . '/../lib/bootstrap.php';
require __DIR__ . '/../lib/tables.php';

apply_cors();

if (request_method() === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$method = request_method();
$path = request_path();

try {
  if ($path === '/api/health' || $path === '/api') {
    json_response(['ok' => true, 'name' => config('app.name', 'MESSA'), 'time' => now()]);
  }

  // Public, sheet.spacet.me-compatible export endpoint.
  if (preg_match('#^/sheet/([A-Za-z0-9]+)\.json$#', $path, $matches)) {
    $rows = export_rows_by_public_token($matches[1]);
    if ($rows === null) {
      json_error('Not found', 404);
    }
    json_response($rows);
  }

  if (strpos($path, '/api/') === 0) {
    $segments = array_values(array_filter(explode('/', substr($path, 5)), static fn($s) => $s !== ''));
    route_api($method, $segments);
  }

  json_error('Not found', 404);
} catch (RuntimeException $error) {
  json_error($error->getMessage(), 400);
} catch (Throwable $error) {
  error_log('[MESSA] ' . $error->getMessage() . ' @ ' . $error->getFile() . ':' . $error->getLine());
  $message = (bool) config('app.debug', false)
    ? $error->getMessage() . ' @ ' . basename($error->getFile()) . ':' . $error->getLine()
    : 'Server error. Please try again.';
  json_error($message, 500);
}

function route_api(string $method, array $segments): void
{
  $resource = $segments[0] ?? '';

  if ($resource === 'auth') {
    route_auth($method, array_slice($segments, 1));
  }

  $user = require_api_user();

  if ($resource === 'me' && $method === 'GET') {
    json_response(['ok' => true, 'user' => public_user($user)]);
  }

  if ($resource === 'stats' && $method === 'GET') {
    $limits = table_limits($user);
    $tablesCount = count_tables((int) $user['id']);
    $totalRows = (int) Db::value(
      'SELECT COALESCE(SUM(row_count), 0) FROM data_tables WHERE user_id = ?',
      [(int) $user['id']]
    );
    json_response([
      'ok' => true,
      'stats' => [
        'tables' => $tablesCount,
        'max_tables' => $limits['max_tables'],
        'total_rows' => $totalRows,
        'max_rows' => $limits['max_rows'],
      ],
    ]);
  }

  if ($resource === 'tables') {
    route_tables($method, $user, array_slice($segments, 1));
  }

  json_error('Not found', 404);
}

function route_auth(string $method, array $segments): void
{
  $action = $segments[0] ?? '';

  if ($action === 'register' && $method === 'POST') {
    [$user, $token] = register_user(read_json_body());
    json_response(['ok' => true, 'token' => $token, 'user' => public_user($user)], 201);
  }

  if ($action === 'login' && $method === 'POST') {
    $body = read_json_body();
    require_fields($body, ['email', 'password']);
    $user = login_user((string) $body['email'], (string) $body['password']);
    if (!$user) {
      json_error('Invalid email or password.', 401);
    }
    $token = create_api_token((int) $user['id'], 'app-login');
    json_response(['ok' => true, 'token' => $token, 'user' => public_user($user)]);
  }

  if ($action === 'logout' && $method === 'POST') {
    $token = bearer_token();
    if ($token) {
      revoke_api_token($token);
    }
    json_response(['ok' => true]);
  }

  json_error('Not found', 404);
}

function route_tables(string $method, array $user, array $segments): void
{
  // /tables
  if (!$segments) {
    if ($method === 'GET') {
      json_response(['ok' => true, 'tables' => array_map('table_public_array', list_tables((int) $user['id']))]);
    }
    if ($method === 'POST') {
      $body = read_json_body();
      require_fields($body, ['name']);
      $columns = isset($body['columns']) && is_array($body['columns']) ? $body['columns'] : [];
      $sourceUrl = isset($body['source_url']) && is_string($body['source_url']) ? $body['source_url'] : null;
      $table = create_table($user, (string) $body['name'], $columns, $sourceUrl);
      json_response(['ok' => true, 'table' => table_public_array($table)], 201);
    }
    json_error('Method not allowed', 405);
  }

  $tableId = (int) $segments[0];
  $table = find_table($tableId, (int) $user['id']);
  if (!$table) {
    json_error('Table not found', 404);
  }

  // /tables/{id}
  if (count($segments) === 1) {
    if ($method === 'GET') {
      json_response(['ok' => true, 'table' => table_public_array($table), 'rows' => get_rows($tableId)]);
    }
    if ($method === 'PUT') {
      $body = read_json_body();
      $columns = isset($body['columns']) && is_array($body['columns']) ? $body['columns'] : null;
      $sourceUrl = array_key_exists('source_url', $body) ? $body['source_url'] : false;
      $updated = update_table($table, $body['name'] ?? null, $columns, $sourceUrl);
      json_response(['ok' => true, 'table' => table_public_array($updated)]);
    }
    if ($method === 'DELETE') {
      delete_table($table);
      json_response(['ok' => true]);
    }
    json_error('Method not allowed', 405);
  }

  $sub = $segments[1];

  // /tables/{id}/rows
  if ($sub === 'rows') {
    if (count($segments) === 2) {
      if ($method === 'GET') {
        json_response(['ok' => true, 'rows' => get_rows($tableId)]);
      }
      if ($method === 'POST') {
        $body = read_json_body();
        $record = isset($body['data']) && is_array($body['data']) ? $body['data'] : $body;
        json_response(['ok' => true, 'row' => add_row($table, normalize_record($record))], 201);
      }
      json_error('Method not allowed', 405);
    }

    $rowId = (int) $segments[2];
    if ($method === 'PUT') {
      $body = read_json_body();
      $record = isset($body['data']) && is_array($body['data']) ? $body['data'] : $body;
      $row = update_row($table, $rowId, normalize_record($record));
      if (!$row) {
        json_error('Row not found', 404);
      }
      json_response(['ok' => true, 'row' => $row]);
    }
    if ($method === 'DELETE') {
      if (!delete_row($table, $rowId)) {
        json_error('Row not found', 404);
      }
      json_response(['ok' => true]);
    }
    json_error('Method not allowed', 405);
  }

  // /tables/{id}/replace  (bulk sync from the app)
  if ($sub === 'replace' && $method === 'POST') {
    $body = read_json_body();
    $records = isset($body['rows']) && is_array($body['rows']) ? $body['rows'] : [];
    $count = replace_rows($table, array_map('normalize_record', $records));
    $fresh = find_table($tableId, (int) $user['id']);
    json_response(['ok' => true, 'row_count' => $count, 'table' => table_public_array($fresh)]);
  }

  // /tables/{id}/import  (pull from sheet.spacet.me)
  if ($sub === 'import' && $method === 'POST') {
    $body = read_json_body();
    $url = isset($body['url']) && is_string($body['url']) ? trim($body['url']) : (string) ($table['source_url'] ?? '');
    if ($url === '') {
      json_error('Provide a sheet.spacet.me JSON URL.', 422);
    }
    $result = import_from_sheet($table, $url);
    $fresh = find_table($tableId, (int) $user['id']);
    json_response(['ok' => true, 'imported' => $result['imported'], 'table' => table_public_array($fresh)]);
  }

  // /tables/{id}/export
  if ($sub === 'export' && $method === 'GET') {
    $rows = get_rows($tableId);
    $records = array_map(static fn(array $row) => $row['data'], $rows);
    $format = strtolower((string) ($_GET['format'] ?? 'json'));

    if ($format === 'csv') {
      header('Content-Type: text/csv; charset=utf-8');
      header('Content-Disposition: attachment; filename="' . $table['slug'] . '.csv"');
      $out = fopen('php://output', 'w');
      $columns = decode_columns($table['columns_json'] ?? null);
      if (!$columns && $records) {
        $columns = array_keys($records[0]);
      }
      fputcsv($out, $columns);
      foreach ($records as $record) {
        $line = [];
        foreach ($columns as $column) {
          $line[] = $record[$column] ?? '';
        }
        fputcsv($out, $line);
      }
      fclose($out);
      exit;
    }

    json_response($records);
  }

  json_error('Not found', 404);
}

function normalize_record(array $record): array
{
  $clean = [];
  foreach ($record as $key => $value) {
    if (!is_string($key) || $key === '') {
      continue;
    }
    if (is_array($value) || is_object($value)) {
      continue;
    }
    $clean[$key] = $value === null ? '' : (is_bool($value) ? ($value ? 'TRUE' : 'FALSE') : (string) $value);
  }
  return $clean;
}
