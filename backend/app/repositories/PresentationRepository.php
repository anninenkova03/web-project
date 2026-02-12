<?php
class PresentationRepository {
    private PDO $db;
    
    public function __construct() {
        $this->db = Database::get();
    }
    
    public function insert(Presentation $p): int {
        $stmt = $this->db->prepare("
            INSERT INTO presentations 
            (user_id, slug, title, presentation_type, description, is_public) 
            VALUES (?, ?, ?, ?, ?, TRUE)
        ");
        $stmt->execute([
            $p->user_id ?? 1, 
            $p->slug, 
            $p->title, 
            $p->type, 
            $p->description ?? ''
        ]);
        return (int)$this->db->lastInsertId();
    }
    
    public function all(): array {
        $stmt = $this->db->query("
            SELECT p.*, COUNT(s.id) AS slides 
            FROM presentations p 
            LEFT JOIN slides s ON p.id = s.presentation_id 
            GROUP BY p.id 
            ORDER BY p.created_at DESC
        ");
        return $stmt->fetchAll();
    }
    
    public function search(array $filters): array {
        $currentUserId = Auth::id() ?? 0;

        $params = [];

        if (Auth::isAdmin()) {
            $where = ["1=1"];
        } else if ($currentUserId > 0) {
            $where = ["(p.is_public = TRUE OR p.user_id = ?)"];
            $params[] = $currentUserId;
        } else {
            $where = ["p.is_public = TRUE"];
        }

        if (!empty($filters['search'])) {
            $where[] = "(MATCH(p.title, p.description) AGAINST(? IN NATURAL LANGUAGE MODE) 
                        OR p.title LIKE ? 
                        OR p.description LIKE ?)";
            $searchTerm = $filters['search'];
            $params[] = $searchTerm;
            $params[] = '%' . $searchTerm . '%';
            $params[] = '%' . $searchTerm . '%';
        }

        if (!empty($filters['type'])) {
            $where[] = "p.presentation_type = ?";
            $params[] = $filters['type'];
        }

        if (isset($filters['user_id'])) {
            $where[] = "p.user_id = ?";
            $params[] = $filters['user_id'];
        }

        if (isset($filters['featured'])) {
            $where[] = "p.is_featured = ?";
            $params[] = $filters['featured'];
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'DESC';
        $page = max(1, $filters['page'] ?? 1);
        $limit = min(100, max(1, $filters['limit'] ?? 20));
        $offset = ($page - 1) * $limit;
        
        $whereClause = implode(' AND ', $where);

        $countSql = "SELECT COUNT(*) as total FROM presentations p WHERE " . $whereClause;
        $stmt = $this->db->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];

        $sql = "
            SELECT 
                p.*,
                u.username,
                u.full_name,
                COUNT(DISTINCT s.id) AS slides_count,
                COUNT(DISTINCT pl.id) AS likes_count,
                COUNT(DISTINCT c.id) AS comments_count,
                EXISTS(SELECT 1 FROM presentation_likes WHERE user_id = ? AND presentation_id = p.id) AS is_liked,
                EXISTS(SELECT 1 FROM presentation_favorites WHERE user_id = ? AND presentation_id = p.id) AS is_favorited
            FROM presentations p
            LEFT JOIN slides s ON p.id = s.presentation_id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN presentation_likes pl ON p.id = pl.presentation_id
            LEFT JOIN comments c ON p.id = c.presentation_id AND c.is_deleted = FALSE
            WHERE " . $whereClause . "
            GROUP BY p.id
            ORDER BY p." . $sortBy . " " . $sortOrder . "
            LIMIT ? OFFSET ?
        ";
        
        $executeParams = [$currentUserId, $currentUserId];
        $executeParams = array_merge($executeParams, $params);
        $executeParams[] = $limit;
        $executeParams[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($executeParams);
        
        return [
            'presentations' => $stmt->fetchAll(),
            'total' => $total
        ];
    }
    
    public function getById(int $id): ?array {
        $currentUserId = Auth::id() ?? 0;
        
        $stmt = $this->db->prepare("
            SELECT 
                p.*,
                u.username,
                u.full_name,
                COUNT(DISTINCT s.id) AS slides_count,
                COUNT(DISTINCT pl.id) AS likes_count,
                COUNT(DISTINCT c.id) AS comments_count,
                EXISTS(SELECT 1 FROM presentation_likes WHERE user_id = ? AND presentation_id = p.id) AS is_liked,
                EXISTS(SELECT 1 FROM presentation_favorites WHERE user_id = ? AND presentation_id = p.id) AS is_favorited
            FROM presentations p
            LEFT JOIN slides s ON p.id = s.presentation_id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN presentation_likes pl ON p.id = pl.presentation_id
            LEFT JOIN comments c ON p.id = c.presentation_id AND c.is_deleted = FALSE
            WHERE p.id = ?
            GROUP BY p.id
        ");
        $stmt->execute([$currentUserId, $currentUserId, $id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
    
    public function update(int $id, Presentation $p): bool {
        $stmt = $this->db->prepare("
            UPDATE presentations 
            SET slug = ?, title = ?, presentation_type = ?, description = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $p->slug, 
            $p->title, 
            $p->type, 
            $p->description ?? '', 
            $id
        ]);
        return $stmt->rowCount() > 0;
    }
    
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM presentations WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
    
    public function getUserPresentationsCount(int $userId): int {
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM presentations WHERE user_id = ?");
        $stmt->execute([$userId]);
        return (int)$stmt->fetch()['count'];
    }
}
?>