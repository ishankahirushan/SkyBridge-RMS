<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
$user = requireAgent();

$payload = getJsonBody();
$bookingRef = strtoupper(trim((string)($payload['booking_ref'] ?? '')));

if ($bookingRef === '') {
    sendJsonResponse([
        'success' => false,
        'message' => 'Booking reference is required.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();
    $pdo->beginTransaction();

    $bookingStmt = $pdo->prepare(
        'SELECT booking_ref, flight_id, booking_status FROM bookings WHERE booking_ref = :booking_ref AND agent_id = :agent_id FOR UPDATE'
    );
    $bookingStmt->execute([
        'booking_ref' => $bookingRef,
        'agent_id' => $user['user_id']
    ]);
    $booking = $bookingStmt->fetch();

    if (!$booking) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Booking not found.'
        ], 404);
    }

    if (in_array($booking['booking_status'], ['CANCELLED', 'REFUNDED'], true)) {
        $pdo->rollBack();
        sendJsonResponse([
            'success' => false,
            'message' => 'Booking is already closed.'
        ], 400);
    }

    $updateBooking = $pdo->prepare(
        "UPDATE bookings
         SET booking_status = 'CANCELLED', payment_status = CASE WHEN payment_status = 'SUCCESS' THEN 'REFUNDED' ELSE payment_status END
         WHERE booking_ref = :booking_ref"
    );
    $updateBooking->execute(['booking_ref' => $bookingRef]);

    $updateFlight = $pdo->prepare('UPDATE flights SET available_seats = available_seats + 1 WHERE flight_id = :flight_id');
    $updateFlight->execute(['flight_id' => (int)$booking['flight_id']]);

    $pdo->commit();

    sendJsonResponse([
        'success' => true,
        'message' => 'Booking cancelled successfully.'
    ]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to cancel booking.'
    ], 500);
}
