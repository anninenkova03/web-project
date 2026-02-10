<?php

class AuthController {

    public function register(): void {
        try {
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);

            $data = Validator::sanitize($data);

            $validator = new Validator($data);
            $validator
                ->required('username', 'Потребителското име е задължително')
                ->required('email', 'Email адресът е задължителен')
                ->required('password', 'Паролата е задължителна')
                ->required('full_name', 'Пълното име е задължително')
                ->alphanumeric('username', 'Потребителското име може да съдържа само букви, цифри, _ и -')
                ->min('username', 3, 'Потребителското име трябва да е поне 3 символа')
                ->max('username', 50, 'Потребителското име не може да е над 50 символа')
                ->email('email', 'Невалиден email адрес')
                ->min('password', 6, 'Паролата трябва да е поне 6 символа')
                ->unique('username', 'users', 'username')
                ->unique('email', 'users', 'email');
            
            if (isset($data['password_confirmation'])) {
                $validator->matches('password', 'password_confirmation', 'Паролите не съвпадат');
            }
            
            if ($validator->fails()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $validator->errors()
                ]);
                return;
            }

            $db = Database::get();
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $stmt = $db->prepare("
                INSERT INTO users (username, email, password, full_name, role)
                VALUES (?, ?, ?, ?, 'user')
            ");
            
            $stmt->execute([
                $data['username'],
                $data['email'],
                $hashedPassword,
                $data['full_name']
            ]);
            
            $userId = $db->lastInsertId();

            $token = Auth::createSession($userId);

            $stmt = $db->prepare("SELECT id, username, email, full_name, role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();

            ActivityLogger::log('register', 'user', $userId, 'User registered');
            
            echo json_encode([
                'success' => true,
                'message' => 'Регистрацията е успешна',
                'data' => [
                    'token' => $token,
                    'user' => $user
                ]
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Грешка при регистрация: ' . $e->getMessage()
            ]);
        }
    }
    
    public function login(): void {
        try {
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);

            $data = Validator::sanitize($data);

            $validator = new Validator($data);
            $validator
                ->required('login', 'Потребителско име или email е задължително')
                ->required('password', 'Паролата е задължителна');
            
            if ($validator->fails()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $validator->errors()
                ]);
                return;
            }

            $db = Database::get();
            $stmt = $db->prepare("
                SELECT * FROM users 
                WHERE (username = ? OR email = ?) AND is_active = TRUE
            ");
            $stmt->execute([$data['login'], $data['login']]);
            $user = $stmt->fetch();

            if (!$user) {
                sprintf($data['password']);
                sprintf($user['password']);
                http_response_code(401);
                echo json_encode([
                    'success' => false,
                    'error' => 'Невалидно потребителско име или парола'
                ]);
                return;
            }

            $token = Auth::createSession($user['id']);

            unset($user['password']);

            ActivityLogger::log('login', 'user', $user['id'], 'User logged in');
            
            echo json_encode([
                'success' => true,
                'message' => 'Успешен вход',
                'data' => [
                    'token' => $token,
                    'user' => $user
                ]
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Грешка при вход: ' . $e->getMessage()
            ]);
        }
    }
    
    public function logout(): void {
        try {
            Auth::require();
            
            $userId = Auth::id();
            Auth::logout();

            ActivityLogger::log('logout', 'user', $userId, 'User logged out');
            
            echo json_encode([
                'success' => true,
                'message' => 'Успешен изход'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Грешка при изход'
            ]);
        }
    }
    
    public function me(): void {
        try {
            Auth::require();
            
            $user = Auth::user();
            unset($user['password']);
            
            echo json_encode([
                'success' => true,
                'data' => $user
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Грешка при зареждане на профил'
            ]);
        }
    }
    
    public function updateProfile(): void {
        try {
            Auth::require();
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            $data = Validator::sanitize($data);
            
            $userId = Auth::id();

            $validator = new Validator($data);
            
            if (isset($data['email'])) {
                $validator
                    ->email('email', 'Невалиден email адрес')
                    ->unique('email', 'users', 'email', $userId);
            }
            
            if (isset($data['username'])) {
                $validator
                    ->alphanumeric('username')
                    ->min('username', 3)
                    ->unique('username', 'users', 'username', $userId);
            }
            
            if ($validator->fails()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $validator->errors()
                ]);
                return;
            }

            $db = Database::get();
            $updates = [];
            $params = [];
            
            $allowedFields = ['username', 'email', 'full_name'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "{$field} = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Няма данни за обновяване'
                ]);
                return;
            }
            
            $params[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            $stmt = $db->prepare("SELECT id, username, email, full_name, role FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'message' => 'Профилът е обновен успешно',
                'data' => $user
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Грешка при обновяване на профил'
            ]);
        }
    }
    
    public function changePassword(): void {
        try {
            Auth::require();
            
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            $data = Validator::sanitize($data);

            $validator = new Validator($data);
            $validator
                ->required('current_password', 'Текущата парола е задължителна')
                ->required('new_password', 'Новата парола е задължителна')
                ->min('new_password', 6, 'Новата парола трябва да е поне 6 символа')
                ->matches('new_password', 'new_password_confirmation', 'Паролите не съвпадат');
            
            if ($validator->fails()) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'errors' => $validator->errors()
                ]);
                return;
            }

            $db = Database::get();
            $userId = Auth::id();
            
            $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if (!password_verify($data['current_password'], $user['password'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Текущата парола е грешна'
                ]);
                return;
            }

            $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashedPassword, $userId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Паролата е променена успешно'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Грешка при смяна на парола'
            ]);
        }
    }
}