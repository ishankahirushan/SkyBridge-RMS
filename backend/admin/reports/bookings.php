<?php

require_once __DIR__ . '/../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

$startDate = trim($_GET['start_date'] ?? '');
$endDate = trim($_GET['end_date'] ?? '');

if ($startDate === '' || $endDate === '') {
    error_response('start_date and end_date are required (YYYY-MM-DD format)', 422);
}

if (!strtotime($startDate) || !strtotime($endDate)) {
    error_response('Invalid date format. Use YYYY-MM-DD', 422);
}

try {
    $startDateTime = $startDate . ' 00:00:00';
    $endDateTime = $endDate . ' 23:59:59';

    $stmt = $conn->prepare('
        SELECT 
            COUNT(*) as total_bookings,
            SUM(CASE WHEN b.booking_status = "active" THEN 1 ELSE 0 END) as active_bookings,
            SUM(CASE WHEN b.booking_status = "cancelled" THEN 1 ELSE 0 END) as cancelled_bookings,
            SUM(CASE WHEN b.payment_status = "paid" THEN 1 ELSE 0 END) as paid_bookings,
            SUM(CASE WHEN b.payment_status = "pending" THEN 1 ELSE 0 END) as pending_bookings,
            SUM(CASE WHEN b.payment_status = "refunded" THEN 1 ELSE 0 END) as refunded_bookings,
            COUNT(DISTINCT b.flight_id) as unique_flights,
            COUNT(DISTINCT p.payment_method) as payment_methods_used
        FROM bookings b
        INNER JOIN passengers p ON p.passenger_id = b.passenger_id
        WHERE b.created_at BETWEEN ? AND ?
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while fetching booking stats');
    }

    $stmt->bind_param('ss', $startDateTime, $endDateTime);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();

    $stmt2 = $conn->prepare('
        SELECT b.seat_category, COUNT(*) as count, AVG(b.final_price) as avg_price
        FROM bookings b
        WHERE b.created_at BETWEEN ? AND ?
        GROUP BY b.seat_category
    ');

    if (!$stmt2) {
        throw new RuntimeException('Database error while fetching seat category stats');
    }

    $stmt2->bind_param('ss', $startDateTime, $endDateTime);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $seatStats = [];

    while ($row = $result2->fetch_assoc()) {
        $seatStats[] = [
            'seat_category' => $row['seat_category'],
            'booking_count' => (int) $row['count'],
            'avg_price' => (float) $row['avg_price'],
        ];
    }

    $stmt2->close();

    $stmt3 = $conn->prepare('
        SELECT f.flight_no, COUNT(*) as booking_count
        FROM bookings b
        INNER JOIN flights f ON f.flight_id = b.flight_id
        WHERE b.created_at BETWEEN ? AND ?
        GROUP BY b.flight_id
        ORDER BY booking_count DESC
        LIMIT 10
    ');

    if (!$stmt3) {
        throw new RuntimeException('Database error while fetching top flights');
    }

    $stmt3->bind_param('ss', $startDateTime, $endDateTime);
    $stmt3->execute();
    $result3 = $stmt3->get_result();
    $topFlights = [];

    while ($row = $result3->fetch_assoc()) {
        $topFlights[] = [
            'flight_no' => $row['flight_no'],
            'booking_count' => (int) $row['booking_count'],
        ];
    }

    $stmt3->close();

    success_response('Booking statistics generated', [
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ],
        'summary' => [
            'total_bookings' => (int) $data['total_bookings'],
            'active_bookings' => (int) $data['active_bookings'],
            'cancelled_bookings' => (int) $data['cancelled_bookings'],
            'paid_bookings' => (int) $data['paid_bookings'],
            'pending_bookings' => (int) $data['pending_bookings'],
            'refunded_bookings' => (int) $data['refunded_bookings'],
            'unique_flights' => (int) $data['unique_flights'],
            'payment_methods_used' => (int) $data['payment_methods_used'],
        ],
        'by_seat_category' => $seatStats,
        'top_flights' => $topFlights,
    ]);
} catch (Throwable $exception) {
    error_response('Failed to generate booking statistics', 500, [
        'error' => $exception->getMessage(),
    ]);
}
