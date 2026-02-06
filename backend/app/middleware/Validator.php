<?php

class Validator {
    private array $errors = [];
    private array $data;
    
    public function __construct(array $data) {
        $this->data = $data;
    }
    
    public function required(string $field, string $message = null): self {
        if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
            $this->errors[$field][] = $message ?? "{$field} is required";
        }
        return $this;
    }
    
    public function email(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = $message ?? "Invalid email format";
        }
        return $this;
    }
    
    public function min(string $field, int $length, string $message = null): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field][] = $message ?? "{$field} must be at least {$length} characters";
        }
        return $this;
    }
    
    public function max(string $field, int $length, string $message = null): self {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field][] = $message ?? "{$field} must not exceed {$length} characters";
        }
        return $this;
    }
    
    public function matches(string $field, string $otherField, string $message = null): self {
        if (isset($this->data[$field]) && isset($this->data[$otherField]) && 
            $this->data[$field] !== $this->data[$otherField]) {
            $this->errors[$field][] = $message ?? "{$field} must match {$otherField}";
        }
        return $this;
    }
    
    public function unique(string $field, string $table, string $column, int $exceptId = null): self {
        if (!isset($this->data[$field])) {
            return $this;
        }
        
        try {
            $db = Database::get();
            $sql = "SELECT COUNT(*) as count FROM {$table} WHERE {$column} = ?";
            $params = [$this->data[$field]];
            
            if ($exceptId) {
                $sql .= " AND id != ?";
                $params[] = $exceptId;
            }
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                $this->errors[$field][] = "{$field} already exists";
            }
        } catch (Exception $e) {
            $this->errors[$field][] = "Validation error";
        }
        
        return $this;
    }
    
    public function alphanumeric(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !preg_match('/^[a-zA-Z0-9_-]+$/', $this->data[$field])) {
            $this->errors[$field][] = $message ?? "{$field} can only contain letters, numbers, underscore and dash";
        }
        return $this;
    }
    
    public function slug(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !preg_match('/^[a-z0-9-]+$/', $this->data[$field])) {
            $this->errors[$field][] = $message ?? "{$field} must be a valid slug (lowercase letters, numbers, and dashes)";
        }
        return $this;
    }
    
    public function in(string $field, array $values, string $message = null): self {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $values)) {
            $valueList = implode(', ', $values);
            $this->errors[$field][] = $message ?? "{$field} must be one of: {$valueList}";
        }
        return $this;
    }
    
    public function integer(string $field, string $message = null): self {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_INT)) {
            $this->errors[$field][] = $message ?? "{$field} must be an integer";
        }
        return $this;
    }
    
    public function boolean(string $field, string $message = null): self {
        if (isset($this->data[$field])) {
            $value = $this->data[$field];
            if (!is_bool($value) && !in_array($value, [0, 1, '0', '1', 'true', 'false'], true)) {
                $this->errors[$field][] = $message ?? "{$field} must be a boolean value";
            }
        }
        return $this;
    }
    
    public function custom(string $field, callable $callback, string $message): self {
        if (isset($this->data[$field]) && !$callback($this->data[$field])) {
            $this->errors[$field][] = $message;
        }
        return $this;
    }

    public function passes(): bool {
        return empty($this->errors);
    }
    
    public function fails(): bool {
        return !$this->passes();
    }
    
    public function errors(): array {
        return $this->errors;
    }
    
    public function getErrors(string $field): array {
        return $this->errors[$field] ?? [];
    }
    
    public function getError(string $field): ?string {
        return $this->errors[$field][0] ?? null;
    }
    
    public static function sanitize(array $data): array {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
            } else {
                $sanitized[$key] = $value;
            }
        }
        return $sanitized;
    }
}