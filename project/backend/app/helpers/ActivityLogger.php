<?php

class ActivityLogger {
    
    public static function log(
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?string $description = null
    ): void {
        try {
            $userId = Auth::id();
            $db = Database::get();
            
            $stmt = $db->prepare("
                INSERT INTO activity_log 
                (user_id, action, entity_type, entity_id, description, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $userId,
                $action,
                $entityType,
                $entityId,
                $description,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);
        } catch (Exception $e) {
            error_log("Activity logging failed: " . $e->getMessage());
        }
    }
    
    public static function getUserActivity(int $userId, int $limit = 50): array {
        try {
            $db = Database::get();
            $stmt = $db->prepare("
                SELECT * FROM activity_log
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$userId, $limit]);
            
            return $stmt->fetchAll();
        } catch (Exception $e) {
            return [];
        }
    }
    
    public static function getEntityActivity(string $entityType, int $entityId, int $limit = 20): array {
        try {
            $db = Database::get();
            $stmt = $db->prepare("
                SELECT al.*, u.username, u.full_name
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.entity_type = ? AND al.entity_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?
            ");
            $stmt->execute([$entityType, $entityId, $limit]);
            
            return $stmt->fetchAll();
        } catch (Exception $e) {
            return [];
        }
    }
}