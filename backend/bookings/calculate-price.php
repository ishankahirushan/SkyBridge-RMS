<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$flightId = (int) ($_POST['flight_id'] ?? 0);
$seatCategory = trim($_POST['seat_category'] ?? '');
$discount = (float) ($_POST['discount'] ?? 0);

if ($flightId <= 0 || $seatCategory === '') {
    error_response('Flight ID and seat category are required', 422);
}

if ($discount < 0) {
    error_response('Discount cannot be negative', 422);
}

try {
    $flightSql = 'SELECT flight_id, base_ticket_price FROM flights WHERE flight_id = ? LIMIT 1';
    $flightStmt = $conn->prepare($flightSql);

    if (!$flightStmt) {
        error_response('Database error', 500);
    }

    $flightStmt->bind_param('i', $flightId);
    $flightStmt->execute();
    $flightResult = $flightStmt->get_result();
    $flight = $flightResult->fetch_assoc();
    $flightStmt->close();

    if (!$flight) {
        error_response('Flight not found', 404);
    }

    $seatSql = 'SELECT seat_category, price_multiplier, available_seats FROM flight_seat_categories WHERE flight_id = ? AND seat_category = ? LIMIT 1';
    $seatStmt = $conn->prepare($seatSql);

    if (!$seatStmt) {
        error_response('Database error', 500);
    }

    $seatStmt->bind_param('is', $flightId, $seatCategory);
    $seatStmt->execute();
    $seatResult = $seatStmt->get_result();
    $seat = $seatResult->fetch_assoc();
    $seatStmt->close();

    if (!$seat) {
        error_response('Seat category not found for this flight', 404);
    }

    $agencySql = 'SELECT service_charge FROM agency ORDER BY agency_id ASC LIMIT 1';
    $agencyResult = $conn->query($agencySql);
    $agency = $agencyResult ? $agencyResult->fetch_assoc() : null;

    if (!$agency) {
        error_response('Agency configuration not found', 500);
    }

    $basePrice = (float) $flight['base_ticket_price'];
    $seatMultiplier = (float) $seat['price_multiplier'];
    $serviceCharge = (float) $agency['service_charge'];
    $grossPrice = $basePrice * $seatMultiplier;
    $finalPrice = $grossPrice + $serviceCharge - $discount;

    if ($finalPrice < 0) {
        $finalPrice = 0;
    }

    audit_log(
        $conn,
        current_user()['agent_id'] ?? null,
        'price_calculated',
        'bookings',
        (string) $flightId,
        'Pricing calculated for seat category ' . $seatCategory
    );

    success_response('Price calculated successfully', [
        'flight_id' => $flightId,
        'seat_category' => $seatCategory,
        'base_price' => round($basePrice, 2),
        'seat_multiplier' => round($seatMultiplier, 2),
        'service_charge' => round($serviceCharge, 2),
        'discount' => round($discount, 2),
        'final_price' => round($finalPrice, 2),
        'available_seats' => (int) $seat['available_seats'],
    ]);
} catch (Throwable $exception) {
    error_response('Price calculation failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}