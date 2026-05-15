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
$cardNo = trim($_POST['card_no'] ?? '');
$companyAccountNo = trim($_POST['company_account_no'] ?? '');
$amount = (float) ($_POST['amount'] ?? 0);
$discount = (float) ($_POST['discount'] ?? 0);

if ($passportNo === '' || $contactNo === '' || $email === '' || $flightId <= 0 || $seatCategory === '' || $cardNo === '' || $companyAccountNo === '' || $amount <= 0) {
    error_response('All required fields must be provided', 422);
}

try {
    $passport = fetch_passport_record($conn, $passportNo);
    $pricing = fetch_flight_pricing($conn, $flightId, $seatCategory);
    $agency = fetch_agency_config($conn);
    $paymentMethod = 'card';

    if ($agency['account_number'] !== $companyAccountNo) {
        error_response('Company account number mismatch', 422);
    }

    $companyAccount = fetch_company_account($conn, $companyAccountNo);
    $cardAccount = fetch_card_account($conn, $cardNo);

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

    if ((float) $cardAccount['current_balance'] < $calculatedAmount) {
        error_response('Insufficient Balance', 422, [
            'available_balance' => round((float) $cardAccount['current_balance'], 2),
        ]);
    }

    $conn->begin_transaction();

    $bookingRef = generate_booking_ref($conn);
    $agentId = (int) (current_user()['agent_id'] ?? 0);

    $newPassengerBalance = (float) $cardAccount['current_balance'] - $calculatedAmount;
    $newCompanyBalance = (float) $companyAccount['current_balance'] + $calculatedAmount;

    update_balance($conn, (int) $cardAccount['account_id'], $newPassengerBalance);
    update_balance($conn, (int) $companyAccount['account_id'], $newCompanyBalance);

    // Reuse existing passenger if present to avoid duplicate passport entries
    $passengerId = null;
    $checkStmt = $conn->prepare('SELECT passenger_id FROM passengers WHERE passport_no = ? LIMIT 1');
    if (!$checkStmt) {
        throw new RuntimeException('Failed to prepare passenger lookup');
    }
    $checkStmt->bind_param('s', $passportNo);
    $checkStmt->execute();
    $checkRes = $checkStmt->get_result();
    $existing = $checkRes->fetch_assoc();
    $checkStmt->close();

    if ($existing && !empty($existing['passenger_id'])) {
        $passengerId = (int) $existing['passenger_id'];
    } else {
        $passengerStmt = $conn->prepare('INSERT INTO passengers (booking_ref, passport_no, full_name, contact_no, email, payment_method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
        if (!$passengerStmt) {
            throw new RuntimeException('Failed to prepare passenger insert');
        }

        $passengerStmt->bind_param('ssssssi', $bookingRef, $passportNo, $passport['full_name'], $contactNo, $email, $paymentMethod, $agentId);
        $passengerStmt->execute();
        $passengerId = $conn->insert_id;
        $passengerStmt->close();
    }

    $bookingStmt = $conn->prepare('INSERT INTO bookings (booking_ref, passenger_id, flight_id, seat_category, agent_id, base_price, service_charge, discount, final_price, booking_status, payment_status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    if (!$bookingStmt) {
        throw new RuntimeException('Failed to prepare booking insert');
    }

    $bookingStatus = 'active';
    $paymentStatus = 'paid';
    $bookingStmt->bind_param('siisiddddssi', $bookingRef, $passengerId, $flightId, $seatCategory, $agentId, $basePrice, $serviceCharge, $discount, $calculatedAmount, $bookingStatus, $paymentStatus, $agentId);
    $bookingStmt->execute();
    $bookingStmt->close();

    $transactionStmt = $conn->prepare('INSERT INTO transactions (booking_ref, payment_method, card_no, amount, transaction_status, created_by) VALUES (?, ?, ?, ?, ?, ?)');
    if (!$transactionStmt) {
        throw new RuntimeException('Failed to prepare transaction insert');
    }

    $transactionStatus = 'completed';
    $transactionStmt->bind_param('sssdsi', $bookingRef, $paymentMethod, $cardNo, $calculatedAmount, $transactionStatus, $agentId);
    $transactionStmt->execute();
    $transactionId = $conn->insert_id;
    $transactionStmt->close();

    decrement_seat_stock($conn, $flightId, $seatCategory);

    audit_log(
        $conn,
        $agentId,
        'card_payment_success',
        'transactions',
        (string) $transactionId,
        'Card payment completed for booking ' . $bookingRef
    );

    $conn->commit();

    success_response('Payment successful', [
        'booking_ref' => $bookingRef,
        'transaction_id' => $transactionId,
        'passenger_id' => $passengerId,
        'calculated_amount' => $calculatedAmount,
        'company_account_number' => $companyAccountNo,
        'company_balance' => round($newCompanyBalance, 2),
        'card_balance' => round($newPassengerBalance, 2),
    ]);
} catch (Throwable $exception) {
    $conn->rollback();

    // Log full exception details to server error log for debugging
    error_log('[process-card] Exception: ' . $exception->getMessage());
    error_log('[process-card] Trace: ' . $exception->getTraceAsString());

    // Also append to a persistent log file for easier inspection
    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/process-card-errors.log';
    $logEntry = '[' . date('Y-m-d H:i:s') . '] Exception: ' . $exception->getMessage() . PHP_EOL . $exception->getTraceAsString() . PHP_EOL . PHP_EOL;
    @file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    error_response('Card payment failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}