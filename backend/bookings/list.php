<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');
$user = requireAgent();

$bookingRef = strtoupper(trim((string)($_GET['booking_ref'] ?? '')));

$conditions = ['b.agent_id = :agent_id'];
$params = ['agent_id' => $user['user_id']];

if ($bookingRef !== '') {
    $conditions[] = 'b.booking_ref = :booking_ref';
    $params['booking_ref'] = $bookingRef;
}

$where = implode(' AND ', $conditions);

$query = <<<SQL
SELECT
    b.booking_ref,
    b.seat_no,
    b.base_price,
    b.service_charge,
    b.discount,
    b.final_price,
    b.booking_status,
    b.payment_status,
    b.booking_date,
    p.passport_no,
    CONCAT(p.given_names, ' ', p.surname) AS passenger_name,
    f.flight_no,
    f.departure_airport,
    f.destination_airport,
    f.departure_datetime
FROM bookings b
INNER JOIN passengers p ON p.passenger_id = b.passenger_id
INNER JOIN flights f ON f.flight_id = b.flight_id
WHERE {$where}
ORDER BY b.booking_date DESC
LIMIT 200
SQL;

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    sendJsonResponse([
        'success' => true,
        'bookings' => $stmt->fetchAll()
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to load bookings.'
    ], 500);
}
