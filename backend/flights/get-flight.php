<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$flightId = (int) ($_GET['flight_id'] ?? 0);

if ($flightId <= 0) {
    error_response('Flight ID is required', 422);
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
            a.country,
            a.status AS airline_status,
            fsc.category_id,
            fsc.seat_category,
            fsc.total_seats,
            fsc.available_seats,
            fsc.price_multiplier,
            oa.status AS supported_status
        FROM flights f
        INNER JOIN airlines a ON a.airline_id = f.airline_id
        LEFT JOIN our_airlines oa ON oa.airline_id = a.airline_id
        INNER JOIN flight_seat_categories fsc ON fsc.flight_id = f.flight_id
        WHERE f.flight_id = ?
        ORDER BY FIELD(fsc.seat_category, 'First Class', 'Business Class', 'Premium Economy', 'Economy Class')
    ";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        error_response('Database error', 500);
    }

    $stmt->bind_param('i', $flightId);
    $stmt->execute();
    $result = $stmt->get_result();

    $flight = null;
    $seatCategories = [];

    while ($row = $result->fetch_assoc()) {
        if ($flight === null) {
            $flight = [
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
                    'country' => $row['country'],
                    'status' => $row['airline_status'],
                    'supported_status' => $row['supported_status'],
                ],
            ];
        }

        $seatCategories[] = [
            'category_id' => (int) $row['category_id'],
            'seat_category' => $row['seat_category'],
            'total_seats' => (int) $row['total_seats'],
            'available_seats' => (int) $row['available_seats'],
            'price_multiplier' => (float) $row['price_multiplier'],
            'status' => (int) $row['available_seats'] > 0 ? 'AVAILABLE' : 'FULL',
        ];
    }

    $stmt->close();

    if ($flight === null) {
        error_response('Flight not found', 404);
    }

    $flight['seat_categories'] = $seatCategories;

    audit_log(
        $conn,
        current_user()['agent_id'] ?? null,
        'flight_details_viewed',
        'flights',
        (string) $flightId,
        'Flight details retrieved'
    );

    success_response('Flight retrieved successfully', [
        'flight' => $flight,
    ]);
} catch (Throwable $exception) {
    error_response('Failed to retrieve flight', 500, [
        'error' => $exception->getMessage(),
    ]);
}
