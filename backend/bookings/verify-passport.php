<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin', 'agent']);

$passportNo = trim($_POST['passport_no'] ?? '');

if ($passportNo === '') {
    error_response('Passport number is required', 422);
}

try {
    $sql = 'SELECT verification_id, passport_no, full_name, expiry_date, status FROM passport_verification WHERE passport_no = ? LIMIT 1';
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        error_response('Database error', 500);
    }

    $stmt->bind_param('s', $passportNo);
    $stmt->execute();
    $result = $stmt->get_result();
    $passport = $result->fetch_assoc();
    $stmt->close();

    if (!$passport) {
        audit_log($conn, current_user()['agent_id'] ?? null, 'passport_verification_failed', 'passport_verification', $passportNo, 'Passport number not found');
        error_response('Passport not found', 404);
    }

    $today = new DateTimeImmutable('today');
    $expiryDate = new DateTimeImmutable($passport['expiry_date']);

    if ($passport['status'] === 'BLACKLISTED') {
        audit_log($conn, current_user()['agent_id'] ?? null, 'passport_verification_failed', 'passport_verification', $passportNo, 'Passport blacklisted');
        error_response('Passport blacklisted', 403);
    }

    if ($passport['status'] === 'EXPIRED' || $expiryDate < $today) {
        audit_log($conn, current_user()['agent_id'] ?? null, 'passport_verification_failed', 'passport_verification', $passportNo, 'Passport expired');
        error_response('Passport expired', 403);
    }

    audit_log(
        $conn,
        current_user()['agent_id'] ?? null,
        'passport_verified',
        'passport_verification',
        $passportNo,
        'Passport verification successful'
    );

    success_response('Passport verified successfully', [
        'passport' => [
            'verification_id' => (int) $passport['verification_id'],
            'passport_no' => $passport['passport_no'],
            'full_name' => $passport['full_name'],
            'expiry_date' => $passport['expiry_date'],
            'status' => $passport['status'],
        ],
    ]);
} catch (Throwable $exception) {
    error_response('Passport verification failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}