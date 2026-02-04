<?php

class PresentationController {

    private PresentationService $service;

    public function __construct() {
        $this->service = new PresentationService();
    }

    public function index(): void {
        try {
            $presentations = $this->service->list();
            echo json_encode([
                'success' => true,
                'data' => $presentations
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function generate(): void {
        try {
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (!isset($data['slim']) || empty($data['slim'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing or empty slim content'
                ]);
                return;
            }
            
            $result = $this->service->createFromSlim($data['slim']);
            
            echo json_encode([
                'success' => true,
                'message' => 'Presentation generated successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    public function getById(int $id): void {
        try {
            $presentation = $this->service->getById($id);
            
            if (!$presentation) {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Presentation not found'
                ]);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'data' => $presentation
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}