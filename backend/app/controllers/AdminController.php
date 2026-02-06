<?php

class AdminController {
    
    /**
     * Get dashboard statistics
     */
    public function dashboard(): void {
        try {
            Auth::requireAdmin();
            
            $db = Database::get();
            
            // Get statistics
            $stats = [];
            
            // Total users
            $stmt = $db->query("SELECT COUNT(*) as count FROM users");
            $stats['total_users'] = $stmt->fetch()['count'];
            
            // Total presentations
            $stmt = $db->query("SELECT COUNT(*) as count FROM presentations");
            $stats['total_presentations'] = $stmt->fetch()['count'];
            
            // Total comments
            $stmt = $db->query("SELECT COUNT(*) as count FROM comments WHERE is_deleted = FALSE");
            $stats['total_comments'] = $stmt->fetch()['count'];
            
            // Total views
            $stmt = $db->query("SELECT SUM(view_count) as total FROM presentations");
            $stats['total_views'] = $stmt->fetch()['total'] ?? 0;
            
            // Recent activities
            $stmt = $db->query("
                SELECT al.*, u.username 
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT 10
            ");
            $stats['recent_activities'] = $stmt->fetchAll();
            
            // Popular presentations
            $stmt = $db->query("
                SELECT p.*, u.username,
                    (SELECT COUNT(*) FROM presentation_likes pl WHERE pl.presentation_id = p.id) as likes
                FROM presentations p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.view_count DESC
                LIMIT 10
            ");
            $stats['popular_presentations'] = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'data' => $stats
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get all users (admin only)
     */
    public function getUsers(): void {
        try {
            Auth::requireAdmin();
            
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
            $offset = ($page - 1) * $limit;
            
            $db = Database::get();
            
            // Get total count
            $stmt = $db->query("SELECT COUNT(*) as count FROM users");
            $total = $stmt->fetch()['count'];
            
            // Get users with stats
            $stmt = $db->prepare("
                SELECT 
                    u.*,
                    COUNT(DISTINCT p.id) as presentations_count,
                    COUNT(DISTINCT c.id) as comments_count
                FROM users u
                LEFT JOIN presentations p ON u.id = p.user_id
                LEFT JOIN comments c ON u.id = c.user_id
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$limit, $offset]);
            $users = $stmt->fetchAll();
            
            // Remove passwords
            foreach ($users as &$user) {
                unset($user['password']);
            }
            
            echo json_encode([
                'success' => true,
                'data' => $users,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Toggle user active status
     */
    public function toggleUserStatus(int $userId): void {
        try {
            Auth::requireAdmin();
            
            $db = Database::get();
            $stmt = $db->prepare("
                UPDATE users 
                SET is_active = NOT is_active 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Статусът на потребителя е променен'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Change user role
     */
    public function changeUserRole(int $userId): void {
        try {
            Auth::requireAdmin();
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            $validator = new Validator($data);
            $validator->required('role')->in('role', ['admin', 'user']);
            
            if ($validator->fails()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $validator->errors()
                ]);
                return;
            }
            
            $db = Database::get();
            $stmt = $db->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->execute([$data['role'], $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Ролята е променена успешно'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete user
     */
    public function deleteUser(int $userId): void {
        try {
            Auth::requireAdmin();
            
            // Cannot delete yourself
            if ($userId === Auth::id()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Не можете да изтриете собствения си акаунт'
                ]);
                return;
            }
            
            $db = Database::get();
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Потребителят е изтрит успешно'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get all activity logs
     */
    public function getActivityLogs(): void {
        try {
            Auth::requireAdmin();
            
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 50;
            $offset = ($page - 1) * $limit;
            
            $db = Database::get();
            
            $stmt = $db->query("SELECT COUNT(*) as count FROM activity_log");
            $total = $stmt->fetch()['count'];
            
            $stmt = $db->prepare("
                SELECT al.*, u.username
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$limit, $offset]);
            
            echo json_encode([
                'success' => true,
                'data' => $stmt->fetchAll(),
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}