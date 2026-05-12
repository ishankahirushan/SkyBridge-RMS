<?php

require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

$airlineId = (int) ($_POST['airline_id'] ?? 0);
$airlineName = trim($_POST['airline_name'] ?? '');
$country = trim($_POST['country'] ?? '');
$status = trim($_POST['status'] ?? '');

if ($airlineId === 0) {
    error_response('Airline ID is required', 422);
}

if ($airlineName === '') {
    error_response('Airline name is required', 422);
}

if ($country === '') {
    error_response('Country is required', 422);
}

if ($status !== '' && !in_array($status, ['active', 'inactive'])) {
    error_response('Status must be either "active" or "inactive"', 422);
}

try {
    $conn->begin_transaction();

    $stmt = $conn->prepare('
        SELECT airline_id FROM airlines WHERE airline_id = ? LIMIT 1
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while fetching airline');
    }

    $stmt->bind_param('i', $airlineId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        error_response('Airline not found', 404);
    }

    $stmt->close();

    $updateStmt = $conn->prepare('
        UPDATE airlines SET airline_name = ?, country = ?, status = ?
        WHERE airline_id = ?
    ');

    if (!$updateStmt) {
        throw new RuntimeException('Database error while updating airline');
    }

    $updateStmt->bind_param('sssi', $airlineName, $country, $status, $airlineId);
    $updateStmt->execute();
    $updateStmt->close();

    $agentId = (int) (current_user()['agent_id'] ?? 0);
    audit_log(
        $conn,
        $agentId,
        'airline_updated',
        'airlines',
        (string) $airlineId,
        'Airline updated: ' . $airlineName
    );

    $conn->commit();

    success_response('Airline updated', [
        'airline_id' => $airlineId,
        'airline_name' => $airlineName,
    ]);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Airline update failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
