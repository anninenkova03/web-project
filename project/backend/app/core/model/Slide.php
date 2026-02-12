<?php

class Slide {
    public int $order;
    public string $type;
    public array $data;

    public function __construct(int $order, string $type, array $data) {
        $this->order = $order;
        $this->type = $type;
        $this->data = $data;
    }
}
