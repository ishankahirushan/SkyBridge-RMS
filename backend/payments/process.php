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
    if (empty($body['booking_ref']) || empty($body['payment_method'])) {
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Missing required fields: booking_ref, payment_method'
        ]);
        exit;
    }
    
    $booking_ref = $body['booking_ref'];
    $payment_method = strtoupper($body['payment_method']);
    $agent_id = $_SESSION['user_id'];
    
    // Validate payment method
    if (!in_array($payment_method, ['CASH', 'CARD'])) {
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Invalid payment method. Must be CASH or CARD.'
        ]);
        exit;
    }
    
    // Start transaction
    $db->beginTransaction();
    
    // Get booking details
    $stmt = $db->prepare('
        SELECT b.booking_ref, b.final_price, b.payment_status, b.booking_status, b.agent_id, 
               p.passenger_id, p.passport_no
        FROM bookings b
        JOIN passengers p ON b.passenger_id = p.passenger_id
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
    
    // Check if already paid
    if ($booking['payment_status'] === 'SUCCESS') {
        $db->rollBack();
        http_response_code(400);
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Payment already processed for this booking'
        ]);
        exit;
    }
    
    $amount = (float) $booking['final_price'];
    $transaction_status = 'FAILED';
    $error_message = null;
    
    if ($payment_method === 'CASH') {
        // CASH Payment: Mark as success and increase agency balance
        
        // Get or create agency account
        $stmt = $db->prepare('
            SELECT account_id, current_balance
            FROM payment_accounts
            WHERE owner_type = "AGENCY" AND owner_name = "SkyBridge Agency"
        ');
        $stmt->execute();
        $agency_account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$agency_account) {
            // Create agency account if doesn't exist
            $stmt = $db->prepare('
                INSERT INTO payment_accounts (owner_type, owner_name, current_balance)
                VALUES ("AGENCY", "SkyBridge Agency", :amount)
            ');
            $stmt->execute([':amount' => $amount]);
            $transaction_status = 'SUCCESS';
        } else {
            // Update agency account balance
            $new_balance = $agency_account['current_balance'] + $amount;
            $stmt = $db->prepare('
                UPDATE payment_accounts
                SET current_balance = :balance
                WHERE account_id = :account_id
            ');
            $stmt->execute([
                ':balance' => $new_balance,
                ':account_id' => $agency_account['account_id']
            ]);
            $transaction_status = 'SUCCESS';
        }
    } 
    else if ($payment_method === 'CARD') {
        // CARD Payment: Check passenger balance, deduct from passenger, add to agency
        
        if (empty($body['card_no']) && empty($body['account_no'])) {
            $db->rollBack();
            http_response_code(400);
            sendJsonResponse([
                'status' => 'error',
                'message' => 'Card payment requires card_no or account_no'
            ]);
            exit;
        }
        
        $card_no = $body['card_no'] ?? null;
        $account_no = $body['account_no'] ?? null;
        
        // Get passenger account
        $query = 'SELECT account_id, current_balance FROM payment_accounts WHERE owner_type = "PASSENGER" AND owner_name = ? AND status = "ACTIVE"';
        if ($card_no) {
            $query .= ' AND card_no = ?';
            $stmt = $db->prepare($query);
            $stmt->execute([$booking['passport_no'], $card_no]);
        } else {
            $query .= ' AND account_no = ?';
            $stmt = $db->prepare($query);
            $stmt->execute([$booking['passport_no'], $account_no]);
        }
        
        $passenger_account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$passenger_account) {
            $db->rollBack();
            http_response_code(400);
            sendJsonResponse([
                'status' => 'error',
                'message' => 'Passenger account not found or inactive'
            ]);
            exit;
        }
        
        // Check if sufficient balance
        if ($passenger_account['current_balance'] < $amount) {
            $db->rollBack();
            http_response_code(400);
            sendJsonResponse([
                'status' => 'error',
                'message' => 'Insufficient balance. Required: ' . number_format($amount, 2) . ', Available: ' . number_format($passenger_account['current_balance'], 2)
            ]);
            exit;
        }
        
        // Get or create agency account
        $stmt = $db->prepare('
            SELECT account_id, current_balance
            FROM payment_accounts
            WHERE owner_type = "AGENCY" AND owner_name = "SkyBridge Agency"
        ');
        $stmt->execute();
        $agency_account = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Deduct from passenger
        $new_passenger_balance = $passenger_account['current_balance'] - $amount;
        $stmt = $db->prepare('
            UPDATE payment_accounts
            SET current_balance = :balance
            WHERE account_id = :account_id
        ');
        $stmt->execute([
            ':balance' => $new_passenger_balance,
            ':account_id' => $passenger_account['account_id']
        ]);
        
        // Add to agency
        if (!$agency_account) {
            $stmt = $db->prepare('
                INSERT INTO payment_accounts (owner_type, owner_name, current_balance)
                VALUES ("AGENCY", "SkyBridge Agency", :amount)
            ');
            $stmt->execute([':amount' => $amount]);
        } else {
            $new_agency_balance = $agency_account['current_balance'] + $amount;
            $stmt = $db->prepare('
                UPDATE payment_accounts
                SET current_balance = :balance
                WHERE account_id = :account_id
            ');
            $stmt->execute([
                ':balance' => $new_agency_balance,
                ':account_id' => $agency_account['account_id']
            ]);
        }
        
        $transaction_status = 'SUCCESS';
    }
    
    // Record transaction
    $stmt = $db->prepare('
        INSERT INTO transactions (booking_ref, payment_method, amount, transaction_status, transaction_date)
        VALUES (:booking_ref, :payment_method, :amount, :status, NOW())
    ');
    $stmt->execute([
        ':booking_ref' => $booking_ref,
        ':payment_method' => $payment_method,
        ':amount' => $amount,
        ':status' => $transaction_status
    ]);
    
    // Update booking payment status
    if ($transaction_status === 'SUCCESS') {
        $stmt = $db->prepare('
            UPDATE bookings
            SET payment_status = "SUCCESS", booking_status = "CONFIRMED"
            WHERE booking_ref = :booking_ref
        ');
        $stmt->execute([':booking_ref' => $booking_ref]);
    }
    
    // Commit transaction
    $db->commit();
    
    // Return success response
    sendJsonResponse([
        'status' => 'success',
        'message' => 'Payment processed successfully',
        'booking_ref' => $booking_ref,
        'payment_method' => $payment_method,
        'amount' => number_format($amount, 2),
        'transaction_status' => $transaction_status,
        'booking_status' => 'CONFIRMED'
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
