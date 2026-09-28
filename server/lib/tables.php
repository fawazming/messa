<?php
declare(strict_types=1);

/* -------------------------------------------------------------------------- */
/* Table CRUD                                                                  */
/* -------------------------------------------------------------------------- */

function table_public_array(array $row): array
{
  return [
    'id' => (int) $row['id'],
    'name' => $row['name'],
    'slug' => $row['slug'],
    'columns' => decode_columns($row['columns_json'] ?? null),
    'row_count' => (int) $row['row_count'],
    'source_url' => $row['source_url'],
    'public_url' => public_export_url((string) $row['public_token']),
    'created_at' => $row['created_at'],
    'updated_at' => $row['updated_at'],
    'last_synced_at' => $row['last_synced_at'],
  ];
}

function find_table(int $tableId, int $userId): ?array
{
  return Db::one('SELECT * FROM data_tables WHERE id = ? AND user_id = ? LIMIT 1', [$tableId, $userId]);
}

function list_tables(int $userId): array
{
  return Db::all('SELECT * FROM data_tables WHERE user_id = ? ORDER BY updated_at DESC', [$userId]);
}

function count_tables(int $userId): int
{
  return (int) Db::value('SELECT COUNT(*) FROM data_tables WHERE user_id = ?', [$userId]);
}

function create_table(array $user, string $name, array $columns, ?string $sourceUrl = null): array
{
  $userId = (int) $user['id'];
  $limits = table_limits($user);
  if (count_tables($userId) >= $limits['max_tables']) {
    json_error('You have reached the maximum of ' . $limits['max_tables'] . ' tables for this account.', 422);
  }

  $name = trim($name) !== '' ? trim($name) : 'Untitled table';
  $columns = array_values(array_unique(array_filter(array_map('trim', $columns))));
  if (!$columns) {
    $columns = ['name', 'phone'];
  }

  $id = Db::insert('data_tables', [
    'user_id' => $userId,
    'name' => $name,
    'slug' => unique_slug($name, $userId),
    'columns_json' => json_encode($columns, JSON_UNESCAPED_UNICODE),
    'source_url' => $sourceUrl,
    'public_token' => random_hex(16),
    'row_count' => 0,
    'created_at' => now(),
    'updated_at' => now(),
  ]);
  log_activity($userId, 'table.create', ['table_id' => $id, 'name' => $name]);

  return find_table($id, $userId) ?? [];
}

function update_table(array $table, ?string $name, ?array $columns, $sourceUrl = false): array
{
  $data = ['updated_at' => now()];
  if ($name !== null && trim($name) !== '') {
    $data['name'] = trim($name);
  }
  if (is_array($columns)) {
    $columns = array_values(array_unique(array_filter(array_map('trim', $columns))));
    if ($columns) {
      $data['columns_json'] = json_encode($columns, JSON_UNESCAPED_UNICODE);
    }
  }
  if ($sourceUrl !== false) {
    $data['source_url'] = $sourceUrl === null ? null : trim((string) $sourceUrl);
  }
  Db::update('data_tables', $data, 'id = :id', ['id' => (int) $table['id']]);
  log_activity((int) $table['user_id'], 'table.update', ['table_id' => (int) $table['id']]);
  return find_table((int) $table['id'], (int) $table['user_id']) ?? $table;
}

function delete_table(array $table): void
{
  Db::delete('data_tables', 'id = :id', ['id' => (int) $table['id']]);
  log_activity((int) $table['user_id'], 'table.delete', ['table_id' => (int) $table['id']]);
}

/* -------------------------------------------------------------------------- */
/* Rows                                                                        */
/* -------------------------------------------------------------------------- */

function row_public_array(array $row): array
{
  $data = json_decode((string) $row['data_json'], true);
  return [
    'id' => (int) $row['id'],
    'position' => (int) $row['position'],
    'data' => is_array($data) ? $data : [],
    'updated_at' => $row['updated_at'],
  ];
}

function get_rows(int $tableId): array
{
  $rows = Db::all('SELECT * FROM table_rows WHERE table_id = ? ORDER BY position ASC, id ASC', [$tableId]);
  return array_map('row_public_array', $rows);
}

function get_row(int $rowId, int $tableId): ?array
{
  return Db::one('SELECT * FROM table_rows WHERE id = ? AND table_id = ? LIMIT 1', [$rowId, $tableId]);
}

function assert_row_capacity(array $table, int $addingCount): void
{
  $user = Db::one('SELECT max_rows FROM users WHERE id = ?', [(int) $table['user_id']]);
  $maxRows = (int) ($user['max_rows'] ?? 512);
  $current = (int) Db::value('SELECT COUNT(*) FROM table_rows WHERE table_id = ?', [(int) $table['id']]);
  if ($current + $addingCount > $maxRows) {
    json_error('This table can hold at most ' . $maxRows . ' rows.', 422);
  }
}

