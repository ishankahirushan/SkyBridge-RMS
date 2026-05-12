<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAdmin();

$payload = getJsonBody();
$fullName = trim((string)($payload['full_name'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$password = (string)($payload['password'] ?? '');
$role = strtoupper(trim((string)($payload['role'] ?? 'AGENT')));

if ($fullName === '' || $email === '' || $password === '' || !in_array($role, ['ADMIN', 'AGENT'], true)) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Invalid agent data.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO agents (full_name, email, password, role, status) VALUES (:full_name, :email, :password, :role, :status)'
    );
    $stmt->execute([
        'full_name' => $fullName,
        'email' => $email,
        'password' => $hash,
        'role' => $role,
        'status' => 'ACTIVE'
    ]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Agent created successfully.'
    ]);
} catch (PDOException $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Unable to create agent. Email might already exist.'
    ], 400);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to create agent.'
    ], 500);
}
