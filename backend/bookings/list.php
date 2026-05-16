<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

    $status = trim($_GET['status'] ?? '');
    $limit = min((int) ($_GET['limit'] ?? 50), 1000);
    $offset = max(0, (int) ($_GET['offset'] ?? 0));

    $user = current_user();
    $isAdmin = ($user['role'] ?? '') === 'admin';

try {
    $query = '
        SELECT 
            b.booking_ref,
            b.agent_id,
            b.passenger_id,
            b.flight_id,
            b.seat_category,
            b.final_price,
            b.booking_status,
            b.payment_status,
            b.created_at,
            p.full_name AS passenger_name,
            p.passport_no,
            p.contact_no,
            p.email,
            t.payment_method AS transaction_payment_method,
            f.flight_no,
            f.departure_airport,
            f.destination_airport,
            f.departure_datetime,
            f.arrival_datetime,
            a.airline_name
        FROM bookings b
        INNER JOIN passengers p ON p.passenger_id = b.passenger_id
        INNER JOIN flights f ON f.flight_id = b.flight_id
        INNER JOIN airlines a ON a.airline_id = f.airline_id
        INNER JOIN transactions t ON t.booking_ref = b.booking_ref
    ';

    $conditions = [];
    $filterParams = [];
    $filterTypes = '';

    if ($status !== '') {
        $conditions[] = 'b.booking_status = ?';
        $filterParams[] = $status;
        $filterTypes .= 's';
    }

    // Apply agent scoping for non-admin users
    if (!$isAdmin) {
        $conditions[] = 'b.agent_id = ?';
        $filterParams[] = (int) ($user['agent_id'] ?? 0);
        $filterTypes .= 'i';
    }

    if (!empty($conditions)) {
        $query .= ' WHERE ' . implode(' AND ', $conditions);
    }

    $query .= ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    $params = $filterParams;
    $types = $filterTypes;
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new RuntimeException('Database error while preparing query');
    }

    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $bookings = [];

    while ($row = $result->fetch_assoc()) {
        $bookings[] = [
            'booking_ref' => $row['booking_ref'],
            'passenger_id' => (int) $row['passenger_id'],
            'agent_id' => isset($row['agent_id']) ? (int) $row['agent_id'] : null,
            'flight_id' => (int) $row['flight_id'],
            'seat_category' => $row['seat_category'],
            'final_price' => (float) $row['final_price'],
            'booking_status' => $row['booking_status'],
            'payment_status' => $row['payment_status'],
            'created_at' => $row['created_at'],
            'passenger' => [
                'name' => $row['passenger_name'],
                'passport_no' => $row['passport_no'],
                'contact_no' => $row['contact_no'],
                'email' => $row['email'],
                'payment_method' => $row['transaction_payment_method'],
            ],
            'flight' => [
                'flight_no' => $row['flight_no'],
                'departure_airport' => $row['departure_airport'],
                'destination_airport' => $row['destination_airport'],
                'departure_datetime' => $row['departure_datetime'],
                'arrival_datetime' => $row['arrival_datetime'],
                'airline_name' => $row['airline_name'],
            ],
        ];
    }

    $stmt->close();

    $totalStmt = $conn->prepare('SELECT COUNT(*) as total FROM bookings b' . (!empty($conditions) ? ' WHERE ' . implode(' AND ', $conditions) : ''));
    if (!$totalStmt) {
        throw new RuntimeException('Database error while counting bookings');
    }

    if (!empty($conditions)) {
        $totalStmt->bind_param($filterTypes, ...$filterParams);
    }

    $totalStmt->execute();
    $totalResult = $totalStmt->get_result();
    $totalRow = $totalResult->fetch_assoc();
    $total = (int) $totalRow['total'];
    $totalStmt->close();

    success_response('Bookings retrieved', [
        'bookings' => $bookings,
        'pagination' => [
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'count' => count($bookings),
        ],
    ]);
} catch (Throwable $exception) {
    error_response('Failed to retrieve bookings', 500, [
        'error' => $exception->getMessage(),
    ]);
}
