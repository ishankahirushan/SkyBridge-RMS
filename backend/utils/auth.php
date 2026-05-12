<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/audit.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function is_authenticated(): bool
{
    return current_user() !== null;
}

function require_auth(array $allowedRoles = []): array
{
    if (!is_authenticated()) {
        error_response('Unauthorized', 401);
    }

    $user = current_user();

    if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles, true)) {
        error_response('Forbidden', 403);
    }

    return $user;
}

function authenticate_agent(mysqli $conn, string $email, string $password): array
{
    $sql = "SELECT agent_id, full_name, email, password, role, status FROM agents WHERE email = ? LIMIT 1";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        error_response('Database error', 500);
    }

    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $agent = $result->fetch_assoc();
    $stmt->close();

    if (!$agent || $agent['status'] !== 'active') {
        error_response('Invalid credentials', 401);
    }

    if (!password_verify($password, $agent['password'])) {
        error_response('Invalid credentials', 401);
    }

    unset($agent['password']);
    return $agent;
}
