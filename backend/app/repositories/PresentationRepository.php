<?php

class PresentationRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::get();
    }

    public function insert(Presentation $p): int {
        $stmt = $this->db->prepare(
            "INSERT INTO presentations (slug, title, presentation_type)
             VALUES (?, ?, ?)"
        );
        $stmt->execute([$p->slug, $p->title, $p->type]);
        return (int)$this->db->lastInsertId();
    }

    public function all(): array {
        $stmt = $this->db->query(
            "SELECT p.*, COUNT(s.id) AS slides
             FROM presentations p
             LEFT JOIN slides s ON p.id = s.presentation_id
             GROUP BY p.id
             ORDER BY p.created_at DESC"
        );
        return $stmt->fetchAll();
    }
    
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare(
            "SELECT p.*, COUNT(s.id) AS slides
             FROM presentations p
             LEFT JOIN slides s ON p.id = s.presentation_id
             WHERE p.id = ?
             GROUP BY p.id"
        );
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    public function update(int $id, Presentation $p): bool {
        $stmt = $this->db->prepare(
            "UPDATE presentations
             SET slug = ?, title = ?, presentation_type = ?
             WHERE id = ?"
        );
        $stmt->execute([$p->slug, $p->title, $p->type, $id]);
        return $stmt->rowCount() > 0;
    }
    
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM presentations WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}