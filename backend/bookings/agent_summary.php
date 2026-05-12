<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');
$user = requireAgent();

try {
    $pdo = getDatabaseConnection();

    $totals = $pdo->prepare(
        "SELECT
            COUNT(*) AS total_bookings,
            COALESCE(SUM(CASE WHEN payment_status = 'SUCCESS' THEN final_price ELSE 0 END), 0) AS total_success_revenue,
            COALESCE(SUM(CASE WHEN booking_status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending_bookings,
            COALESCE(SUM(CASE WHEN booking_status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelled_bookings
        FROM bookings
        WHERE agent_id = :agent_id"
    );
    $totals->execute(['agent_id' => $user['user_id']]);

    sendJsonResponse([
        'success' => true,
        'summary' => $totals->fetch()
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to load dashboard summary.'
    ], 500);
}
