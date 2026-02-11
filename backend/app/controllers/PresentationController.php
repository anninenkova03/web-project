<?php

class PresentationController {

    private PresentationService $service;

    public function __construct() {
        $this->service = new PresentationService();
    }

    public function index(): void {
        try {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? min((int)$_GET['limit'], 100) : 20;
            $search = $_GET['search'] ?? '';
            $type = $_GET['type'] ?? '';
            $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
            $featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : null;
            $sortBy = $_GET['sort_by'] ?? 'created_at';
            $sortOrder = $_GET['sort_order'] ?? 'DESC';
            
            $result = $this->service->list([
                'page' => $page,
                'limit' => $limit,
                'search' => $search,
                'type' => $type,
                'user_id' => $userId,
                'featured' => $featured,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder
            ]);
            
            echo json_encode([
                'success' => true,
                'data' => $result['presentations'],
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $result['total'],
                    'total_pages' => ceil($result['total'] / $limit)
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

    public function generate(): void {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Invalid JSON: ' . json_last_error_msg()
                ]);
                return;
            }

            if (!isset($data['slim']) || empty($data['slim'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing or empty SLIM content'
                ]);
                return;
            }

            $userId = Auth::id();
            if (!$userId) {
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Unauthorized - Please login first'
                ]);
                return;
            }

            $result = $this->service->createFromSlim($data['slim'], $userId);

            ActivityLogger::log(
                'create', 
                'presentation', 
                $result['id'], 
                'Created presentation: ' . $result['title']
            );

            echo json_encode([
                'success' => true,
                'message' => 'Presentation created successfully',
                'data' => $result
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Failed to generate presentation',
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }

    public function getById(int $id): void {
        try {
            $presentation = $this->service->getById($id);
            
            if (!$presentation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Презентацията не е намерена'
                ]);
                return;
            }

            $this->service->incrementViewCount($id, Auth::id());

            echo json_encode([
                'success' => true,
                'data' => $presentation
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function update(int $id): void {
        try {
            Auth::require();
            
            $presentation = $this->service->getById($id);
            
            if (!$presentation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Презентацията не е намерена'
                ]);
                return;
            }
            
            // FIXED: Correct parameter passing - table name and resource ID
            if (!Auth::canAccess('presentations', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате права за редакция'
                ]);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['slim'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Липсва SLIM съдържание'
                ]);
                return;
            }
            
            $result = $this->service->updateFromSlim($id, $data['slim']);
            
            ActivityLogger::log('update', 'presentation', $id, 
                'Updated presentation: ' . $result['title']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Презентацията е обновена',
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function delete(int $id): void {
        try {
            Auth::require();
            
            $presentation = $this->service->getById($id);
            
            if (!$presentation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Презентацията не е намерена'
                ]);
                return;
            }
            
            // FIXED: Correct parameter passing - table name and resource ID
            if (!Auth::canAccess('presentations', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате права за изтриване'
                ]);
                return;
            }
            
            $this->service->delete($id);
            
            ActivityLogger::log('delete', 'presentation', $id, 
                'Deleted presentation: ' . $presentation['title']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Презентацията е изтрита'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function toggleLike(int $id): void {
        try {
            Auth::require();
            
            $isLiked = $this->service->toggleLike($id, Auth::id());
            
            $db = Database::get();
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM presentation_likes WHERE presentation_id = ?");
            $stmt->execute([$id]);
            $likesCount = $stmt->fetch()['count'];
            
            echo json_encode([
                'success' => true,
                'is_liked' => $isLiked,
                'likes_count' => $likesCount
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function toggleFavorite(int $id): void {
        try {
            Auth::require();
            
            $isFavorited = $this->service->toggleFavorite($id, Auth::id());
            
            echo json_encode([
                'success' => true,
                'is_favorited' => $isFavorited
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getFavorites(): void {
        try {
            Auth::require();
            
            $db = Database::get();
            $stmt = $db->prepare("
                SELECT p.*, u.username, u.full_name,
                       COUNT(DISTINCT pl.id) AS likes_count,
                       COUNT(DISTINCT c.id) AS comments_count,
                       1 AS is_favorited
                FROM presentation_favorites pf
                JOIN presentations p ON pf.presentation_id = p.id
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN presentation_likes pl ON p.id = pl.presentation_id
                LEFT JOIN comments c ON p.id = c.presentation_id AND c.is_deleted = FALSE
                WHERE pf.user_id = ?
                GROUP BY p.id
                ORDER BY pf.created_at DESC
            ");
            $stmt->execute([Auth::id()]);
            $favorites = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'data' => $favorites
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getComments(int $id): void {
        try {
            $db = Database::get();
            $stmt = $db->prepare("
                SELECT c.*, u.username, u.full_name
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.presentation_id = ? AND c.is_deleted = FALSE
                ORDER BY c.created_at ASC
            ");
            $stmt->execute([$id]);
            $comments = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'data' => $comments
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function addComment(int $id): void {
        try {
            Auth::require();
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['comment']) || empty(trim($data['comment']))) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Коментарът не може да бъде празен'
                ]);
                return;
            }
            
            $db = Database::get();
            $stmt = $db->prepare("
                INSERT INTO comments (user_id, presentation_id, parent_comment_id, comment)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                Auth::id(),
                $id,
                $data['parent_comment_id'] ?? null,
                trim($data['comment'])
            ]);
            
            $commentId = $db->lastInsertId();
            
            ActivityLogger::log('create', 'comment', $commentId, 
                'Added comment on presentation ' . $id);
            
            echo json_encode([
                'success' => true,
                'message' => 'Коментарът е добавен',
                'data' => ['id' => $commentId]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function deleteComment(int $id): void {
        try {
            Auth::require();
            
            $db = Database::get();
            $stmt = $db->prepare("SELECT user_id FROM comments WHERE id = ?");
            $stmt->execute([$id]);
            $comment = $stmt->fetch();
            
            if (!$comment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Коментарът не е намерен'
                ]);
                return;
            }
            
            // FIXED: Correct parameter passing - table name and resource ID
            if (!Auth::canAccess('comments', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате права за изтриване'
                ]);
                return;
            }
            
            $stmt = $db->prepare("UPDATE comments SET is_deleted = TRUE WHERE id = ?");
            $stmt->execute([$id]);
            
            ActivityLogger::log('delete', 'comment', $id, 'Deleted comment');
            
            echo json_encode([
                'success' => true,
                'message' => 'Коментарът е изтрит'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getHistory(int $id): void {
        try {
            $db = Database::get();
            $stmt = $db->prepare("
                SELECT ph.*, u.username
                FROM presentation_history ph
                JOIN users u ON ph.user_id = u.id
                WHERE ph.presentation_id = ?
                ORDER BY ph.created_at DESC
            ");
            $stmt->execute([$id]);
            $history = $stmt->fetchAll();
            
            echo json_encode([
                'success' => true,
                'data' => $history
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

?>