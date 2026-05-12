<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');
requireAdmin();

try {
    $pdo = getDatabaseConnection();

    $stmt = $pdo->query(
        'SELECT agent_id, full_name, email, role, status, created_at FROM agents ORDER BY created_at DESC'
    );

    sendJsonResponse([
        'success' => true,
        'agents' => $stmt->fetchAll()
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to load agents.'
    ], 500);
}
