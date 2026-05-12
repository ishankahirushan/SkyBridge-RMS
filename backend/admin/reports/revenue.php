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
            COUNT(*) as total_transactions,
            SUM(CASE WHEN t.transaction_status = "paid" THEN 1 ELSE 0 END) as successful_transactions,
            SUM(CASE WHEN t.transaction_status = "refunded" THEN 1 ELSE 0 END) as refunded_transactions,
            SUM(CASE WHEN t.transaction_status = "paid" THEN t.amount ELSE 0 END) as total_revenue,
            AVG(CASE WHEN t.transaction_status = "paid" THEN t.amount ELSE NULL END) as avg_transaction_value,
            COUNT(DISTINCT p.payment_method) as payment_methods
        FROM transactions t
        INNER JOIN bookings b ON b.booking_ref = t.booking_ref
        INNER JOIN passengers p ON p.passenger_id = b.passenger_id
        WHERE t.created_at BETWEEN ? AND ?
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while fetching revenue data');
    }

    $stmt->bind_param('ss', $startDateTime, $endDateTime);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();
    $stmt->close();

    $stmt2 = $conn->prepare('
        SELECT p.payment_method, COUNT(*) as count, SUM(t.amount) as total
        FROM transactions t
        INNER JOIN bookings b ON b.booking_ref = t.booking_ref
        INNER JOIN passengers p ON p.passenger_id = b.passenger_id
        WHERE t.created_at BETWEEN ? AND ? AND t.transaction_status = "paid"
        GROUP BY p.payment_method
    ');

    if (!$stmt2) {
        throw new RuntimeException('Database error while fetching payment method breakdown');
    }

    $stmt2->bind_param('ss', $startDateTime, $endDateTime);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    $paymentBreakdown = [];

    while ($row = $result2->fetch_assoc()) {
        $paymentBreakdown[] = [
            'payment_method' => $row['payment_method'],
            'transaction_count' => (int) $row['count'],
            'total_amount' => (float) $row['total'],
        ];
    }

    $stmt2->close();

    success_response('Revenue report generated', [
        'period' => [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ],
        'summary' => [
            'total_transactions' => (int) $data['total_transactions'],
            'successful_transactions' => (int) $data['successful_transactions'],
            'refunded_transactions' => (int) $data['refunded_transactions'],
            'total_revenue' => $data['total_revenue'] ? (float) $data['total_revenue'] : 0,
            'avg_transaction_value' => $data['avg_transaction_value'] ? (float) $data['avg_transaction_value'] : 0,
        ],
        'payment_breakdown' => $paymentBreakdown,
    ]);
} catch (Throwable $exception) {
    error_response('Failed to generate revenue report', 500, [
        'error' => $exception->getMessage(),
    ]);
}
