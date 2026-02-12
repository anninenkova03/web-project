<?php

class AdminController {
    public function dashboard(): void {
        try {
            Auth::requireAdmin();
            
            $db = Database::get();

            $stats = [];

            $stmt = $db->query("SELECT COUNT(*) as count FROM users");
            $stats['total_users'] = $stmt->fetch()['count'];

            $stmt = $db->query("SELECT COUNT(*) as count FROM presentations");
            $stats['total_presentations'] = $stmt->fetch()['count'];

            $stmt = $db->query("SELECT COUNT(*) as count FROM comments WHERE is_deleted = FALSE");
            $stats['total_comments'] = $stmt->fetch()['count'];

            $stmt = $db->query("SELECT SUM(view_count) as total FROM presentations");
            $stats['total_views'] = $stmt->fetch()['total'] ?? 0;

            $stmt = $db->query("
                SELECT al.*, u.username 
                FROM activity_log al
                LEFT JOIN users u ON al.user_id = u.id
                ORDER BY al.created_at DESC
                LIMIT 10
            ");
            $stats['recent_activity'] = $stmt->fetchAll();

            $stmt = $db->query("
                SELECT p.*, u.username,
                    (SELECT COUNT(*) FROM presentation_likes pl WHERE pl.presentation_id = p.id) as likes_count,
                    (SELECT COUNT(*) FROM comments c WHERE c.presentation_id = p.id AND c.is_deleted = FALSE) as comments_count
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
    
    public function getUsers(): void {
        try {
            Auth::requireAdmin();
            
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
            $offset = ($page - 1) * $limit;
            
            $db = Database::get();

            $stmt = $db->query("SELECT COUNT(*) as count FROM users");
            $total = $stmt->fetch()['count'];

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

    public function deleteUser(int $userId): void {
        try {
            Auth::requireAdmin();

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