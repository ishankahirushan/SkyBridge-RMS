<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$flightId = (int) ($_POST['flight_id'] ?? 0);
$seatCategory = trim($_POST['seat_category'] ?? '');
$passengerFullName = trim($_POST['passenger_full_name'] ?? '');
$passengerContactNo = trim($_POST['passenger_contact_no'] ?? '');
$passengerEmail = trim($_POST['passenger_email'] ?? '');
$passportNo = trim($_POST['passport_no'] ?? '');
$selectedSeats = trim($_POST['selected_seats'] ?? ''); // JSON array of seat numbers
$totalPrice = (float) ($_POST['total_price'] ?? 0);

if ($flightId <= 0 || !$seatCategory || !$passengerFullName || !$passengerContactNo || !$passengerEmail || !$passportNo) {
    error_response('Required fields are missing', 422);
}

if ($totalPrice < 0) {
    error_response('Total price cannot be negative', 422);
}

try {
    // Verify flight exists
    $flightSql = 'SELECT flight_id FROM flights WHERE flight_id = ? LIMIT 1';
    $flightStmt = $conn->prepare($flightSql);
    if (!$flightStmt) {
        error_response('Database error', 500);
    }
    $flightStmt->bind_param('i', $flightId);
    $flightStmt->execute();
    $flightResult = $flightStmt->get_result();
    if (!$flightResult->fetch_assoc()) {
        error_response('Flight not found', 404);
    }
    $flightStmt->close();

    // Verify passport verification record exists and is valid
    $passportSql = 'SELECT verification_id, full_name FROM passport_verification WHERE passport_no = ? AND expiry_date > NOW() AND status = "valid" LIMIT 1';
    $passportStmt = $conn->prepare($passportSql);
    if (!$passportStmt) {
        error_response('Database error', 500);
    }
    $passportStmt->bind_param('s', $passportNo);
    $passportStmt->execute();
    $passportResult = $passportStmt->get_result();
    $passportRecord = $passportResult->fetch_assoc();
    $passportStmt->close();

    if (!$passportRecord) {
        error_response('Passport verification not found or invalid', 404);
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Create unique booking reference
        $bookingRef = 'BK' . date('YmdHis') . mt_rand(1000, 9999);

        // Insert into passengers table
        $passengerSql = 'INSERT INTO passengers (booking_id, full_name, contact_no, email, passport_no) VALUES (?, ?, ?, ?, ?)';
        $passengerStmt = $conn->prepare($passengerSql);
        if (!$passengerStmt) {
            throw new Exception('Database error: ' . $conn->error);
        }

        // We'll update the booking_id after creating booking, so for now pass 0
        $bookingIdPlaceholder = 0;
        $passengerStmt->bind_param('issss', $bookingIdPlaceholder, $passengerFullName, $passengerContactNo, $passengerEmail, $passportNo);

        // Insert into bookings table
        $agentId = current_user()['agent_id'] ?? null;
        $bookingStatus = 'confirmed';

        $bookingSql = 'INSERT INTO bookings (booking_ref, flight_id, agent_id, booking_status, total_price, booking_date, selected_seats) VALUES (?, ?, ?, ?, ?, NOW(), ?)';
        $bookingStmt = $conn->prepare($bookingSql);
        if (!$bookingStmt) {
            throw new Exception('Database error: ' . $conn->error);
        }

        $bookingStmt->bind_param('siisds', $bookingRef, $flightId, $agentId, $bookingStatus, $totalPrice, $selectedSeats);

        if (!$bookingStmt->execute()) {
            throw new Exception('Failed to insert booking: ' . $bookingStmt->error);
        }

        $bookingId = $bookingStmt->insert_id;
        $bookingStmt->close();

        // Now insert passenger with actual booking_id
        $passengerStmt->bind_param('issss', $bookingId, $passengerFullName, $passengerContactNo, $passengerEmail, $passportNo);
        if (!$passengerStmt->execute()) {
            throw new Exception('Failed to insert passenger: ' . $passengerStmt->error);
        }
        $passengerStmt->close();

        // Update seat availability if needed (optional: track seat reservations)
        $seatSql = 'UPDATE flight_seat_categories SET available_seats = available_seats - 1 WHERE flight_id = ? AND seat_category = ? AND available_seats > 0';
        $seatStmt = $conn->prepare($seatSql);
        if (!$seatStmt) {
            throw new Exception('Database error: ' . $conn->error);
        }
        $seatStmt->bind_param('is', $flightId, $seatCategory);
        if (!$seatStmt->execute()) {
            throw new Exception('Failed to update seat availability: ' . $seatStmt->error);
        }
        $seatStmt->close();

        // Audit log
        audit_log(
            $conn,
            $agentId,
            'booking_created',
            'bookings',
            (string) $bookingId,
            'Booking created for passenger ' . $passengerFullName . ' on flight ' . $flightId
        );

        // Commit transaction
        $conn->commit();

        success_response('Booking created successfully', [
            'booking_id' => $bookingId,
            'booking_ref' => $bookingRef,
            'flight_id' => $flightId,
            'passenger' => [
                'full_name' => $passengerFullName,
                'contact_no' => $passengerContactNo,
                'email' => $passengerEmail,
                'passport_no' => $passportNo
            ],
            'seat_category' => $seatCategory,
            'total_price' => round($totalPrice, 2),
            'booking_status' => $bookingStatus,
            'booking_date' => date('Y-m-d H:i:s')
        ]);
    } catch (Throwable $e) {
        $conn->rollback();
        throw $e;
    }
} catch (Throwable $exception) {
    error_response('Booking creation failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
