<?php

class SlimParser {

    public static function parse(string $text): Presentation {
        $lines = array_filter(array_map('trim', explode("\n", $text)));

        $title = 'Untitled';
        $type = 'lecture';
        $slug = uniqid('pres_');
        
        $slides = [];
        $currentSlide = null;
        $order = 0;

        foreach ($lines as $line) {
            if (str_starts_with($line, '#presentationType')) {
                $parts = explode(' ', $line, 2);
                if (isset($parts[1])) {
                    $type = trim($parts[1]);
                }
                continue;
            }

            if (str_starts_with($line, '#presentation')) {
                $parts = explode(' ', $line, 2);
                if (isset($parts[1])) {
                    $title = trim($parts[1]);
                }
                continue;
            }
            
            if (str_starts_with($line, '#slug')) {
                $parts = explode(' ', $line, 2);
                if (isset($parts[1])) {
                    $slug = trim($parts[1]);
                }
                continue;
            }

            if (str_starts_with($line, '#slide')) {
                if ($currentSlide !== null) {
                    $slides[] = $currentSlide;
                }
                $order++;
                $currentSlide = [
                    'type' => 'text-only',
                    'data' => [],
                    'order' => $order
                ];
                continue;
            }

            if ($currentSlide === null) {
                $order++;
                $currentSlide = [
                    'type' => 'text-only',
                    'data' => [],
                    'order' => $order
                ];
            }

            if (str_starts_with($line, '#title')) {
                $currentSlide['data']['title'] = trim(substr($line, 6));
                continue;
            }

            if (str_starts_with($line, '#type')) {
                $currentSlide['type'] = trim(substr($line, 5));
                continue;
            }

            if (str_starts_with($line, '#data')) {
                $dataStr = trim(substr($line, 5));
                $pairs = explode(';', $dataStr);
                
                foreach ($pairs as $pair) {
                    if (str_contains($pair, '=')) {
                        [$k, $v] = explode('=', $pair, 2);
                        $currentSlide['data'][trim($k)] = trim($v);
                    }
                }
                continue;
            }
        }

        if ($currentSlide !== null) {
            $slides[] = $currentSlide;
        }

        $presentation = new Presentation($slug, $title, $type);

        foreach ($slides as $slideData) {
            $presentation->addSlide(
                new Slide(
                    $slideData['order'],
                    $slideData['type'],
                    $slideData['data']
                )
            );
        }

        return $presentation;
    }
}