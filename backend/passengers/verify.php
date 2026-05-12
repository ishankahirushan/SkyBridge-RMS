<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAgent();

$payload = getJsonBody();
$passportNo = strtoupper(trim((string)($payload['passport_no'] ?? '')));

if ($passportNo === '') {
    sendJsonResponse([
        'success' => false,
        'message' => 'Passport number is required.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();

    $passengerStmt = $pdo->prepare(
        'SELECT passenger_id, passport_no, given_names, surname, email, contact_no FROM passengers WHERE passport_no = :passport_no LIMIT 1'
    );
    $passengerStmt->execute(['passport_no' => $passportNo]);
    $passenger = $passengerStmt->fetch();

    $verifyStmt = $pdo->prepare(
        'SELECT passport_no, expiry_date, status FROM passport_verification WHERE passport_no = :passport_no LIMIT 1'
    );
    $verifyStmt->execute(['passport_no' => $passportNo]);
    $verification = $verifyStmt->fetch();

    if (!$verification) {
        sendJsonResponse([
            'success' => true,
            'verified' => false,
            'verification' => null,
            'passenger' => $passenger ?: null,
            'message' => 'No passport verification record found.'
        ]);
    }

    $status = (string)$verification['status'];
    $expiryDate = (string)$verification['expiry_date'];

    if ($status === 'VALID' && strtotime($expiryDate) < strtotime(date('Y-m-d'))) {
        $status = 'EXPIRED';
    }

    sendJsonResponse([
        'success' => true,
        'verified' => $status === 'VALID',
        'verification' => [
            'passport_no' => $passportNo,
            'expiry_date' => $expiryDate,
            'status' => $status
        ],
        'passenger' => $passenger ?: null
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to verify passport.'
    ], 500);
}
