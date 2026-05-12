<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');
requireAgent();

$departure = strtoupper(trim((string)($_GET['departure'] ?? '')));
$destination = strtoupper(trim((string)($_GET['destination'] ?? '')));
$date = trim((string)($_GET['date'] ?? ''));

$conditions = [
    "COALESCE(oa.status, 'DISABLED') = 'ENABLED'",
    "f.status = 'SCHEDULED'",
    'f.available_seats > 0'
];
$params = [];

if ($departure !== '') {
    $conditions[] = 'f.departure_airport = :departure';
    $params['departure'] = $departure;
}

if ($destination !== '') {
    $conditions[] = 'f.destination_airport = :destination';
    $params['destination'] = $destination;
}

if ($date !== '') {
    $conditions[] = 'DATE(f.departure_datetime) = :travel_date';
    $params['travel_date'] = $date;
}

$where = implode(' AND ', $conditions);

$query = <<<SQL
SELECT
    f.flight_id,
    f.flight_no,
    a.airline_name,
    f.departure_airport,
    f.destination_airport,
    f.departure_datetime,
    f.arrival_datetime,
    f.available_seats,
    f.base_ticket_price
FROM flights f
INNER JOIN airlines a ON a.airline_id = f.airline_id
LEFT JOIN our_airlines oa ON oa.airline_id = f.airline_id
WHERE {$where}
ORDER BY f.departure_datetime ASC
LIMIT 100
SQL;

try {
    $pdo = getDatabaseConnection();
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    sendJsonResponse([
        'success' => true,
        'flights' => $stmt->fetchAll()
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to search flights.'
    ], 500);
}
