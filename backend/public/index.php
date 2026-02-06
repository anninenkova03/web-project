<?php

// Enable CORS for frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Autoloader for classes
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/../app/controllers/',
        __DIR__ . '/../app/core/parser/',
        __DIR__ . '/../app/core/model/',
        __DIR__ . '/../app/core/generator/',
        __DIR__ . '/../app/repositories/',
        __DIR__ . '/../app/services/',
        __DIR__ . '/../config/'
    ];
    
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Initialize database
require_once __DIR__ . '/../config/database.php';

try {
    // Parse request URI
    $requestUri = $_SERVER['REQUEST_URI'];
    $scriptName = dirname($_SERVER['SCRIPT_NAME']);
    $uri = str_replace($scriptName, '', $requestUri);
    $uri = strtok($uri, '?'); // Remove query string
    
    $controller = new PresentationController();
    
    // Route handling
    switch ($uri) {
        case '/api/presentations':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $controller->index();
            }
            break;
            
        case '/api/generate':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $controller->generate();
            }
            break;
            
        case '/api/presentation':
            if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
                $controller->getById($_GET['id']);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
                $controller->update($_GET['id']);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
                $controller->delete($_GET['id']);
            }
            break;
            
        case '/api/health':
            echo json_encode([
                'success' => true,
                'message' => 'API is running',
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}