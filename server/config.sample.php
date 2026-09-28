<?php
/**
 * Copy this file to config.local.php and fill in your real values.
 * config.local.php is merged over the defaults in config.php.
 */
return [
  'db' => [
    'host' => '127.0.0.1',
    'name' => 'messa',
    'user' => 'messa',
    'pass' => 'change-me',
    'charset' => 'utf8mb4',
  ],
  'app' => [
    'base_url' => 'https://messa.sgm.ng',
    'name' => 'MESSA',
    'timezone' => 'Africa/Lagos',
    'debug' => false,
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
    // Comma-separated allowed origins for the mobile/API client; '*' allows any.
    'cors_origins' => '*',
    // Secret used to derive the public export token hash namespace.
    'app_secret' => 'change-this-to-a-long-random-string',
  ],
];
