<?php

require_once '../config/database.php';
require_once '../app/core/parser/SlimParser.php';
require_once '../app/core/model/Presentation.php';
require_once '../app/core/model/Slide.php';
require_once '../app/core/generator/HtmlGenerator.php';
require_once '../app/repositories/PresentationRepository.php';
require_once '../app/repositories/SlideRepository.php';
require_once '../app/services/PresentationService.php';
require_once '../app/controllers/PresentationController.php';

$uri = $_SERVER['REQUEST_URI'];
$controller = new PresentationController();

if ($uri === '/api/presentations') {
    $controller->index();
} elseif ($uri === '/api/generate' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller->generate();
}
