<?php

class Presentation {
    public string $slug;
    public string $title;
    public string $type;
    public ?int $user_id = null;
    public ?int $id = null; 
    /** @var Slide[] */
    public array $slides = [];

    public function __construct(string $slug, string $title, string $type) {
        $this->slug = $slug;
        $this->title = $title;
        $this->type = $type;
    }

    public function addSlide(Slide $slide): void {
        $this->slides[] = $slide;
    }
}