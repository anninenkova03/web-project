<?php
class PresentationService {
    public function createFromSlim(string $slim, int $userId): array {
        $presentation = SlimParser::parse($slim);
        $presentation->user_id = $userId;
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();
        $id = $presRepo->insert($presentation);
        $slideRepo->insertSlides($id, $presentation->slides);
        HtmlGenerator::generate($presentation);
        return ['id' => $id, 'slug' => $presentation->slug, 'title' => $presentation->title, 'type' => $presentation->type, 'slides' => count($presentation->slides)];
    }
    
    public function list(array $filters): array {
        $presRepo = new PresentationRepository();
        return $presRepo->search($filters);
    }
    
    public function getById(int $id): ?array {
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();
        $presentation = $presRepo->getById($id);
        if (!$presentation) return null;
        $slides = $slideRepo->getByPresentationId($id);
        return ['id' => $presentation['id'], 'slug' => $presentation['slug'], 'title' => $presentation['title'], 'type' => $presentation['presentation_type'], 'user_id' => $presentation['user_id'], 'is_public' => (bool)$presentation['is_public'], 'view_count' => $presentation['view_count'], 'created_at' => $presentation['created_at'], 'slides' => $slides];
    }
    
    public function updateFromSlim(int $id, string $slim): ?array {
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();
        $existing = $presRepo->getById($id);
        if (!$existing) return null;
        $presentation = SlimParser::parse($slim);
        $presentation->user_id = $existing['user_id'];
        $presRepo->update($id, $presentation);
        $slideRepo->deleteByPresentationId($id);
        $slideRepo->insertSlides($id, $presentation->slides);
        $presentation->id = $id;
        HtmlGenerator::generate($presentation);
        return ['id' => $id, 'slug' => $presentation->slug, 'title' => $presentation->title, 'type' => $presentation->type, 'slides' => count($presentation->slides)];
    }
    
    public function delete(int $id): bool {
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();
        $presentation = $presRepo->getById($id);
        if (!$presentation) return false;
        $slideRepo->deleteByPresentationId($id);
        $presRepo->delete($id);
        $slug = $presentation['slug'];
        $htmlPath = __DIR__ . '/../../generated/presentations/' . $slug;
        if (is_dir($htmlPath)) $this->deleteDirectory($htmlPath);
        return true;
    }
    
    public function incrementViewCount(int $id, ?int $userId): void {
        $db = Database::get();
        $db->prepare("UPDATE presentations SET view_count = view_count + 1 WHERE id = ?")->execute([$id]);
    }
    
    public function toggleLike(int $presentationId, int $userId): bool {
        $db = Database::get();
        $stmt = $db->prepare("SELECT id FROM presentation_likes WHERE user_id = ? AND presentation_id = ?");
        $stmt->execute([$userId, $presentationId]);
        if ($stmt->fetch()) {
            $db->prepare("DELETE FROM presentation_likes WHERE user_id = ? AND presentation_id = ?")->execute([$userId, $presentationId]);
            return false;
        } else {
            $db->prepare("INSERT INTO presentation_likes (user_id, presentation_id) VALUES (?, ?)")->execute([$userId, $presentationId]);
            return true;
        }
    }
    
    public function toggleFavorite(int $presentationId, int $userId): bool {
        $db = Database::get();
        $stmt = $db->prepare("SELECT id FROM presentation_favorites WHERE user_id = ? AND presentation_id = ?");
        $stmt->execute([$userId, $presentationId]);
        if ($stmt->fetch()) {
            $db->prepare("DELETE FROM presentation_favorites WHERE user_id = ? AND presentation_id = ?")->execute([$userId, $presentationId]);
            return false;
        } else {
            $db->prepare("INSERT INTO presentation_favorites (user_id, presentation_id) VALUES (?, ?)")->execute([$userId, $presentationId]);
            return true;
        }
    }
    
    public function isLikedByUser(int $presentationId, int $userId): bool {
        $db = Database::get();
        $stmt = $db->prepare("SELECT id FROM presentation_likes WHERE user_id = ? AND presentation_id = ?");
        $stmt->execute([$userId, $presentationId]);
        return (bool)$stmt->fetch();
    }
    
    public function isFavoritedByUser(int $presentationId, int $userId): bool {
        $db = Database::get();
        $stmt = $db->prepare("SELECT id FROM presentation_favorites WHERE user_id = ? AND presentation_id = ?");
        $stmt->execute([$userId, $presentationId]);
        return (bool)$stmt->fetch();
    }
    
    public function getLikesCount(int $presentationId): int {
        $db = Database::get();
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM presentation_likes WHERE presentation_id = ?");
        $stmt->execute([$presentationId]);
        return (int)$stmt->fetch()['count'];
    }
    
    public function getUserFavorites(int $userId): array {
        $db = Database::get();
        $stmt = $db->prepare("SELECT p.* FROM presentations p JOIN presentation_favorites pf ON p.id = pf.presentation_id WHERE pf.user_id = ? ORDER BY pf.created_at DESC");
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }
    
    public function getComments(int $presentationId): array {
        $db = Database::get();
        $stmt = $db->prepare("SELECT c.*, u.username, u.full_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.presentation_id = ? AND c.is_deleted = FALSE ORDER BY c.created_at DESC");
        $stmt->execute([$presentationId]);
        return $stmt->fetchAll();
    }
    
    public function addComment(int $presentationId, int $userId, string $comment, ?int $parentId = null): array {
        $db = Database::get();
        $stmt = $db->prepare("INSERT INTO comments (user_id, presentation_id, parent_comment_id, comment) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $presentationId, $parentId, $comment]);
        $id = $db->lastInsertId();
        $stmt = $db->prepare("SELECT c.*, u.username, u.full_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function deleteComment(int $commentId): void {
        $db = Database::get();
        $db->prepare("UPDATE comments SET is_deleted = TRUE WHERE id = ?")->execute([$commentId]);
    }
    
    private function deleteDirectory($dir): void {
        if (!is_dir($dir)) return;
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}
