<?php

class Database {
    private static ?PDO $instance = null;

    public static function get(): PDO {
        if (self::$instance === null) {
            $cfg = require __DIR__ . '/config.php';

            self::$instance = new PDO(
                "mysql:host={$cfg['db']['host']};dbname={$cfg['db']['name']};charset=utf8",
                $cfg['db']['user'],
                $cfg['db']['pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
        }
        return self::$instance;
    }
}
