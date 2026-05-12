<?php

require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

$agentId = (int) ($_POST['agent_id'] ?? 0);
$fullName = trim($_POST['full_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$role = trim($_POST['role'] ?? '');

if ($agentId === 0) {
    error_response('Agent ID is required', 422);
}

if ($fullName === '') {
    error_response('Full name is required', 422);
}

if ($email === '') {
    error_response('Email is required', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_response('Invalid email format', 422);
}

if ($role === '' || !in_array($role, ['admin', 'agent'])) {
    error_response('Role must be either "admin" or "agent"', 422);
}

try {
    $conn->begin_transaction();

    $stmt = $conn->prepare('SELECT agent_id FROM agents WHERE agent_id = ? LIMIT 1');
    if (!$stmt) {
        throw new RuntimeException('Database error while fetching agent');
    }

    $stmt->bind_param('i', $agentId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        error_response('Agent not found', 404);
    }

    $stmt->close();

    $checkStmt = $conn->prepare('SELECT agent_id FROM agents WHERE email = ? AND agent_id != ? LIMIT 1');
    if (!$checkStmt) {
        throw new RuntimeException('Database error while checking email');
    }

    $checkStmt->bind_param('si', $email, $agentId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        throw new RuntimeException('Email already in use by another agent');
    }

    $checkStmt->close();

    $updateStmt = $conn->prepare('
        UPDATE agents SET full_name = ?, email = ?, role = ?
        WHERE agent_id = ?
    ');

    if (!$updateStmt) {
        throw new RuntimeException('Database error while updating agent');
    }

    $updateStmt->bind_param('sssi', $fullName, $email, $role, $agentId);
    $updateStmt->execute();
    $updateStmt->close();

    $adminId = (int) (current_user()['agent_id'] ?? 0);
    audit_log(
        $conn,
        $adminId,
        'agent_updated',
        'agents',
        (string) $agentId,
        'Agent updated: ' . $fullName . ' with role ' . $role
    );

    $conn->commit();

    success_response('Agent updated', [
        'agent_id' => $agentId,
        'full_name' => $fullName,
        'email' => $email,
        'role' => $role,
    ]);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Agent update failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
