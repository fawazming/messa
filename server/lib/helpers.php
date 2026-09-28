<?php
declare(strict_types=1);

function now(): string
{
  return date('Y-m-d H:i:s');
}

function random_hex(int $bytes = 16): string
{
  return bin2hex(random_bytes($bytes));
}

function slugify(string $text): string
{
  $text = strtolower(trim($text));
  $text = preg_replace('/[^a-z0-9]+/', '-', $text) ?? '';
  $text = trim($text, '-');
  return $text !== '' ? $text : 'table';
}

function unique_slug(string $desired, int $userId): string
{
  $base = substr(slugify($desired), 0, 48);
  $slug = $base;
  $suffix = 2;
  while (Db::value('SELECT id FROM data_tables WHERE user_id = ? AND slug = ?', [$userId, $slug]) !== null) {
    $slug = $base . '-' . $suffix;
    $suffix++;
  }
  return $slug;
}

function generate_registration_token(): string
{
  $prefix = (string) config('registration.token_prefix', 'MESSA');
  $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  $group = static function () use ($alphabet): string {
    $out = '';
    for ($i = 0; $i < 4; $i++) {
      $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $out;
  };
  return sprintf('%s-%s-%s', $prefix, $group(), $group());
}

function log_activity(?int $userId, string $action, array $meta = []): void
{
  try {
    Db::insert('activity_logs', [
      'user_id' => $userId,
      'action' => $action,
      'meta_json' => json_encode($meta, JSON_UNESCAPED_UNICODE),
      'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
      'created_at' => now(),
    ]);
  } catch (Throwable $ignored) {
    // Never let logging break a request.
  }
}

function client_ip(): string
{
  return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
}

function table_limits(array $user): array
{
  return [
    'max_tables' => (int) ($user['max_tables'] ?? 10),
    'max_rows' => (int) ($user['max_rows'] ?? 512),
  ];
}

function decode_columns(?string $json): array
{
  if ($json === null || $json === '') {
    return [];
  }
  $decoded = json_decode($json, true);
  return is_array($decoded) ? array_values(array_filter($decoded, static fn($c) => is_string($c) && $c !== '')) : [];
}

function public_export_url(string $publicToken): string
{
  return rtrim((string) config('app.base_url', ''), '/') . '/sheet/' . $publicToken . '.json';
}

function whatsapp_link(): string
{
  $number = (string) config('registration.whatsapp', '');
  $fee = (int) config('registration.fee', 5000);
  $text = rawurlencode('Hello ' . (string) config('registration.vendor', 'RayyanTech') . ', I want to get a MESSA registration token. I have paid ' . config('registration.currency', 'NGN') . ' ' . number_format($fee) . '.');
  return 'https://wa.me/' . $number . '?text=' . $text;
}

function photo_url(?string $path): ?string
{
  if (!$path) {
    return null;
  }
  return rtrim((string) config('app.base_url', ''), '/') . '/' . ltrim($path, '/');
}
