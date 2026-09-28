<?php
/**
 * Router for PHP's built-in server (no mod_rewrite needed).
 *
 *   php -S localhost:8080 server/public/router.php
 *
 * For Apache/Nginx use server/public as the document root instead.
 */
$uri = urldecode((string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$publicRoot = __DIR__;

if ($uri !== '/' && is_file($publicRoot . $uri)) {
  return false; // Serve the static file as-is.
}

$_SERVER['SCRIPT_NAME'] = '/index.php';
require $publicRoot . '/index.php';
