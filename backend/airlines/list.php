<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');
requireAdmin();

try {
    $pdo = getDatabaseConnection();

    $query = <<<SQL
SELECT
    a.airline_id,
    a.airline_name,
    a.airline_code,
    a.country,
    a.status AS airline_status,
    COALESCE(oa.status, 'DISABLED') AS agency_status
FROM airlines a
LEFT JOIN our_airlines oa ON oa.airline_id = a.airline_id
ORDER BY a.airline_name ASC
SQL;

    $rows = $pdo->query($query)->fetchAll();

    sendJsonResponse([
        'success' => true,
        'airlines' => $rows
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to load airlines.'
    ], 500);
}
