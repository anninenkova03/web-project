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
}