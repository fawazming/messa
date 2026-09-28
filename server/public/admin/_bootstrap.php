<?php
declare(strict_types=1);

require __DIR__ . '/../../lib/bootstrap.php';
require __DIR__ . '/../../lib/tables.php';

function e($value): string
{
  return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function flash(string $type, string $message): void
{
  admin_session_start();
  $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function take_flashes(): array
{
  admin_session_start();
  $flashes = $_SESSION['flash'] ?? [];
  unset($_SESSION['flash']);
  return $flashes;
}

function redirect(string $to): void
{
  header('Location: ' . $to);
  exit;
}

function post(string $key, $default = ''): string
{
  return isset($_POST[$key]) ? trim((string) $_POST[$key]) : (string) $default;
}

function get_int(string $key, int $default = 0): int
{
  return isset($_GET[$key]) ? (int) $_GET[$key] : $default;
}

function time_ago_short(?string $datetime): string
{
  if (!$datetime) {
    return '—';
  }
  $diff = time() - strtotime($datetime);
  if ($diff < 60) {
    return 'just now';
  }
  if ($diff < 3600) {
    return floor($diff / 60) . 'm ago';
  }
  if ($diff < 86400) {
    return floor($diff / 3600) . 'h ago';
  }
  if ($diff < 604800) {
    return floor($diff / 86400) . 'd ago';
  }
  return date('j M Y', strtotime($datetime));
}