function add_row(array $table, array $record): array
{
  assert_row_capacity($table, 1);
  $nextPosition = (int) Db::value('SELECT COALESCE(MAX(position), -1) + 1 FROM table_rows WHERE table_id = ?', [(int) $table['id']]);
  $rowId = Db::insert('table_rows', [
    'table_id' => (int) $table['id'],
    'position' => $nextPosition,
    'data_json' => json_encode($record, JSON_UNESCAPED_UNICODE),
    'created_at' => now(),
    'updated_at' => now(),
  ]);
  sync_table_columns($table, [normalize_column_list($record)]);
  touch_table((int) $table['id']);
  log_activity((int) $table['user_id'], 'row.create', ['table_id' => (int) $table['id'], 'row_id' => $rowId]);
  $row = get_row($rowId, (int) $table['id']);
  return $row ? row_public_array($row) : [];
}

function update_row(array $table, int $rowId, array $record): ?array
{
  $row = get_row($rowId, (int) $table['id']);
  if (!$row) {
    return null;
  }
  Db::update('table_rows', [
    'data_json' => json_encode($record, JSON_UNESCAPED_UNICODE),
    'updated_at' => now(),
  ], 'id = :id', ['id' => $rowId]);
  sync_table_columns($table, [normalize_column_list($record)]);
  touch_table((int) $table['id']);
  log_activity((int) $table['user_id'], 'row.update', ['table_id' => (int) $table['id'], 'row_id' => $rowId]);
  $updated = get_row($rowId, (int) $table['id']);
  return $updated ? row_public_array($updated) : null;
}

function delete_row(array $table, int $rowId): bool
{
  $deleted = Db::delete('table_rows', 'id = :id AND table_id = :table_id', ['id' => $rowId, 'table_id' => (int) $table['id']]);
  if ($deleted > 0) {
    touch_table((int) $table['id']);
    log_activity((int) $table['user_id'], 'row.delete', ['table_id' => (int) $table['id'], 'row_id' => $rowId]);
  }
  return $deleted > 0;
}

/**
 * Replace every row in a table (used for full syncs from the app or a sheet).
 */
function replace_rows(array $table, array $records): int
{
  $userId = (int) $table['user_id'];
  $user = Db::one('SELECT max_rows FROM users WHERE id = ?', [$userId]);
  $maxRows = (int) ($user['max_rows'] ?? 512);
  if (count($records) > $maxRows) {
    json_error('This table can hold at most ' . $maxRows . ' rows; received ' . count($records) . '.', 422);
  }

  $pdo = Db::pdo();
  $pdo->beginTransaction();
  try {
    Db::delete('table_rows', 'table_id = :table_id', ['table_id' => (int) $table['id']]);
    $position = 0;
    foreach ($records as $record) {
      if (!is_array($record)) {
        continue;
      }
      Db::insert('table_rows', [
        'table_id' => (int) $table['id'],
        'position' => $position,
        'data_json' => json_encode($record, JSON_UNESCAPED_UNICODE),
        'created_at' => now(),
        'updated_at' => now(),
      ]);
      $position++;
    }
    $pdo->commit();
  } catch (Throwable $error) {
    $pdo->rollBack();
    throw $error;
  }

  sync_table_columns($table, array_map('normalize_column_list', $records));
  Db::update('data_tables', [
    'row_count' => $position,
    'last_synced_at' => now(),
    'updated_at' => now(),
  ], 'id = :id', ['id' => (int) $table['id']]);
  log_activity($userId, 'table.replace', ['table_id' => (int) $table['id'], 'rows' => $position]);
  return $position;
}

function sync_table_columns(array $table, array $columnSets): void
{
  $existing = decode_columns($table['columns_json'] ?? null);
  $merged = $existing;
  foreach ($columnSets as $columns) {
    foreach ($columns as $column) {
      if (!in_array($column, $merged, true)) {
        $merged[] = $column;
      }
    }
  }
  if ($merged !== $existing) {
    Db::update('data_tables', ['columns_json' => json_encode($merged, JSON_UNESCAPED_UNICODE)], 'id = :id', ['id' => (int) $table['id']]);
  }
}

function touch_table(int $tableId): void
{
  $count = (int) Db::value('SELECT COUNT(*) FROM table_rows WHERE table_id = ?', [$tableId]);
  Db::update('data_tables', ['row_count' => $count, 'updated_at' => now()], 'id = :id', ['id' => $tableId]);
}

function import_from_sheet(array $table, string $url): array
{
  $records = sheet_fetch($url);
  $count = replace_rows($table, $records);
  Db::update('data_tables', ['source_url' => $url], 'id = :id', ['id' => (int) $table['id']]);
  return ['imported' => $count, 'records' => $records];
}

function export_rows_by_public_token(string $publicToken): ?array
{
  $table = Db::one('SELECT * FROM data_tables WHERE public_token = ? LIMIT 1', [$publicToken]);
  if (!$table) {
    return null;
  }
  $rows = get_rows((int) $table['id']);
  return array_map(static fn(array $row) => $row['data'], $rows);
}
