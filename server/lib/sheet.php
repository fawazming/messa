<?php
declare(strict_types=1);

/**
 * sheet.spacet.me compatible parsing.
 * The service is read-only: GET https://sheet.spacet.me/{sheetId}/{sheetName}.json
 * It may return either a list of objects or a {"values": [[header],[row],...]} matrix.
 */

function is_list_array(array $value): bool
{
  if (function_exists('array_is_list')) {
    return array_is_list($value);
  }
  return array_keys($value) === range(0, count($value) - 1);
}

function sheet_cell_to_string($value): string
{
  if ($value === null) {
    return '';
  }
  if (is_bool($value)) {
    return $value ? 'TRUE' : 'FALSE';
  }
  if (is_scalar($value)) {
    return trim((string) $value);
  }
  return '';
}

function sheet_matrix_to_records(array $matrix): array
{
  $rows = array_values(array_filter($matrix, 'is_array'));
  if (!$rows) {
    return [];
  }

  $header = array_map('sheet_cell_to_string', $rows[0]);
  $columns = [];
  $seenKeys = [];
  foreach ($header as $index => $label) {
    $key = $label !== '' ? $label : 'column_' . ($index + 1);
    if (isset($seenKeys[$key])) {
      $seenKeys[$key]++;
      $key .= '_' . $seenKeys[$key];
    } else {
      $seenKeys[$key] = 1;
    }
    $columns[] = ['index' => $index, 'key' => $key, 'named' => $label !== ''];
  }

  $dataRows = array_slice($rows, 1);

  // Drop unnamed columns that are empty across every data row.
  $columns = array_values(array_filter($columns, static function (array $column) use ($dataRows): bool {
    if ($column['named']) {
      return true;
    }
    foreach ($dataRows as $row) {
      if (sheet_cell_to_string($row[$column['index']] ?? null) !== '') {
        return true;
      }
    }
    return false;
  }));

  $records = [];
  foreach ($dataRows as $row) {
    $record = [];
    $hasValue = false;
    foreach ($columns as $column) {
      $value = sheet_cell_to_string($row[$column['index']] ?? null);
      if ($value !== '') {
        $hasValue = true;
      }
      $record[$column['key']] = $value;
    }
    if ($hasValue) {
      $records[] = $record;
    }
  }
  return $records;
}

function sheet_normalize($decoded): array
{
  if (is_array($decoded) && is_list_array($decoded)) {
    if ($decoded && is_array($decoded[0])) {
      return sheet_matrix_to_records($decoded);
    }
    return array_values(array_filter($decoded, 'is_array'));
  }

  if (is_array($decoded)) {
    foreach (['data', 'records', 'rows', 'items', 'values', 'result'] as $key) {
      if (isset($decoded[$key]) && is_array($decoded[$key])) {
        $candidate = array_values($decoded[$key]);
        if ($candidate && is_array($candidate[0])) {
          return sheet_matrix_to_records($candidate);
        }
        return array_values(array_filter($candidate, 'is_array'));
      }
    }
  }

  throw new RuntimeException('The data source returned an unexpected format.');
}

function sheet_fetch(string $url): array
{
  if (!preg_match('#^https?://#i', $url)) {
    throw new RuntimeException('Endpoint must be an http(s) URL.');
  }

  $body = null;
  if (function_exists('curl_init')) {
    $curl = curl_init($url);
    curl_setopt_array($curl, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_MAXREDIRS => 3,
      CURLOPT_TIMEOUT => 20,
      CURLOPT_CONNECTTIMEOUT => 10,
      CURLOPT_HTTPHEADER => ['Accept: application/json'],
      CURLOPT_USERAGENT => 'MESSA-Server/1.0',
    ]);
    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if ($body === false) {
      throw new RuntimeException('Could not reach the data source: ' . $error);
    }
    if ($status < 200 || $status >= 300) {
      throw new RuntimeException('Data source responded with status ' . $status . '.');
    }
  } else {
    $context = stream_context_create([
      'http' => ['timeout' => 20, 'header' => "Accept: application/json\r\n"],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) {
      throw new RuntimeException('Could not reach the data source.');
    }
  }

  $decoded = json_decode((string) $body, true);
  if (!is_array($decoded)) {
    throw new RuntimeException('Data source did not return valid JSON.');
  }

  return sheet_normalize($decoded);
}

function normalize_column_list(array $record): array
{
  return array_values(array_filter(array_keys($record), static fn($key) => is_string($key) && $key !== ''));
}
