<?php
declare(strict_types=1);

/** Thin PDO wrapper. */
final class Db
{
  private static ?PDO $pdo = null;

  public static function pdo(): PDO
  {
    if (self::$pdo instanceof PDO) {
      return self::$pdo;
    }
    $host = (string) config('db.host', '127.0.0.1');
    $name = (string) config('db.name', 'messa');
    $charset = (string) config('db.charset', 'utf8mb4');
    $dsn = "mysql:host={$host};dbname={$name};charset={$charset}";
    self::$pdo = new PDO($dsn, (string) config('db.user', 'root'), (string) config('db.pass', ''), [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return self::$pdo;
  }

  public static function run(string $sql, array $params = []): PDOStatement
  {
    $statement = self::pdo()->prepare($sql);
    $statement->execute($params);
    return $statement;
  }

  public static function one(string $sql, array $params = []): ?array
  {
    $row = self::run($sql, $params)->fetch();
    return $row === false ? null : $row;
  }

  public static function all(string $sql, array $params = []): array
  {
    return self::run($sql, $params)->fetchAll();
  }

  public static function value(string $sql, array $params = [])
  {
    $value = self::run($sql, $params)->fetchColumn();
    return $value === false ? null : $value;
  }

  public static function insert(string $table, array $data): int
  {
    $columns = array_keys($data);
    $placeholders = array_map(static fn($c) => ':' . $c, $columns);
    $sql = sprintf(
      'INSERT INTO %s (%s) VALUES (%s)',
      $table,
      implode(', ', $columns),
      implode(', ', $placeholders)
    );
    self::run($sql, $data);
    return (int) self::pdo()->lastInsertId();
  }

  public static function update(string $table, array $data, string $where, array $whereParams = []): int
  {
    $sets = [];
    foreach (array_keys($data) as $column) {
      $sets[] = $column . ' = :' . $column;
    }
    $sql = sprintf('UPDATE %s SET %s WHERE %s', $table, implode(', ', $sets), $where);
    return self::run($sql, array_merge($data, $whereParams))->rowCount();
  }

  public static function delete(string $table, string $where, array $params = []): int
  {
    return self::run(sprintf('DELETE FROM %s WHERE %s', $table, $where), $params)->rowCount();
  }
}
