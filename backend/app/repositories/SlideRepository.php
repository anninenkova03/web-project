<?php

class SlideRepository {
    private PDO $db;

    public function __construct() {
        $this->db = Database::get();
    }

    public function insertSlides(int $presentationId, array $slides): void {
        $stmt = $this->db->prepare(
            "INSERT INTO slides (presentation_id, slide_order, slide_type_id, data)
             VALUES (?, ?, (SELECT id FROM slide_types WHERE name=?), ?)"
        );

        foreach ($slides as $slide) {
            $stmt->execute([
                $presentationId,
                $slide->order,
                $slide->type,
                json_encode($slide->data)
            ]);
        }
    }
    
    public function getByPresentationId(int $presentationId): array {
        $stmt = $this->db->prepare(
            "SELECT s.*, st.name as type_name
             FROM slides s
             JOIN slide_types st ON s.slide_type_id = st.id
             WHERE s.presentation_id = ?
             ORDER BY s.slide_order"
        );
        $stmt->execute([$presentationId]);
        
        $slides = [];
        while ($row = $stmt->fetch()) {
            $slides[] = [
                'id' => $row['id'],
                'order' => $row['slide_order'],
                'type' => $row['type_name'],
                'data' => json_decode($row['data'], true)
            ];
        }
        
        return $slides;
    }
    
    public function deleteByPresentationId(int $presentationId): void {
        $stmt = $this->db->prepare("DELETE FROM slides WHERE presentation_id = ?");
        $stmt->execute([$presentationId]);
    }
}