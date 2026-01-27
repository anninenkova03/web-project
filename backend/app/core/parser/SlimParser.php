<?php

class SlimParser {

    public static function parse(string $text): Presentation {
        $lines = array_filter(array_map('trim', explode("\n", $text)));

        $meta = [];
        $slides = [];
        $current = null;
        $order = 1;

        foreach ($lines as $line) {
            if (str_starts_with($line, '@')) {
                [$k, $v] = explode(':', substr($line, 1), 2);
                $meta[$k] = trim($v);
                continue;
            }

            if ($line === '---') {
                if ($current) {
                    $slides[] = $current;
                    $order++;
                }
                $current = ['type' => null, 'data' => []];
                continue;
            }

            if (str_starts_with($line, '#type')) {
                $current['type'] = trim(substr($line, 5));
                continue;
            }

            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $current['data'][$k] = $v;
            }
        }

        if ($current) {
            $slides[] = $current;
        }

        $presentation = new Presentation(
            $meta['slug'] ?? uniqid(),
            $meta['title'] ?? 'Untitled',
            $meta['presentationType'] ?? 'default'
        );

        foreach ($slides as $s) {
            $presentation->addSlide(
                new Slide($order++, $s['type'], $s['data'])
            );
        }

        return $presentation;
    }
}
