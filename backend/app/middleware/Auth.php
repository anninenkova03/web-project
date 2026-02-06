<?php

class Auth {
    private static $currentUser = null;
    
    public static function check(): bool {
        $token = self::getToken();
        
        if (!$token) {
            return false;
        }
        
        try {
            $db = Database::get();
            $stmt = $db->prepare("
                SELECT u.*, s.token 
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ? AND s.expires_at > NOW() AND u.is_active = TRUE
            ");
            $stmt->execute([$token]);
            $user = $stmt->fetch();
            
            if ($user) {
                self::$currentUser = $user;
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function require(): void {
        if (!self::check()) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Unauthorized. Please login.'
            ]);
            exit;
        }
    }
    
    public static function requireAdmin(): void {
        self::require();
        
        if (!self::isAdmin()) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'error' => 'Forbidden. Admin access required.'
            ]);
            exit;
        }
    }
    
    public static function isAdmin(): bool {
        return self::$currentUser && self::$currentUser['role'] === 'admin';
    }
    
    public static function user(): ?array {
        if (!self::check()) {
            return null;
        }
        return self::$currentUser;
    }
    
    public static function id(): ?int {
        $user = self::user();
        return $user ? (int)$user['id'] : null;
    }
    
    private static function getToken(): ?string {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $matches = [];
            if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }

        if (isset($_GET['token'])) {
            return $_GET['token'];
        }

        if (isset($_POST['token'])) {
            return $_POST['token'];
        }
        
        return null;
    }
    
    public static function createSession(int $userId): string {
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $db = Database::get();
        $stmt = $db->prepare("
            INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $token,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $expiresAt
        ]);

        $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$userId]);
        
        return $token;
    }
    
    public static function logout(): bool {
        $token = self::getToken();
        
        if (!$token) {
            return false;
        }
        
        try {
            $db = Database::get();
            $stmt = $db->prepare("DELETE FROM sessions WHERE token = ?");
            $stmt->execute([$token]);
            
            self::$currentUser = null;
            return true;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function cleanExpiredSessions(): void {
        try {
            $db = Database::get();
            $db->exec("DELETE FROM sessions WHERE expires_at < NOW()");
        } catch (Exception $e) {
            // Silent fail
        }
    }

    public static function owns(string $table, int $resourceId): bool {
        if (!self::check()) {
            return false;
        }
        
        try {
            $db = Database::get();
            $stmt = $db->prepare("SELECT user_id FROM {$table} WHERE id = ?");
            $stmt->execute([$resourceId]);
            $result = $stmt->fetch();
            
            return $result && (int)$result['user_id'] === self::id();
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function canAccess(string $table, int $resourceId): bool {
        return self::isAdmin() || self::owns($table, $resourceId);
    }
}