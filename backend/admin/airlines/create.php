<?php

require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

$airlineName = trim($_POST['airline_name'] ?? '');
$airlineCode = trim($_POST['airline_code'] ?? '');
$country = trim($_POST['country'] ?? '');

if ($airlineName === '') {
    error_response('Airline name is required', 422);
}

if ($airlineCode === '') {
    error_response('Airline code is required', 422);
}

if ($country === '') {
    error_response('Country is required', 422);
}

try {
    $conn->begin_transaction();

    $checkStmt = $conn->prepare('SELECT airline_id FROM airlines WHERE airline_code = ? LIMIT 1');
    if (!$checkStmt) {
        throw new RuntimeException('Database error while checking airline code');
    }

    $checkStmt->bind_param('s', $airlineCode);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        throw new RuntimeException('Airline code already exists');
    }

    $checkStmt->close();

    $stmt = $conn->prepare('
        INSERT INTO airlines (airline_name, airline_code, country)
        VALUES (?, ?, ?)
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while creating airline');
    }

    $stmt->bind_param('sss', $airlineName, $airlineCode, $country);
    $stmt->execute();
    $airlineId = $conn->insert_id;
    $stmt->close();

    $agentId = (int) (current_user()['agent_id'] ?? 0);
    audit_log(
        $conn,
        $agentId,
        'airline_created',
        'airlines',
        (string) $airlineId,
        'Airline created: ' . $airlineName . ' (' . $airlineCode . ')'
    );

    $conn->commit();

    success_response('Airline created', [
        'airline_id' => $airlineId,
        'airline_name' => $airlineName,
        'airline_code' => $airlineCode,
    ], 201);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Airline creation failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
