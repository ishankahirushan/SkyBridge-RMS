<?php

require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/payment.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$passportNo = trim($_POST['passport_no'] ?? '');
$contactNo = trim($_POST['contact_no'] ?? '');
$email = trim($_POST['email'] ?? '');
$flightId = (int) ($_POST['flight_id'] ?? 0);
$seatCategory = trim($_POST['seat_category'] ?? '');
$amount = (float) ($_POST['amount'] ?? 0);
$discount = (float) ($_POST['discount'] ?? 0);

if ($passportNo === '' || $contactNo === '' || $email === '' || $flightId <= 0 || $seatCategory === '' || $amount <= 0) {
    error_response('All required fields must be provided', 422);
}

try {
    $passport = fetch_passport_record($conn, $passportNo);
    $agency = fetch_agency_config($conn);
    $pricing = fetch_flight_pricing($conn, $flightId, $seatCategory);

    $basePrice = (float) $pricing['base_ticket_price'];
    $seatMultiplier = (float) $pricing['price_multiplier'];
    $serviceCharge = (float) $agency['service_charge'];
    $calculatedAmount = round(($basePrice * $seatMultiplier) + $serviceCharge - $discount, 2);

    if ($calculatedAmount < 0) {
        $calculatedAmount = 0.00;
    }

    if (round($amount, 2) !== $calculatedAmount) {
        error_response('Amount does not match calculated price', 422, [
            'calculated_amount' => $calculatedAmount,
        ]);
    }

    $conn->begin_transaction();

    $bookingRef = generate_booking_ref($conn);
    $agentId = (int) (current_user()['agent_id'] ?? 0);
    $companyAccount = fetch_company_account($conn, $agency['account_number']);
    $newCompanyBalance = (float) $companyAccount['current_balance'] + $amount;

    update_balance($conn, (int) $companyAccount['account_id'], $newCompanyBalance);

    $passengerStmt = $conn->prepare('INSERT INTO passengers (booking_ref, passport_no, full_name, contact_no, email, payment_method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    if (!$passengerStmt) {
        throw new RuntimeException('Failed to prepare passenger insert');
    }

    $paymentMethod = 'cash';
    $passengerStmt->bind_param('ssssssi', $bookingRef, $passportNo, $passport['full_name'], $contactNo, $email, $paymentMethod, $agentId);
    $passengerStmt->execute();
    $passengerId = $conn->insert_id;
    $passengerStmt->close();

    $bookingStmt = $conn->prepare('INSERT INTO bookings (booking_ref, passenger_id, flight_id, seat_category, agent_id, base_price, service_charge, discount, final_price, booking_status, payment_status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    if (!$bookingStmt) {
        throw new RuntimeException('Failed to prepare booking insert');
    }

    $bookingStatus = 'active';
    $paymentStatus = 'paid';
    $bookingStmt->bind_param('siisiddddssi', $bookingRef, $passengerId, $flightId, $seatCategory, $agentId, $basePrice, $serviceCharge, $discount, $calculatedAmount, $bookingStatus, $paymentStatus, $agentId);
    $bookingStmt->execute();
    $bookingStmt->close();

    $transactionStmt = $conn->prepare('INSERT INTO transactions (booking_ref, payment_method, amount, transaction_status, created_by) VALUES (?, ?, ?, ?, ?)');
    if (!$transactionStmt) {
        throw new RuntimeException('Failed to prepare transaction insert');
    }

    $transactionStatus = 'completed';
    $transactionStmt->bind_param('ssdsi', $bookingRef, $paymentMethod, $calculatedAmount, $transactionStatus, $agentId);
    $transactionStmt->execute();
    $transactionId = $conn->insert_id;
    $transactionStmt->close();

    decrement_seat_stock($conn, $flightId, $seatCategory);

    audit_log(
        $conn,
        $agentId,
        'cash_payment_success',
        'transactions',
        (string) $transactionId,
        'Cash payment completed for booking ' . $bookingRef
    );

    $conn->commit();

    success_response('Payment successful', [
        'booking_ref' => $bookingRef,
        'transaction_id' => $transactionId,
        'passenger_id' => $passengerId,
        'calculated_amount' => $calculatedAmount,
        'company_account_number' => $agency['account_number'],
        'company_balance' => round($newCompanyBalance, 2),
    ]);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Cash payment failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}