<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

$user = require_auth(['admin', 'agent']);
$agentId = (int) ($user['agent_id'] ?? 0);
$isAdmin = ($user['role'] ?? '') === 'admin';

try {
    $scopeClause = $isAdmin ? '' : ' WHERE b.agent_id = ? ';
    $scopeType = $isAdmin ? '' : 'i';

    // Total bookings
    $bookingsSql = 'SELECT COUNT(*) AS total_bookings FROM bookings b' . $scopeClause;
    $bookingsStmt = $conn->prepare($bookingsSql);
    if (!$bookingsStmt) {
        throw new RuntimeException('Database error while fetching bookings count');
    }
    if (!$isAdmin) {
        $bookingsStmt->bind_param($scopeType, $agentId);
    }
    $bookingsStmt->execute();
    $bookingsResult = $bookingsStmt->get_result()->fetch_assoc();
    $bookingsStmt->close();

    // Today's revenue
    $revenueSql = '
        SELECT COALESCE(SUM(t.amount), 0) AS today_revenue
        FROM transactions t
        INNER JOIN bookings b ON b.booking_ref = t.booking_ref
        WHERE DATE(t.created_at) = CURDATE()
          AND t.transaction_status IN ("completed", "paid")
    ' . (!$isAdmin ? ' AND b.agent_id = ? ' : '');
    $revenueStmt = $conn->prepare($revenueSql);
    if (!$revenueStmt) {
        throw new RuntimeException('Database error while fetching today revenue');
    }
    if (!$isAdmin) {
        $revenueStmt->bind_param('i', $agentId);
    }
    $revenueStmt->execute();
    $revenueResult = $revenueStmt->get_result()->fetch_assoc();
    $revenueStmt->close();

    // Refund count
    $refundSql = '
        SELECT COUNT(*) AS refund_count
        FROM bookings b
        WHERE b.payment_status = "refunded"
    ' . (!$isAdmin ? ' AND b.agent_id = ? ' : '');
    $refundStmt = $conn->prepare($refundSql);
    if (!$refundStmt) {
        throw new RuntimeException('Database error while fetching refund count');
    }
    if (!$isAdmin) {
        $refundStmt->bind_param('i', $agentId);
    }
    $refundStmt->execute();
    $refundResult = $refundStmt->get_result()->fetch_assoc();
    $refundStmt->close();

    // Active flights with available seats
    $activeFlightsSql = '
        SELECT COUNT(DISTINCT f.flight_id) AS active_flights
        FROM flights f
        INNER JOIN flight_seat_categories fsc ON fsc.flight_id = f.flight_id
        WHERE fsc.available_seats > 0
    ';
    $activeFlightsStmt = $conn->prepare($activeFlightsSql);
    if (!$activeFlightsStmt) {
        throw new RuntimeException('Database error while fetching active flights');
    }
    $activeFlightsStmt->execute();
    $activeFlightsResult = $activeFlightsStmt->get_result()->fetch_assoc();
    $activeFlightsStmt->close();

    // Recent transactions
    $recentSql = '
        SELECT
            t.transaction_id,
            t.booking_ref,
            t.payment_method,
            t.amount,
            t.transaction_status,
            t.created_at,
            p.full_name AS passenger_name,
            f.flight_no
        FROM transactions t
        INNER JOIN bookings b ON b.booking_ref = t.booking_ref
        INNER JOIN passengers p ON p.passenger_id = b.passenger_id
        INNER JOIN flights f ON f.flight_id = b.flight_id
        ' . (!$isAdmin ? ' WHERE b.agent_id = ? ' : '') . '
        ORDER BY t.created_at DESC
        LIMIT 10
    ';
    $recentStmt = $conn->prepare($recentSql);
    if (!$recentStmt) {
        throw new RuntimeException('Database error while fetching recent transactions');
    }
    if (!$isAdmin) {
        $recentStmt->bind_param('i', $agentId);
    }
    $recentStmt->execute();
    $recentResult = $recentStmt->get_result();
    $recentTransactions = [];

    while ($row = $recentResult->fetch_assoc()) {
        $recentTransactions[] = [
            'transaction_id' => (int) $row['transaction_id'],
            'booking_ref' => $row['booking_ref'],
            'passenger_name' => $row['passenger_name'],
            'flight_no' => $row['flight_no'],
            'payment_method' => $row['payment_method'],
            'amount' => (float) $row['amount'],
            'transaction_status' => $row['transaction_status'],
            'created_at' => $row['created_at'],
        ];
    }
    $recentStmt->close();

    // Booking status summary for chart
    $bookingStatusSql = '
        SELECT b.booking_status, COUNT(*) AS count
        FROM bookings b
        ' . (!$isAdmin ? ' WHERE b.agent_id = ? ' : '') . '
        GROUP BY b.booking_status
    ';
    $bookingStatusStmt = $conn->prepare($bookingStatusSql);
    if (!$bookingStatusStmt) {
        throw new RuntimeException('Database error while fetching booking status summary');
    }
    if (!$isAdmin) {
        $bookingStatusStmt->bind_param('i', $agentId);
    }
    $bookingStatusStmt->execute();
    $bookingStatusResult = $bookingStatusStmt->get_result();
    $bookingStatus = [];
    while ($row = $bookingStatusResult->fetch_assoc()) {
        $bookingStatus[] = [
            'status' => $row['booking_status'],
            'count' => (int) $row['count'],
        ];
    }
    $bookingStatusStmt->close();

    // Top routes summary for bar chart
    $routeSql = '
        SELECT
            f.departure_airport,
            f.destination_airport,
            COUNT(*) AS booking_count
        FROM bookings b
        INNER JOIN flights f ON f.flight_id = b.flight_id
        ' . (!$isAdmin ? ' WHERE b.agent_id = ? ' : '') . '
        GROUP BY f.departure_airport, f.destination_airport
        ORDER BY booking_count DESC
        LIMIT 5
    ';
    $routeStmt = $conn->prepare($routeSql);
    if (!$routeStmt) {
        throw new RuntimeException('Database error while fetching top routes');
    }
    if (!$isAdmin) {
        $routeStmt->bind_param('i', $agentId);
    }
    $routeStmt->execute();
    $routeResult = $routeStmt->get_result();
    $topRoutes = [];
    while ($row = $routeResult->fetch_assoc()) {
        $topRoutes[] = [
            'route' => $row['departure_airport'] . ' - ' . $row['destination_airport'],
            'booking_count' => (int) $row['booking_count'],
        ];
    }
    $routeStmt->close();

    success_response('Dashboard stats retrieved', [
        'data' => [
            'totals' => [
                'total_bookings' => (int) ($bookingsResult['total_bookings'] ?? 0),
                'today_revenue' => (float) ($revenueResult['today_revenue'] ?? 0),
                'refund_count' => (int) ($refundResult['refund_count'] ?? 0),
                'active_flights' => (int) ($activeFlightsResult['active_flights'] ?? 0),
            ],
            'recent_transactions' => $recentTransactions,
            'operational_summaries' => [
                'booking_status' => $bookingStatus,
                'top_routes' => $topRoutes,
            ],
        ],
    ]);
} catch (Throwable $exception) {
    error_response('Failed to load dashboard stats', 500, [
        'error' => $exception->getMessage(),
    ]);
}
