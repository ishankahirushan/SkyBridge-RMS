<?php

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function sendJsonResponse(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function requireRequestMethod(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Method not allowed.'
        ], 405);
    }
}

function getJsonBody(): array
{
    $rawBody = file_get_contents('php://input');
    $payload = json_decode($rawBody ?: '', true);

    if (!is_array($payload)) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Invalid JSON payload.'
        ], 400);
    }

    return $payload;
}

function getSessionUser(): ?array
{
    if (!isset($_SESSION['user_id'], $_SESSION['role'], $_SESSION['email'])) {
        return null;
    }

    return [
        'user_id' => (int)$_SESSION['user_id'],
        'full_name' => (string)($_SESSION['full_name'] ?? ''),
        'email' => (string)$_SESSION['email'],
        'role' => (string)$_SESSION['role'],
        'logged_in_at' => (string)($_SESSION['logged_in_at'] ?? '')
    ];
}

function requireLogin(): array
{
    $user = getSessionUser();

    if ($user === null) {
        sendJsonResponse([
            'success' => false,
            'message' => 'Unauthorized.'
        ], 401);
    }

    return $user;
}

function requireAdmin(): array
{
    $user = requireLogin();

    if ($user['role'] !== 'ADMIN') {
        sendJsonResponse([
            'success' => false,
            'message' => 'Forbidden.'
        ], 403);
    }

    return $user;
}
