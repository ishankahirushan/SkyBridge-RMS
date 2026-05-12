<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAdmin();

$payload = getJsonBody();
$agentId = (int)($payload['agent_id'] ?? 0);
$fullName = trim((string)($payload['full_name'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$role = strtoupper(trim((string)($payload['role'] ?? '')));
$status = strtoupper(trim((string)($payload['status'] ?? '')));

if (
    $agentId <= 0
    || $fullName === ''
    || $email === ''
    || !in_array($role, ['ADMIN', 'AGENT'], true)
    || !in_array($status, ['ACTIVE', 'INACTIVE'], true)
) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Invalid update payload.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();

    $stmt = $pdo->prepare(
        'UPDATE agents SET full_name = :full_name, email = :email, role = :role, status = :status WHERE agent_id = :agent_id'
    );
    $stmt->execute([
        'full_name' => $fullName,
        'email' => $email,
        'role' => $role,
        'status' => $status,
        'agent_id' => $agentId
    ]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Agent updated successfully.'
    ]);
} catch (PDOException $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Unable to update agent. Email might already exist.'
    ], 400);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to update agent.'
    ], 500);
}
