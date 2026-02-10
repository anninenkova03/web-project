<?php

/**
 * Database Configuration
 * 
 * Copy this file to database.php and update with your credentials
 */

class Database {
    private static $instance = null;
    
    const DB_HOST = 'localhost';
    const DB_NAME = 'web_presentations';
    const DB_USER = 'root';
    const DB_PASS = '';
    const DB_CHARSET = 'utf8mb4';
    
    public static function get(): PDO {
        if (self::$instance === null) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=%s',
                    self::DB_HOST,
                    self::DB_NAME,
                    self::DB_CHARSET
                );
                
                self::$instance = new PDO(
                    $dsn,
                    self::DB_USER,
                    self::DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . self::DB_CHARSET
                    ]
                );
            } catch (PDOException $e) {
                error_log('Database connection failed: ' . $e->getMessage());
                die('Database connection failed. Please check your configuration.');
            }
        }
        return self::$instance;
    }
    
    public static function testConnection(): bool {
        try {
            self::get();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
}
