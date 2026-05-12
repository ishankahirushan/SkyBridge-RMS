<?php

require_once __DIR__ . '/../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

try {
    $stmt = $conn->prepare('
        SELECT airline_id, airline_name, airline_code, country, status
        FROM airlines
        ORDER BY airline_name ASC
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while preparing query');
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $airlines = [];

    while ($row = $result->fetch_assoc()) {
        $airlines[] = [
            'airline_id' => (int) $row['airline_id'],
            'airline_name' => $row['airline_name'],
            'airline_code' => $row['airline_code'],
            'country' => $row['country'],
            'status' => $row['status'],
        ];
    }

    $stmt->close();

    success_response('Airlines retrieved', ['airlines' => $airlines]);
} catch (Throwable $exception) {
    error_response('Failed to retrieve airlines', 500, [
        'error' => $exception->getMessage(),
    ]);
}
