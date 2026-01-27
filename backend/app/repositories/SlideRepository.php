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
}
