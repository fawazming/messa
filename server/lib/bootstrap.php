<?php
declare(strict_types=1);

/**
 * Loads configuration and shared helpers. Every entry point requires this file.
 */

$GLOBALS['__messa_config'] = require __DIR__ . '/../config.php';

function config(?string $path = null, $default = null)
{
  $cfg = $GLOBALS['__messa_config'];
  if ($path === null || $path === '') {
    return $cfg;
  }
  $node = $cfg;
  foreach (explode('.', $path) as $segment) {
    if (!is_array($node) || !array_key_exists($segment, $node)) {
      return $default;
    }
    $node = $node[$segment];
  }
  return $node;
}

date_default_timezone_set((string) config('app.timezone', 'UTC'));

$__debug = (bool) config('app.debug', false);
ini_set('display_errors', $__debug ? '1' : '0');
error_reporting($__debug ? E_ALL : 0);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/http.php';
require_once __DIR__ . '/sheet.php';
require_once __DIR__ . '/auth.php';
