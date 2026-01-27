<?php

class PresentationService {

    public function createFromSlim(string $slim): void {
        $presentation = SlimParser::parse($slim);

        $presRepo = new PresentationRepository();
        $slideRepo = new SlideRepository();

        $id = $presRepo->insert($presentation);
        $slideRepo->insertSlides($id, $presentation->slides);

        HtmlGenerator::generate($presentation);
    }

    public function list(): array {
        return (new PresentationRepository())->all();
    }
}
