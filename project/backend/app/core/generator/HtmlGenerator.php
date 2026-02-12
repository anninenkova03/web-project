<?php

class HtmlGenerator {

    public static function generate(Presentation $p): void {
        $cfg = require __DIR__ . '/../../../config/config.php';
        $dir = $cfg['paths']['generated'] . '/' . $p->slug;

        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
        }

        $html = "<html><body>";

        foreach ($p->slides as $slide) {
            $html .= "<section class='{$slide->type}'>";
            foreach ($slide->data as $k => $v) {
                $html .= "<div class='$k'>$v</div>";
            }
            $html .= "</section>";
        }

        $html .= "</body></html>";

        file_put_contents("$dir/index.html", $html);
    }
}
