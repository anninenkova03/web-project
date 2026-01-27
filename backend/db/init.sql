CREATE DATABASE IF NOT EXISTS web_presentations;
USE web_presentations;

CREATE TABLE presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    presentation_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE slide_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO slide_types (name)
VALUES ('title'), ('text'), ('image-text'), ('code');

CREATE TABLE slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    presentation_id INT NOT NULL,
    slide_order INT NOT NULL,
    slide_type_id INT NOT NULL,
    data JSON NOT NULL,
    FOREIGN KEY (presentation_id) REFERENCES presentations(id),
    FOREIGN KEY (slide_type_id) REFERENCES slide_types(id)
);

CREATE TABLE slide_map (
    slide_id INT PRIMARY KEY,
    next_slide_id INT,
    prev_slide_id INT
);
