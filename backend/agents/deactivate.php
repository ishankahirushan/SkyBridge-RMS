<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAdmin();

$payload = getJsonBody();
$agentId = (int)($payload['agent_id'] ?? 0);

if ($agentId <= 0) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Invalid agent id.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare('UPDATE agents SET status = :status WHERE agent_id = :agent_id');
    $stmt->execute([
        'status' => 'INACTIVE',
        'agent_id' => $agentId
    ]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Agent deactivated successfully.'
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to deactivate agent.'
    ], 500);
}
