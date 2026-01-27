<?php

class PresentationController {

    private PresentationService $service;

    public function __construct() {
        $this->service = new PresentationService();
    }

    public function index(): void {
        echo json_encode($this->service->list());
    }

    public function generate(): void {
        $data = json_decode(file_get_contents("php://input"), true);
        $this->service->createFromSlim($data['slim']);
        echo json_encode(['status' => 'ok']);
    }
}
