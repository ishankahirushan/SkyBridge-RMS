<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAdmin();

$payload = getJsonBody();
$airlineId = (int)($payload['airline_id'] ?? 0);
$status = strtoupper(trim((string)($payload['status'] ?? '')));

if ($airlineId <= 0 || !in_array($status, ['ENABLED', 'DISABLED'], true)) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Invalid airline status payload.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();

    $upsert = <<<SQL
INSERT INTO our_airlines (airline_id, status)
VALUES (:airline_id, :status)
ON DUPLICATE KEY UPDATE status = VALUES(status)
SQL;

    $stmt = $pdo->prepare($upsert);
    $stmt->execute([
        'airline_id' => $airlineId,
        'status' => $status
    ]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Airline status updated.'
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to update airline status.'
    ], 500);
}
