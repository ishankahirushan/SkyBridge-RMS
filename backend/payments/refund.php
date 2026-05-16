<?php

require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/payment.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$bookingRef = trim($_POST['booking_ref'] ?? '');

if ($bookingRef === '') {
    error_response('Booking reference is required', 422);
}

try {
    $bookingStmt = $conn->prepare('
        SELECT b.booking_ref, b.passenger_id, b.flight_id, b.seat_category, b.final_price, b.booking_status, b.payment_status, b.agent_id, t.payment_method, t.card_no, p.full_name
        FROM bookings b
        INNER JOIN passengers p ON p.passenger_id = b.passenger_id
        INNER JOIN transactions t ON t.booking_ref = b.booking_ref
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

    if ($booking['payment_status'] !== 'paid') {
        error_response('Only paid bookings can be refunded', 409);
    }

    $user = current_user();
    $agentId = (int) ($user['agent_id'] ?? 0);
    $isAdmin = ($user['role'] ?? '') === 'admin';

    // Enforce ownership for non-admin users
    if (!$isAdmin && ((int) ($booking['agent_id'] ?? 0) !== $agentId)) {
        error_response('Not authorized to refund this booking', 403);
    }

    $conn->begin_transaction();
    $refundAmount = (float) $booking['final_price'];
    $paymentMethod = $booking['payment_method'];
    $cardNo = trim((string) ($booking['card_no'] ?? ''));

    $agency = fetch_agency_config($conn);
    $companyAccount = fetch_company_account($conn, $agency['account_number']);
    $newCompanyBalance = (float) $companyAccount['current_balance'] - $refundAmount;

    if ($newCompanyBalance < 0) {
        throw new RuntimeException('Insufficient company balance for refund');
    }

    update_balance($conn, (int) $companyAccount['account_id'], $newCompanyBalance);

    $newPassengerBalance = null;
    if ($paymentMethod === 'card') {
        if ($cardNo === '') {
            $cardLookupStmt = $conn->prepare('SELECT card_no FROM payment_accounts WHERE owner_type = "passenger" AND owner_name = ? LIMIT 1');
            if (!$cardLookupStmt) {
                throw new RuntimeException('Database error while resolving card account');
            }

            $cardLookupStmt->bind_param('s', $booking['full_name']);
            $cardLookupStmt->execute();
            $cardLookupResult = $cardLookupStmt->get_result();
            $cardLookup = $cardLookupResult->fetch_assoc();
            $cardLookupStmt->close();

            $cardNo = trim((string) ($cardLookup['card_no'] ?? ''));
        }

        if ($cardNo !== '') {
            $passengerAccount = fetch_card_account($conn, $cardNo);
            $newPassengerBalance = (float) $passengerAccount['current_balance'] + $refundAmount;
            update_balance($conn, (int) $passengerAccount['account_id'], $newPassengerBalance);
        }
    }

    $bookingUpdateStmt = $conn->prepare('UPDATE bookings SET booking_status = ?, payment_status = ?, updated_by = ? WHERE booking_ref = ?');
    if (!$bookingUpdateStmt) {
        throw new RuntimeException('Database error while updating booking');
    }

    $bookingStatus = 'cancelled';
    $paymentStatus = 'refunded';
    $bookingUpdateStmt->bind_param('ssis', $bookingStatus, $paymentStatus, $agentId, $bookingRef);
    $bookingUpdateStmt->execute();
    $bookingUpdateStmt->close();

    $transactionStmt = $conn->prepare('UPDATE transactions SET transaction_status = ?, updated_by = ? WHERE booking_ref = ?');
    if (!$transactionStmt) {
        throw new RuntimeException('Database error while updating transaction');
    }

    $transactionStatus = 'refunded';
    $transactionStmt->bind_param('sis', $transactionStatus, $agentId, $bookingRef);
    $transactionStmt->execute();
    $transactionStmt->close();

    $flightId = (int) $booking['flight_id'];
    $seatCategory = $booking['seat_category'];

    $seatUpdateStmt = $conn->prepare('UPDATE flight_seat_categories SET available_seats = available_seats + 1 WHERE flight_id = ? AND seat_category = ?');
    if (!$seatUpdateStmt) {
        throw new RuntimeException('Database error while updating seat stock');
    }

    $seatUpdateStmt->bind_param('is', $flightId, $seatCategory);
    $seatUpdateStmt->execute();
    $seatUpdateStmt->close();

    audit_log(
        $conn,
        $agentId,
        'refund_processed',
        'bookings',
        $bookingRef,
        'Refund processed for ' . $paymentMethod . ' payment. Amount: ' . $refundAmount
    );

    $conn->commit();

    $response = [
        'booking_ref' => $bookingRef,
        'refund_amount' => round($refundAmount, 2),
        'payment_method' => $paymentMethod,
        'company_balance' => round($newCompanyBalance, 2),
    ];

    if ($paymentMethod === 'card' && $newPassengerBalance !== null) {
        $response['card_balance'] = round($newPassengerBalance, 2);
    }

    success_response('Refund successful', $response);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Refund failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
