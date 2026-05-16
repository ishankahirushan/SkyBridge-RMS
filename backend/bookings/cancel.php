<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$bookingRef = trim($_POST['booking_ref'] ?? '');
$reason = trim($_POST['reason'] ?? '');

if ($bookingRef === '') {
    error_response('Booking reference is required', 422);
}

try {
    $bookingStmt = $conn->prepare('
        SELECT b.booking_ref, b.flight_id, b.seat_category, b.booking_status, b.payment_status, b.agent_id
        FROM bookings b
        WHERE b.booking_ref = ? LIMIT 1
    ');

    if (!$bookingStmt) {
        throw new RuntimeException('Database error while fetching booking');
    }

    $bookingStmt->bind_param('s', $bookingRef);
    $bookingStmt->execute();
    $bookingResult = $bookingStmt->get_result();
    $booking = $bookingResult->fetch_assoc();
    $bookingStmt->close();

    if (!$booking) {
        error_response('Booking not found', 404);
    }

    if ($booking['booking_status'] === 'cancelled') {
        error_response('Booking already cancelled', 409);
    }

    if ($booking['payment_status'] === 'paid') {
        error_response('Cannot cancel paid bookings directly. Please use the refund endpoint instead.', 409);
    }

    $user = current_user();
    $agentId = (int) ($user['agent_id'] ?? 0);
    $isAdmin = ($user['role'] ?? '') === 'admin';

    // Enforce ownership for non-admin users
    if (!$isAdmin && ((int) ($booking['agent_id'] ?? 0) !== $agentId)) {
        error_response('Not authorized to cancel this booking', 403);
    }

    $conn->begin_transaction();

    $cancelStmt = $conn->prepare('UPDATE bookings SET booking_status = ?, updated_by = ? WHERE booking_ref = ?');
    if (!$cancelStmt) {
        throw new RuntimeException('Database error while updating booking');
    }

    $status = 'cancelled';
    $cancelStmt->bind_param('sis', $status, $agentId, $bookingRef);
    $cancelStmt->execute();
    $cancelStmt->close();

    $flightId = (int) $booking['flight_id'];
    $seatCategory = $booking['seat_category'];

    $seatStmt = $conn->prepare('UPDATE flight_seat_categories SET available_seats = available_seats + 1 WHERE flight_id = ? AND seat_category = ?');
    if (!$seatStmt) {
        throw new RuntimeException('Database error while updating seat stock');
    }

    $seatStmt->bind_param('is', $flightId, $seatCategory);
    $seatStmt->execute();
    $seatStmt->close();

    $descriptionText = 'Booking cancelled by agent';
    if ($reason !== '') {
        $descriptionText .= ': ' . $reason;
    }

    audit_log(
        $conn,
        $agentId,
        'booking_cancelled',
        'bookings',
        $bookingRef,
        $descriptionText
    );

    $conn->commit();

    success_response('Booking cancelled', [
        'booking_ref' => $bookingRef,
        'flight_id' => $flightId,
        'seat_category' => $seatCategory,
        'new_status' => 'cancelled',
    ]);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Booking cancellation failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
