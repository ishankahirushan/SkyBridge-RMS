<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$departureDate = trim($_POST['departure_date'] ?? '');
$departureAirport = trim($_POST['departure_airport'] ?? '');
$arrivalAirport = trim($_POST['arrival_airport'] ?? '');

if ($departureDate === '' || $departureAirport === '' || $arrivalAirport === '') {
    error_response('Departure date, departure airport, and arrival airport are required', 422);
}

try {
    $sql = "
        SELECT
            f.flight_id,
            f.flight_no,
            f.departure_airport,
            f.destination_airport,
            f.departure_datetime,
            f.arrival_datetime,
            f.base_ticket_price,
            a.airline_id,
            a.airline_name,
            a.airline_code,
            GROUP_CONCAT(
                CONCAT(
                    fsc.seat_category, '|',
                    fsc.available_seats, '|',
                    fsc.total_seats, '|',
                    fsc.price_multiplier
                )
                ORDER BY FIELD(fsc.seat_category, 'First Class', 'Business Class', 'Premium Economy', 'Economy Class')
                SEPARATOR ';;'
            ) AS seat_summary
        FROM flights f
        INNER JOIN airlines a ON a.airline_id = f.airline_id
        INNER JOIN our_airlines oa ON oa.airline_id = a.airline_id AND oa.status = 'enabled'
        INNER JOIN flight_seat_categories fsc ON fsc.flight_id = f.flight_id
        WHERE DATE(f.departure_datetime) = ?
          AND f.departure_airport = ?
          AND f.destination_airport = ?
          AND EXISTS (
              SELECT 1
              FROM flight_seat_categories fsc2
              WHERE fsc2.flight_id = f.flight_id
                AND fsc2.available_seats > 0
          )
        GROUP BY f.flight_id, f.flight_no, f.departure_airport, f.destination_airport, f.departure_datetime, f.arrival_datetime, f.base_ticket_price, a.airline_id, a.airline_name, a.airline_code
        ORDER BY f.departure_datetime ASC
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        error_response('Database error', 500);
    }

    $stmt->bind_param('sss', $departureDate, $departureAirport, $arrivalAirport);
    $stmt->execute();
    $result = $stmt->get_result();

    $flights = [];

    while ($row = $result->fetch_assoc()) {
        $seatCategories = [];

        if (!empty($row['seat_summary'])) {
            $segments = explode(';;', $row['seat_summary']);
            foreach ($segments as $segment) {
                [$category, $availableSeats, $totalSeats, $priceMultiplier] = explode('|', $segment);
                $seatCategories[] = [
                    'seat_category' => $category,
                    'available_seats' => (int) $availableSeats,
                    'total_seats' => (int) $totalSeats,
                    'price_multiplier' => (float) $priceMultiplier,
                    'status' => (int) $availableSeats > 0 ? 'AVAILABLE' : 'FULL',
                ];
            }
        }

        $flights[] = [
            'flight_id' => (int) $row['flight_id'],
            'flight_no' => $row['flight_no'],
            'departure_airport' => $row['departure_airport'],
            'destination_airport' => $row['destination_airport'],
            'departure_datetime' => $row['departure_datetime'],
            'arrival_datetime' => $row['arrival_datetime'],
            'base_ticket_price' => (float) $row['base_ticket_price'],
            'airline' => [
                'airline_id' => (int) $row['airline_id'],
                'airline_name' => $row['airline_name'],
                'airline_code' => $row['airline_code'],
            ],
            'seat_categories' => $seatCategories,
        ];
    }

    $stmt->close();

    audit_log(
        $conn,
        current_user()['agent_id'] ?? null,
        'flight_search',
        'flights',
        $departureAirport . '-' . $arrivalAirport,
        'Flight search executed'
    );

    success_response('Flights retrieved successfully', [
        'flights' => $flights,
        'count' => count($flights),
    ]);
} catch (Throwable $exception) {
    error_response('Flight search failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
