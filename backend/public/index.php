<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/../app/controllers/',
        __DIR__ . '/../app/core/parser/',
        __DIR__ . '/../app/core/model/',
        __DIR__ . '/../app/core/generator/',
        __DIR__ . '/../app/repositories/',
        __DIR__ . '/../app/services/',
        __DIR__ . '/../app/middleware/',
        __DIR__ . '/../app/helpers/',
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

require_once __DIR__ . '/../config/database.php';
Auth::cleanExpiredSessions();

try {
    $requestUri = $_SERVER['REQUEST_URI'];
    $scriptName = dirname($_SERVER['SCRIPT_NAME']);
    $uri = str_replace($scriptName, '', $requestUri);
    $uri = strtok($uri, '?');
    
    $method = $_SERVER['REQUEST_METHOD'];

    if ($uri === '/api/auth/register' && $method === 'POST') {
        (new AuthController())->register();
    } elseif ($uri === '/api/auth/login' && $method === 'POST') {
        (new AuthController())->login();
    } elseif ($uri === '/api/auth/logout' && $method === 'POST') {
        (new AuthController())->logout();
    } elseif ($uri === '/api/auth/me' && $method === 'GET') {
        (new AuthController())->me();
    } elseif ($uri === '/api/auth/profile' && $method === 'PUT') {
        (new AuthController())->updateProfile();
    } elseif ($uri === '/api/auth/password' && $method === 'PUT') {
        (new AuthController())->changePassword();
    }

    elseif ($uri === '/api/presentations' && $method === 'GET') {
        (new PresentationController())->index();
    } elseif ($uri === '/api/generate' && $method === 'POST') {
        (new PresentationController())->generate();
    } elseif ($uri === '/api/presentation' && $method === 'GET' && isset($_GET['id'])) {
        (new PresentationController())->getById($_GET['id']);
    } elseif ($uri === '/api/presentation' && $method === 'PUT' && isset($_GET['id'])) {
        (new PresentationController())->update($_GET['id']);
    } elseif ($uri === '/api/presentation' && $method === 'DELETE' && isset($_GET['id'])) {
        (new PresentationController())->delete($_GET['id']);
    }

    elseif ($uri === '/api/presentation/like' && $method === 'POST' && isset($_GET['id'])) {
        (new PresentationController())->toggleLike($_GET['id']);
    } elseif ($uri === '/api/presentation/favorite' && $method === 'POST' && isset($_GET['id'])) {
        (new PresentationController())->toggleFavorite($_GET['id']);
    } elseif ($uri === '/api/favorites' && $method === 'GET') {
        (new PresentationController())->getFavorites();
    }

    elseif ($uri === '/api/presentation/comments' && $method === 'GET' && isset($_GET['id'])) {
        (new PresentationController())->getComments($_GET['id']);
    } elseif ($uri === '/api/presentation/comments' && $method === 'POST' && isset($_GET['id'])) {
        (new PresentationController())->addComment($_GET['id']);
    } elseif ($uri === '/api/comment' && $method === 'DELETE' && isset($_GET['id'])) {
        (new PresentationController())->deleteComment($_GET['id']);
    }

    elseif ($uri === '/api/presentation/history' && $method === 'GET' && isset($_GET['id'])) {
        (new PresentationController())->getHistory($_GET['id']);
    }
    
    elseif ($uri === '/api/admin/dashboard' && $method === 'GET') {
        (new AdminController())->dashboard();
    } elseif ($uri === '/api/admin/users' && $method === 'GET') {
        (new AdminController())->getUsers();
    } elseif ($uri === '/api/admin/user/status' && $method === 'PUT' && isset($_GET['id'])) {
        (new AdminController())->toggleUserStatus($_GET['id']);
    } elseif ($uri === '/api/admin/user/role' && $method === 'PUT' && isset($_GET['id'])) {
        (new AdminController())->changeUserRole($_GET['id']);
    } elseif ($uri === '/api/admin/user' && $method === 'DELETE' && isset($_GET['id'])) {
        (new AdminController())->deleteUser($_GET['id']);
    } elseif ($uri === '/api/admin/logs' && $method === 'GET') {
        (new AdminController())->getActivityLogs();
    }

    elseif ($uri === '/api/health') {
        echo json_encode([
            'success' => true,
            'message' => 'API is running',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }
    
    else {
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
