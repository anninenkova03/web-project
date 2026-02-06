<?php

class PresentationService {

    public function createFromSlim(string $slim): array {
        $presentation = SlimParser::parse($slim);

        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();

        $id = $presRepo->insert($presentation);
        $slideRepo->insertSlides($id, $presentation->slides);

        HtmlGenerator::generate($presentation);
        
        return [
            'id' => $id,
            'slug' => $presentation->slug,
            'title' => $presentation->title,
            'type' => $presentation->type,
            'slides' => count($presentation->slides)
        ];
    }

    public function list(): array {
        $presRepo = new PresentationRepository();
        return $presRepo->all();
    }
    
    public function getById(int $id): ?array {
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();
        
        $presentation = $presRepo->getById($id);
        
        if (!$presentation) {
            return null;
        }
        
        $slides = $slideRepo->getByPresentationId($id);
        
        return [
            'id' => $presentation['id'],
            'slug' => $presentation['slug'],
            'title' => $presentation['title'],
            'type' => $presentation['presentation_type'],
            'created_at' => $presentation['created_at'],
            'slides' => $slides
        ];
    }
    
    public function updateFromSlim(int $id, string $slim): ?array {
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();

        $existing = $presRepo->getById($id);
        if (!$existing) {
            return null;
        }

        $presentation = SlimParser::parse($slim);

        $presRepo->update($id, $presentation);

        $slideRepo->deleteByPresentationId($id);
        $slideRepo->insertSlides($id, $presentation->slides);

        $presentation->id = $id;
        HtmlGenerator::generate($presentation);
        
        return [
            'id' => $id,
            'slug' => $presentation->slug,
            'title' => $presentation->title,
            'type' => $presentation->type,
            'slides' => count($presentation->slides)
        ];
    }
    
    public function delete(int $id): bool {
        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();
        
        $presentation = $presRepo->getById($id);
        if (!$presentation) {
            return false;
        }
        
        $slideRepo->deleteByPresentationId($id);
        
        $presRepo->delete($id);
        
        $slug = $presentation['slug'];
        $htmlPath = __DIR__ . '/../../generated/presentations/' . $slug;
        if (is_dir($htmlPath)) {
            $this->deleteDirectory($htmlPath);
        }
        
        return true;
    }
    
    private function deleteDirectory($dir): void {
        if (!is_dir($dir)) {
            return;
        }
        
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }
}