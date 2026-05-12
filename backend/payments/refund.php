<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/auth.php';

// Check authentication and request method
requireLogin();
requireRequestMethod('POST');
requireAgent();

try {
    $db = getDatabaseConnection();
    $body = getJsonBody();
    
    // Validate required fields
    if (empty($body['booking_ref']) || empty($body['refund_type'])) {
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Missing required fields: booking_ref, refund_type'
        ]);
        exit;
    }
    
    $booking_ref = $body['booking_ref'];
    $refund_type = strtoupper($body['refund_type']);
    $agent_id = $_SESSION['user_id'];
    
    // Validate refund type
    if (!in_array($refund_type, ['ACCOUNT', 'CASH'])) {
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Invalid refund type. Must be ACCOUNT or CASH.'
        ]);
        exit;
    }
    
    // Start transaction
    $db->beginTransaction();
    
    // Get booking details
    $stmt = $db->prepare('
        SELECT b.booking_ref, b.final_price, b.payment_status, b.booking_status, b.agent_id,
               b.passenger_id, p.passport_no, t.payment_method
        FROM bookings b
        JOIN passengers p ON b.passenger_id = p.passenger_id
        LEFT JOIN transactions t ON b.booking_ref = t.booking_ref AND t.transaction_status = "SUCCESS"
        WHERE b.booking_ref = :booking_ref
    ');
    $stmt->execute([':booking_ref' => $booking_ref]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        $db->rollBack();
        http_response_code(404);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Booking not found'
        ]);
        exit;
    }
    
    // Check if booking belongs to this agent
    if ($booking['agent_id'] != $agent_id) {
        $db->rollBack();
        http_response_code(403);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Unauthorized: This booking belongs to another agent'
        ]);
        exit;
    }
    
    // Check if booking is paid
    if ($booking['payment_status'] !== 'SUCCESS') {
        $db->rollBack();
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Only paid bookings can be refunded'
        ]);
        exit;
    }
    
    // Check if already refunded
    if ($booking['booking_status'] === 'REFUNDED') {
        $db->rollBack();
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Booking has already been refunded'
        ]);
        exit;
    }
    
    $amount = (float) $booking['final_price'];
    
    // Get agency account
    $stmt = $db->prepare('
        SELECT account_id, current_balance
        FROM payment_accounts
        WHERE owner_type = "AGENCY" AND owner_name = "SkyBridge Agency"
    ');
    $stmt->execute();
    $agency_account = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$agency_account) {
        $db->rollBack();
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Agency account not found'
        ]);
        exit;
    }
    
    // Check if agency has sufficient balance
    if ($agency_account['current_balance'] < $amount) {
        $db->rollBack();
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Insufficient agency balance for refund. Required: ' . number_format($amount, 2) . ', Available: ' . number_format($agency_account['current_balance'], 2)
        ]);
        exit;
    }
    
    // Deduct from agency
    $new_agency_balance = $agency_account['current_balance'] - $amount;
    $stmt = $db->prepare('
        UPDATE payment_accounts
        SET current_balance = :balance
        WHERE account_id = :account_id
    ');
    $stmt->execute([
        ':balance' => $new_agency_balance,
        ':account_id' => $agency_account['account_id']
    ]);
    
    // If refund type is ACCOUNT, add to passenger account
    if ($refund_type === 'ACCOUNT') {
        $stmt = $db->prepare('
            SELECT account_id, current_balance
            FROM payment_accounts
            WHERE owner_type = "PASSENGER" AND owner_name = :passport_no AND status = "ACTIVE"
            LIMIT 1
        ');
        $stmt->execute([':passport_no' => $booking['passport_no']]);
        $passenger_account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($passenger_account) {
            $new_passenger_balance = $passenger_account['current_balance'] + $amount;
            $stmt = $db->prepare('
                UPDATE payment_accounts
                SET current_balance = :balance
                WHERE account_id = :account_id
            ');
            $stmt->execute([
                ':balance' => $new_passenger_balance,
                ':account_id' => $passenger_account['account_id']
            ]);
        } else {
            // Create new passenger account
            $stmt = $db->prepare('
                INSERT INTO payment_accounts (owner_type, owner_name, account_no, current_balance)
                VALUES ("PASSENGER", :passport_no, :account_no, :balance)
            ');
            $stmt->execute([
                ':passport_no' => $booking['passport_no'],
                ':account_no' => 'ACC-' . $booking['passport_no'] . '-' . time(),
                ':balance' => $amount
            ]);
        }
    }
    
    // Record refund transaction
    $stmt = $db->prepare('
        INSERT INTO transactions (booking_ref, payment_method, amount, transaction_status, transaction_date)
        VALUES (:booking_ref, :payment_method, :amount, "REFUND_SUCCESS", NOW())
    ');
    $stmt->execute([
        ':booking_ref' => $booking_ref,
        ':payment_method' => $booking['payment_method'] ?? 'CASH',
        ':amount' => $amount
    ]);
    
    // Update booking status to REFUNDED
    $stmt = $db->prepare('
        UPDATE bookings
        SET booking_status = "REFUNDED", payment_status = "REFUNDED"
        WHERE booking_ref = :booking_ref
    ');
    $stmt->execute([':booking_ref' => $booking_ref]);
    
    // Commit transaction
    $db->commit();
    
    // Return success response
    sendJsonResponse([
        'status' => 'success',
        'message' => 'Refund processed successfully',
        'booking_ref' => $booking_ref,
        'refund_type' => $refund_type,
        'amount' => number_format($amount, 2),
        'booking_status' => 'REFUNDED'
    ]);
    
} catch (PDOException $e) {
    if (isset($db)) {
        $db->rollBack();
    }
    http_response_code(500);
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
