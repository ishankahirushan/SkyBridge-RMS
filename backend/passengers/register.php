<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('POST');
requireAgent();

$payload = getJsonBody();
$passportNo = strtoupper(trim((string)($payload['passport_no'] ?? '')));
$givenNames = trim((string)($payload['given_names'] ?? ''));
$surname = trim((string)($payload['surname'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$contactNo = trim((string)($payload['contact_no'] ?? ''));

if ($passportNo === '' || $givenNames === '' || $surname === '') {
    sendJsonResponse([
        'success' => false,
        'message' => 'Passport number, given names, and surname are required.'
    ], 400);
}

try {
    $pdo = getDatabaseConnection();

    $find = $pdo->prepare('SELECT passenger_id FROM passengers WHERE passport_no = :passport_no LIMIT 1');
    $find->execute(['passport_no' => $passportNo]);
    $existing = $find->fetch();

    if ($existing) {
        $update = $pdo->prepare(
            'UPDATE passengers SET given_names = :given_names, surname = :surname, email = :email, contact_no = :contact_no WHERE passenger_id = :passenger_id'
        );
        $update->execute([
            'given_names' => $givenNames,
            'surname' => $surname,
            'email' => $email !== '' ? $email : null,
            'contact_no' => $contactNo !== '' ? $contactNo : null,
            'passenger_id' => $existing['passenger_id']
        ]);

        $passengerId = (int)$existing['passenger_id'];
    } else {
        $insert = $pdo->prepare(
            'INSERT INTO passengers (passport_no, given_names, surname, email, contact_no) VALUES (:passport_no, :given_names, :surname, :email, :contact_no)'
        );
        $insert->execute([
            'passport_no' => $passportNo,
            'given_names' => $givenNames,
            'surname' => $surname,
            'email' => $email !== '' ? $email : null,
            'contact_no' => $contactNo !== '' ? $contactNo : null,
        ]);

        $passengerId = (int)$pdo->lastInsertId();
    }

    sendJsonResponse([
        'success' => true,
        'message' => 'Passenger saved successfully.',
        'passenger_id' => $passengerId
    ]);
} catch (Throwable $exception) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Failed to register passenger.'
    ], 500);
}
