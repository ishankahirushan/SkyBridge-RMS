<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');
requireAdmin();

try {
    $pdo = getDatabaseConnection();

    $totals = $pdo->query(
        "SELECT
            COUNT(*) AS total_bookings,
            COALESCE(SUM(CASE WHEN payment_status = 'SUCCESS' THEN final_price ELSE 0 END), 0) AS total_revenue,
            COALESCE(SUM(CASE WHEN booking_status = 'REFUNDED' OR payment_status = 'REFUNDED' THEN 1 ELSE 0 END), 0) AS total_refunds
        FROM bookings"
    )->fetch();

    $bookingsPerAirline = $pdo->query(
        "SELECT
            a.airline_name,
            COUNT(b.booking_ref) AS booking_count
        FROM airlines a
        LEFT JOIN flights f ON f.airline_id = a.airline_id
        LEFT JOIN bookings b ON b.flight_id = f.flight_id
        GROUP BY a.airline_id, a.airline_name
        ORDER BY booking_count DESC, a.airline_name ASC"
    )->fetchAll();

    $popularDestinations = $pdo->query(
        "SELECT
            f.destination_airport,
            COUNT(b.booking_ref) AS booking_count
        FROM bookings b
        INNER JOIN flights f ON f.flight_id = b.flight_id
        GROUP BY f.destination_airport
        ORDER BY booking_count DESC, f.destination_airport ASC
        LIMIT 10"
    )->fetchAll();

    $agentActivity = $pdo->query(
        "SELECT
            ag.agent_id,
            ag.full_name,
            COUNT(b.booking_ref) AS booking_count
        FROM agents ag
        LEFT JOIN bookings b ON b.agent_id = ag.agent_id
        GROUP BY ag.agent_id, ag.full_name
        ORDER BY booking_count DESC, ag.full_name ASC"
    )->fetchAll();

    sendJsonResponse([
        'success' => true,
        'totals' => [
            'total_bookings' => (int)($totals['total_bookings'] ?? 0),
            'total_revenue' => (float)($totals['total_revenue'] ?? 0),
            'total_refunds' => (int)($totals['total_refunds'] ?? 0)
        ],
        'bookings_per_airline' => $bookingsPerAirline,
        'popular_destinations' => $popularDestinations,
        'agent_activity' => $agentActivity
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to load report summary.'
    ], 500);
}
