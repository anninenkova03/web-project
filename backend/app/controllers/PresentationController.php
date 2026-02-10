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
            Auth::require();
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (!isset($data['slim']) || empty($data['slim'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Липсва SLIM съдържание'
                ]);
                return;
            }
            
            $userId = Auth::id();
            $result = $this->service->createFromSlim($data['slim'], $userId);
            
            ActivityLogger::log('create', 'presentation', $result['id'], 
                'Created presentation: ' . $result['title']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Презентацията е създадена успешно',
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

            if (!$presentation['is_public'] && !Auth::canAccess('presentations', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате достъп до тази презентация'
                ]);
                return;
            }

            $this->service->incrementViewCount($id, Auth::id());

            if (Auth::check()) {
                $presentation['is_liked'] = $this->service->isLikedByUser($id, Auth::id());
                $presentation['is_favorited'] = $this->service->isFavoritedByUser($id, Auth::id());
            }
            
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
            
            if (!Auth::canAccess('presentations', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате права да редактирате тази презентация'
                ]);
                return;
            }
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (!isset($data['slim']) || empty($data['slim'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Липсва SLIM съдържание'
                ]);
                return;
            }
            
            $result = $this->service->updateFromSlim($id, $data['slim']);
            
            if (!$result) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Презентацията не е намерена'
                ]);
                return;
            }

            ActivityLogger::log('update', 'presentation', $id, 
                'Updated presentation: ' . $result['title']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Презентацията е обновена успешно',
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
            
            if (!Auth::canAccess('presentations', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате права да изтриете тази презентация'
                ]);
                return;
            }
            
            $result = $this->service->delete($id);
            
            if (!$result) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Презентацията не е намерена'
                ]);
                return;
            }

            ActivityLogger::log('delete', 'presentation', $id, 'Deleted presentation');
            
            echo json_encode([
                'success' => true,
                'message' => 'Презентацията е изтрита успешно'
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
            
            $result = $this->service->toggleLike($id, Auth::id());
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'is_liked' => $result,
                    'likes_count' => $this->service->getLikesCount($id)
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
    
    public function toggleFavorite(int $id): void {
        try {
            Auth::require();
            
            $result = $this->service->toggleFavorite($id, Auth::id());
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'is_favorited' => $result
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
    
    public function getFavorites(): void {
        try {
            Auth::require();
            
            $favorites = $this->service->getUserFavorites(Auth::id());
            
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
            $comments = $this->service->getComments($id);
            
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
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            $validator = new Validator($data);
            $validator->required('comment', 'Коментарът е задължителен')
                     ->min('comment', 3, 'Коментарът трябва да е поне 3 символа');
            
            if ($validator->fails()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $validator->errors()
                ]);
                return;
            }
            
            $comment = $this->service->addComment(
                $id, 
                Auth::id(), 
                $data['comment'],
                $data['parent_comment_id'] ?? null
            );
            
            echo json_encode([
                'success' => true,
                'message' => 'Коментарът е добавен успешно',
                'data' => $comment
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    public function deleteComment(int $commentId): void {
        try {
            Auth::require();
            
            $db = Database::get();
            $stmt = $db->prepare("SELECT user_id FROM comments WHERE id = ?");
            $stmt->execute([$commentId]);
            $comment = $stmt->fetch();
            
            if (!$comment) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Коментарът не е намерен'
                ]);
                return;
            }
            
            if ($comment['user_id'] !== Auth::id() && !Auth::isAdmin()) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате права да изтриете този коментар'
                ]);
                return;
            }
            
            $this->service->deleteComment($commentId);
            
            echo json_encode([
                'success' => true,
                'message' => 'Коментарът е изтрит успешно'
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
            Auth::require();
            
            if (!Auth::canAccess('presentations', $id)) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'error' => 'Нямате достъп до историята на тази презентация'
                ]);
                return;
            }
            
            $history = ActivityLogger::getEntityActivity('presentation', $id);
            
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