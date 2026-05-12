<?php

require_once __DIR__ . '/../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

try {
    $stmt = $conn->prepare('
        SELECT agent_id, full_name, email, role, status
        FROM agents
        ORDER BY full_name ASC
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while preparing query');
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $agents = [];

    while ($row = $result->fetch_assoc()) {
        $agents[] = [
            'agent_id' => (int) $row['agent_id'],
            'full_name' => $row['full_name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'status' => $row['status'],
        ];
    }

    $stmt->close();

    success_response('Agents retrieved', ['agents' => $agents]);
} catch (Throwable $exception) {
    error_response('Failed to retrieve agents', 500, [
        'error' => $exception->getMessage(),
    ]);
}
