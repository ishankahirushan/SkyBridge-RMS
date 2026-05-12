<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

try {
    // Get ticket data - public endpoint (no authentication)
    requireRequestMethod('GET');
    
    if (empty($_GET['booking_ref']) || empty($_GET['passport_no'])) {
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Missing required parameters: booking_ref, passport_no'
        ]);
        exit;
    }
    
    $booking_ref = $_GET['booking_ref'];
    $passport_no = $_GET['passport_no'];
    
    $db = getDatabaseConnection();
    
    // Get ticket details
    $stmt = $db->prepare('
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
            p.passenger_id,
            p.passport_no,
            p.given_names,
            p.surname,
            p.email,
            p.contact_no,
            f.flight_id,
            f.flight_no,
            f.departure_airport,
            f.destination_airport,
            f.departure_datetime,
            f.arrival_datetime,
            f.base_ticket_price,
            a.airline_name,
            a.airline_code,
            a.country
        FROM bookings b
        JOIN passengers p ON b.passenger_id = p.passenger_id
        JOIN flights f ON b.flight_id = f.flight_id
        JOIN airlines a ON f.airline_id = a.airline_id
        WHERE b.booking_ref = :booking_ref AND p.passport_no = :passport_no
    ');
    
    $stmt->execute([
        ':booking_ref' => $booking_ref,
        ':passport_no' => $passport_no
    ]);
    
    $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$ticket) {
        http_response_code(404);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ticket not found. Please verify booking reference and passport number.'
        ]);
        exit;
    }
    
    // Check if booking is confirmed or paid
    if ($ticket['booking_status'] !== 'CONFIRMED' && $ticket['payment_status'] !== 'SUCCESS') {
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Ticket is not available. Booking status: ' . $ticket['booking_status'] . ', Payment status: ' . $ticket['payment_status']
        ]);
        exit;
    }
    
    // Format response
    $response = [
        'status' => 'success',
        'ticket' => [
            'booking_ref' => $ticket['booking_ref'],
            'ticket_no' => strtoupper($ticket['airline_code'] . '-' . substr($ticket['booking_ref'], 0, 6) . '-' . $ticket['seat_no']),
            'passenger' => [
                'name' => $ticket['given_names'] . ' ' . $ticket['surname'],
                'passport_no' => $ticket['passport_no'],
                'email' => $ticket['email'],
                'contact' => $ticket['contact_no']
            ],
            'flight' => [
                'flight_no' => $ticket['flight_no'],
                'airline' => $ticket['airline_name'],
                'airline_code' => $ticket['airline_code'],
                'departure' => [
                    'airport' => $ticket['departure_airport'],
                    'datetime' => $ticket['departure_datetime']
                ],
                'arrival' => [
                    'airport' => $ticket['destination_airport'],
                    'datetime' => $ticket['arrival_datetime']
                ]
            ],
            'booking' => [
                'seat' => $ticket['seat_no'],
                'base_price' => number_format($ticket['base_price'], 2),
                'service_charge' => number_format($ticket['service_charge'], 2),
                'discount' => number_format($ticket['discount'], 2),
                'final_price' => number_format($ticket['final_price'], 2),
                'booking_status' => $ticket['booking_status'],
                'payment_status' => $ticket['payment_status'],
                'booking_date' => $ticket['booking_date']
            ]
        ]
    ];
    
    sendJsonResponse($response);
    
} catch (PDOException $e) {
    http_response_code(500);
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function requireRequestMethod($method) {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        http_response_code(405);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Method not allowed. Expected ' . $method
        ]);
        exit;
    }
}

function sendJsonResponse($data) {
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
}
