<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAdmin();

$payload = getJsonBody();
$agentId = (int)($payload['agent_id'] ?? 0);
$newPassword = (string)($payload['new_password'] ?? '');

if ($agentId <= 0 || strlen($newPassword) < 6) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Invalid password reset payload.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare('UPDATE agents SET password = :password WHERE agent_id = :agent_id');
    $stmt->execute([
        'password' => $hash,
        'agent_id' => $agentId
    ]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Agent password reset successfully.'
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to reset password.'
    ], 500);
}
