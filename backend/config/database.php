<?php

class Database {
    private static $instance = null;
    private static $config = null;

    private static function getConfig($key, $default = null) {
        if (self::$config === null) {
            self::loadConfig();
        }

        $envValue = getenv($key);
        if ($envValue !== false) {
            return $envValue;
        }

        if (isset(self::$config[$key])) {
            return self::$config[$key];
        }

        return $default;
    }

    private static function loadConfig() {
        $configFile = __DIR__ . '/database.config.php';
        
        if (file_exists($configFile)) {
            self::$config = require $configFile;
        } else {
            self::$config = [];
        }
    }

    public static function get(): PDO {
        if (self::$instance === null) {
            try {
                $host = self::getConfig('DB_HOST', 'localhost');
                $name = self::getConfig('DB_NAME', 'web_presentations');
                $user = self::getConfig('DB_USER', 'root');
                $pass = self::getConfig('DB_PASS', '');
                $charset = self::getConfig('DB_CHARSET', 'utf8mb4');
                
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=%s',
                    $host,
                    $name,
                    $charset
                );
                
                self::$instance = new PDO(
                    $dsn,
                    $user,
                    $pass,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . $charset
                    ]
                );
                
            } catch (PDOException $e) {
                self::handleConnectionError($e);
            }
        }
        return self::$instance;
    }

    private static function handleConnectionError(PDOException $e) {
        $errorMessage = $e->getMessage();

        error_log('Database connection failed: ' . $errorMessage);

        $userMessage = 'Database connection failed. ';
        
        if (strpos($errorMessage, 'Access denied') !== false) {
            $userMessage .= 'Invalid username or password. ';
            $userMessage .= 'Please check DB_USER and DB_PASS in database.config.php';
        } elseif (strpos($errorMessage, 'Unknown database') !== false) {
            $userMessage .= 'Database does not exist. ';
            $userMessage .= 'Please create the database or check DB_NAME in database.config.php';
        } elseif (strpos($errorMessage, "Can't connect") !== false) {
            $userMessage .= 'Cannot connect to MySQL server. ';
            $userMessage .= 'Please check if MySQL is running and DB_HOST is correct.';
        } else {
            $userMessage .= 'Please check your database configuration.';
        }

        if (!headers_sent()) {
            header('Content-Type: application/json');
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Database Error',
                'message' => $userMessage,
                'details' => [
                    'config_file' => 'backend/config/database.config.php',
                    'current_settings' => [
                        'DB_HOST' => self::getConfig('DB_HOST', 'localhost'),
                        'DB_NAME' => self::getConfig('DB_NAME', 'web_presentations'),
                        'DB_USER' => self::getConfig('DB_USER', 'root'),
                        'DB_PASS' => self::getConfig('DB_PASS') ? '***' : '(empty)'
                    ]
                ]
            ]);
        } else {
            echo "Database Error: " . $userMessage;
        }
        
        exit;
    }

    public static function testConnection(): bool {
        try {
            self::get();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public static function getConnectionInfo(): array {
        return [
            'host' => self::getConfig('DB_HOST', 'localhost'),
            'database' => self::getConfig('DB_NAME', 'web_presentations'),
            'user' => self::getConfig('DB_USER', 'root'),
            'has_password' => !empty(self::getConfig('DB_PASS')),
            'charset' => self::getConfig('DB_CHARSET', 'utf8mb4')
        ];
    }
}