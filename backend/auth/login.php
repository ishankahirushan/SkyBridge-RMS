<?php

declare(strict_types=1);

session_start();

require_once dirname(__DIR__) . '/config/db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed.'
    ]);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '', true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request payload.'
    ]);
    exit;
}

$email = trim((string)($payload['email'] ?? ''));
$password = (string)($payload['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required.'
    ]);
    exit;
}

try {
    $pdo = getDatabaseConnection();

    $statement = $pdo->prepare(
        'SELECT agent_id, full_name, email, password, role, status FROM agents WHERE email = :email LIMIT 1'
    );
    $statement->execute(['email' => $email]);
    $agent = $statement->fetch();

    if (!$agent || $agent['status'] !== 'ACTIVE') {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials.'
        ]);
        exit;
    }

    $storedPassword = (string)$agent['password'];
    $passwordMatch = password_verify($password, $storedPassword) || hash_equals($storedPassword, $password);

    if (!$passwordMatch) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid credentials.'
        ]);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$agent['agent_id'];
    $_SESSION['full_name'] = (string)$agent['full_name'];
    $_SESSION['email'] = (string)$agent['email'];
    $_SESSION['role'] = (string)$agent['role'];
    $_SESSION['logged_in_at'] = date('c');

    $redirectUrl = $_SESSION['role'] === 'ADMIN'
        ? '../admin/dashboard.html'
        : '../agent/dashboard.html';

    echo json_encode([
        'success' => true,
        'message' => 'Login successful.',
        'role' => $_SESSION['role'],
        'redirectUrl' => $redirectUrl
    ]);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Authentication failed due to a server error.'
    ]);
}
