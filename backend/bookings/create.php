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
$paymentMethod = trim($_POST['payment_method'] ?? 'cash');
$basePrice = (float) ($_POST['base_price'] ?? 0);
$serviceCharge = (float) ($_POST['service_charge'] ?? 0);
$discount = (float) ($_POST['discount'] ?? 0);
$finalPrice = (float) ($_POST['final_price'] ?? 0);

if ($flightId <= 0 || !$seatCategory || !$passengerFullName || !$passengerContactNo || !$passengerEmail || !$passportNo) {
    error_response('Required fields are missing', 422);
}

if ($finalPrice < 0) {
    error_response('Final price cannot be negative', 422);
}

if (!in_array($paymentMethod, ['cash', 'card'], true)) {
    error_response('Invalid payment method', 422);
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

    $existingPassengerId = null;
    $passengerLookup = $conn->prepare('SELECT passenger_id FROM passengers WHERE passport_no = ? LIMIT 1');
    if (!$passengerLookup) {
        error_response('Database error', 500);
    }
    $passengerLookup->bind_param('s', $passportNo);
    $passengerLookup->execute();
    $passengerResult = $passengerLookup->get_result();
    $passengerRow = $passengerResult->fetch_assoc();
    $passengerLookup->close();

    if ($passengerRow && !empty($passengerRow['passenger_id'])) {
        $existingPassengerId = (int) $passengerRow['passenger_id'];
    }

    // Start transaction
    $conn->begin_transaction();

    try {
        // Create unique booking reference
        $bookingRef = 'BK' . date('YmdHis') . mt_rand(1000, 9999);

        if ($existingPassengerId !== null) {
            $passengerId = $existingPassengerId;
        } else {
            // Insert into passengers table
            $passengerSql = 'INSERT INTO passengers (booking_ref, passport_no, full_name, contact_no, email, payment_method) VALUES (?, ?, ?, ?, ?, ?)';
            $passengerStmt = $conn->prepare($passengerSql);
            if (!$passengerStmt) {
                throw new Exception('Database error: ' . $conn->error);
            }

            $passengerStmt->bind_param('ssssss', $bookingRef, $passportNo, $passengerFullName, $passengerContactNo, $passengerEmail, $paymentMethod);

            if (!$passengerStmt->execute()) {
                throw new Exception('Failed to insert passenger: ' . $passengerStmt->error);
            }

            $passengerId = $passengerStmt->insert_id;
            $passengerStmt->close();
        }

        // Insert into bookings table
        $agentId = current_user()['agent_id'] ?? null;
        $bookingStatus = 'active';
        $paymentStatus = 'pending';

        $bookingSql = 'INSERT INTO bookings (booking_ref, passenger_id, flight_id, seat_category, agent_id, base_price, service_charge, discount, final_price, booking_status, payment_status, booking_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())';
        $bookingStmt = $conn->prepare($bookingSql);
        if (!$bookingStmt) {
            throw new Exception('Database error: ' . $conn->error);
        }

        $bookingStmt->bind_param('siissddddss', $bookingRef, $passengerId, $flightId, $seatCategory, $agentId, $basePrice, $serviceCharge, $discount, $finalPrice, $bookingStatus, $paymentStatus);

        if (!$bookingStmt->execute()) {
            throw new Exception('Failed to insert booking: ' . $bookingStmt->error);
        }

        $bookingStmt->close();

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
            $bookingRef,
            'Booking created for passenger ' . $passengerFullName . ' on flight ' . $flightId
        );

        // Commit transaction
        $conn->commit();

        success_response('Booking created successfully', [
            'booking_ref' => $bookingRef,
            'passenger_id' => $passengerId,
            'flight_id' => $flightId,
            'passenger' => [
                'full_name' => $passengerFullName,
                'contact_no' => $passengerContactNo,
                'email' => $passengerEmail,
                'passport_no' => $passportNo
            ],
            'payment_method' => $paymentMethod,
            'seat_category' => $seatCategory,
            'base_price' => round($basePrice, 2),
            'service_charge' => round($serviceCharge, 2),
            'discount' => round($discount, 2),
            'final_price' => round($finalPrice, 2),
            'booking_status' => $bookingStatus,
            'payment_status' => $paymentStatus,
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
