<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
$user = requireAgent();

$payload = getJsonBody();
$passportNo = strtoupper(trim((string)($payload['passport_no'] ?? '')));
$flightId = (int)($payload['flight_id'] ?? 0);
$seatNo = strtoupper(trim((string)($payload['seat_no'] ?? '')));
$serviceCharge = (float)($payload['service_charge'] ?? 0);
$discount = (float)($payload['discount'] ?? 0);

if ($passportNo === '' || $flightId <= 0 || $serviceCharge < 0 || $discount < 0) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Invalid booking payload.'
    ], 400);
}

if ($seatNo === '') {
    $seatNo = 'AUTO';
}

try {
    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    $passengerStmt = $pdo->prepare('SELECT passenger_id FROM passengers WHERE passport_no = :passport_no LIMIT 1');
    $passengerStmt->execute(['passport_no' => $passportNo]);
    $passenger = $passengerStmt->fetch();

    if (!$passenger) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Passenger is not registered.'
        ], 400);
    }

    $verificationStmt = $pdo->prepare(
        'SELECT status, expiry_date FROM passport_verification WHERE passport_no = :passport_no LIMIT 1'
    );
    $verificationStmt->execute(['passport_no' => $passportNo]);
    $verification = $verificationStmt->fetch();

    if (!$verification) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Passenger verification record not found.'
        ], 400);
    }

    $status = (string)$verification['status'];
    if ($status === 'VALID' && strtotime((string)$verification['expiry_date']) < strtotime(date('Y-m-d'))) {
        $status = 'EXPIRED';
    }

    if ($status !== 'VALID') {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Passenger passport status is ' . $status . '.'
        ], 400);
    }

    $flightStmt = $pdo->prepare(
        "SELECT
            f.flight_id,
            f.base_ticket_price,
            f.available_seats
        FROM flights f
        LEFT JOIN our_airlines oa ON oa.airline_id = f.airline_id
        WHERE f.flight_id = :flight_id
          AND f.status = 'SCHEDULED'
          AND COALESCE(oa.status, 'DISABLED') = 'ENABLED'
        FOR UPDATE"
    );
    $flightStmt->execute(['flight_id' => $flightId]);
    $flight = $flightStmt->fetch();

    if (!$flight) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Flight is unavailable.'
        ], 400);
    }

    if ((int)$flight['available_seats'] <= 0) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'No available seats for this flight.'
        ], 400);
    }

    if ($seatNo === 'AUTO') {
        $seatNo = 'S' . str_pad((string)random_int(1, 999), 3, '0', STR_PAD_LEFT);
    }

    $seatCheck = $pdo->prepare('SELECT 1 FROM bookings WHERE flight_id = :flight_id AND seat_no = :seat_no LIMIT 1');
    $seatCheck->execute([
        'flight_id' => $flightId,
        'seat_no' => $seatNo
    ]);

    if ($seatCheck->fetch()) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Selected seat is already booked.'
        ], 400);
    }

    $basePrice = (float)$flight['base_ticket_price'];
    $finalPrice = $basePrice + $serviceCharge - $discount;

    if ($finalPrice < 0) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Final price cannot be negative.'
        ], 400);
    }

    $bookingRef = 'BK' . date('ymd') . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));

    $insertBooking = $pdo->prepare(
        "INSERT INTO bookings (
            booking_ref,
            passenger_id,
            flight_id,
            agent_id,
            seat_no,
            base_price,
            service_charge,
            discount,
            final_price,
            booking_status,
            payment_status,
            booking_date
        ) VALUES (
            :booking_ref,
            :passenger_id,
            :flight_id,
            :agent_id,
            :seat_no,
            :base_price,
            :service_charge,
            :discount,
            :final_price,
            'PENDING',
            'PENDING',
            NOW()
        )"
    );

    $insertBooking->execute([
        'booking_ref' => $bookingRef,
        'passenger_id' => (int)$passenger['passenger_id'],
        'flight_id' => $flightId,
        'agent_id' => $user['user_id'],
        'seat_no' => $seatNo,
        'base_price' => $basePrice,
        'service_charge' => $serviceCharge,
        'discount' => $discount,
        'final_price' => $finalPrice
    ]);

    $updateSeats = $pdo->prepare('UPDATE flights SET available_seats = available_seats - 1 WHERE flight_id = :flight_id');
    $updateSeats->execute(['flight_id' => $flightId]);

    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'message' => 'Booking created successfully.',
        'booking_ref' => $bookingRef,
        'final_price' => $finalPrice
    ]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to create booking.'
    ], 500);
}
