<?php

function generate_booking_ref(mysqli $conn): string
{
    do {
        $bookingRef = 'SKY-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
        $stmt = $conn->prepare('SELECT booking_ref FROM bookings WHERE booking_ref = ? LIMIT 1');
        if (!$stmt) {
            throw new RuntimeException('Database error while generating booking reference');
        }
        $stmt->bind_param('s', $bookingRef);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->fetch_assoc();
        $stmt->close();
    } while ($exists);

    return $bookingRef;
}

function fetch_agency_config(mysqli $conn): array
{
    $result = $conn->query('SELECT agency_id, agency_name, service_charge, account_number FROM agency ORDER BY agency_id ASC LIMIT 1');

    if (!$result) {
        throw new RuntimeException('Agency configuration not found');
    }

    $agency = $result->fetch_assoc();

    if (!$agency) {
        throw new RuntimeException('Agency configuration not found');
    }

    return $agency;
}

function fetch_flight_pricing(mysqli $conn, int $flightId, string $seatCategory): array
{
    $sql = 'SELECT f.flight_id, f.base_ticket_price, fsc.price_multiplier, fsc.available_seats FROM flights f INNER JOIN flight_seat_categories fsc ON fsc.flight_id = f.flight_id WHERE f.flight_id = ? AND fsc.seat_category = ? LIMIT 1';
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new RuntimeException('Database error while fetching flight pricing');
    }

    $stmt->bind_param('is', $flightId, $seatCategory);
    $stmt->execute();
    $result = $stmt->get_result();
    $pricing = $result->fetch_assoc();
    $stmt->close();

    if (!$pricing) {
        throw new RuntimeException('Flight or seat category not found');
    }

    return $pricing;
}

function fetch_passport_record(mysqli $conn, string $passportNo): array
{
    $stmt = $conn->prepare('SELECT verification_id, passport_no, full_name, expiry_date, status FROM passport_verification WHERE passport_no = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Database error while verifying passport');
    }

    $stmt->bind_param('s', $passportNo);
    $stmt->execute();
    $result = $stmt->get_result();
    $passport = $result->fetch_assoc();
    $stmt->close();

    if (!$passport) {
        throw new RuntimeException('Passport not found');
    }

    $expiryDate = new DateTimeImmutable($passport['expiry_date']);
    $today = new DateTimeImmutable('today');

    if ($passport['status'] === 'BLACKLISTED') {
        throw new RuntimeException('Passport blacklisted');
    }

    if ($passport['status'] === 'EXPIRED' || $expiryDate < $today) {
        throw new RuntimeException('Passport expired');
    }

    return $passport;
}

function fetch_company_account(mysqli $conn, string $accountNo): array
{
    $stmt = $conn->prepare('SELECT account_id, owner_type, owner_name, account_no, current_balance FROM payment_accounts WHERE account_no = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Database error while fetching company account');
    }

    $stmt->bind_param('s', $accountNo);
    $stmt->execute();
    $result = $stmt->get_result();
    $account = $result->fetch_assoc();
    $stmt->close();

    if (!$account || $account['owner_type'] !== 'agency') {
        throw new RuntimeException('Company account not found');
    }

    return $account;
}

function fetch_card_account(mysqli $conn, string $cardNo): array
{
    $stmt = $conn->prepare('SELECT account_id, owner_type, owner_name, card_no, current_balance FROM payment_accounts WHERE card_no = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Database error while fetching card account');
    }

    $stmt->bind_param('s', $cardNo);
    $stmt->execute();
    $result = $stmt->get_result();
    $account = $result->fetch_assoc();
    $stmt->close();

    if (!$account || $account['owner_type'] !== 'passenger') {
        throw new RuntimeException('Card not found');
    }

    return $account;
}

function update_balance(mysqli $conn, int $accountId, float $newBalance): void
{
    $stmt = $conn->prepare('UPDATE payment_accounts SET current_balance = ? WHERE account_id = ?');
    if (!$stmt) {
        throw new RuntimeException('Database error while updating balance');
    }

    $stmt->bind_param('di', $newBalance, $accountId);
    $stmt->execute();
    $stmt->close();
}

function decrement_seat_stock(mysqli $conn, int $flightId, string $seatCategory): void
{
    $stmt = $conn->prepare('UPDATE flight_seat_categories SET available_seats = available_seats - 1 WHERE flight_id = ? AND seat_category = ? AND available_seats > 0');
    if (!$stmt) {
        throw new RuntimeException('Database error while updating seat stock');
    }

    $stmt->bind_param('is', $flightId, $seatCategory);
    $stmt->execute();

    if ($stmt->affected_rows !== 1) {
        $stmt->close();
        throw new RuntimeException('Seat not available');
    }

    $stmt->close();
}
