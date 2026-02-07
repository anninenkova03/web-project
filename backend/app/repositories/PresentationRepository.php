<?php
class PresentationRepository {
    private PDO $db;
    public function __construct() {
        $this->db = Database::get();
    }
    
    public function insert(Presentation $p): int {
        $stmt = $this->db->prepare("INSERT INTO presentations (user_id, slug, title, presentation_type, description) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$p->user_id ?? 1, $p->slug, $p->title, $p->type, $p->description ?? '']);
        return (int)$this->db->lastInsertId();
    }
    
    public function all(): array {
        $stmt = $this->db->query("SELECT p.*, COUNT(s.id) AS slides FROM presentations p LEFT JOIN slides s ON p.id = s.presentation_id GROUP BY p.id ORDER BY p.created_at DESC");
        return $stmt->fetchAll();
    }
    
    public function search(array $filters): array {
        $where = ["p.is_public = TRUE OR p.user_id = " . (Auth::id() ?? 0)];
        $params = [];
        
        if (!empty($filters['search'])) {
            $where[] = "(MATCH(p.title, p.description) AGAINST(? IN NATURAL LANGUAGE MODE) OR p.title LIKE ? OR p.description LIKE ?)";
            $params[] = $filters['search'];
            $params[] = '%' . $filters['search'] . '%';
            $params[] = '%' . $filters['search'] . '%';
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
        
        $sql = "SELECT p.*, u.username, COUNT(s.id) AS slides FROM presentations p LEFT JOIN slides s ON p.id = s.presentation_id LEFT JOIN users u ON p.user_id = u.id WHERE " . $whereClause . " GROUP BY p.id ORDER BY p." . $sortBy . " " . $sortOrder . " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return ['presentations' => $stmt->fetchAll(), 'total' => $total];
    }
    
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT p.*, COUNT(s.id) AS slides FROM presentations p LEFT JOIN slides s ON p.id = s.presentation_id WHERE p.id = ? GROUP BY p.id");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        return $result ?: null;
    }
    
    public function update(int $id, Presentation $p): bool {
        $stmt = $this->db->prepare("UPDATE presentations SET slug = ?, title = ?, presentation_type = ?, description = ? WHERE id = ?");
        $stmt->execute([$p->slug, $p->title, $p->type, $p->description ?? '', $id]);
        return $stmt->rowCount() > 0;
    }
    
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM presentations WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}
