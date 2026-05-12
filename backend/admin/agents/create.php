<?php

require_once __DIR__ . '/../../utils/auth.php';
require_once __DIR__ . '/../../utils/audit.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

require_auth(['admin']);

$fullName = trim($_POST['full_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');
$role = trim($_POST['role'] ?? '');

if ($fullName === '') {
    error_response('Full name is required', 422);
}

if ($email === '') {
    error_response('Email is required', 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_response('Invalid email format', 422);
}

if ($password === '') {
    error_response('Password is required', 422);
}

if (strlen($password) < 6) {
    error_response('Password must be at least 6 characters', 422);
}

if ($role === '' || !in_array($role, ['admin', 'agent'])) {
    error_response('Role must be either "admin" or "agent"', 422);
}

try {
    $conn->begin_transaction();

    $checkStmt = $conn->prepare('SELECT agent_id FROM agents WHERE email = ? LIMIT 1');
    if (!$checkStmt) {
        throw new RuntimeException('Database error while checking email');
    }

    $checkStmt->bind_param('s', $email);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();

    if ($checkResult->num_rows > 0) {
        throw new RuntimeException('Email already registered');
    }

    $checkStmt->close();

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $conn->prepare('
        INSERT INTO agents (full_name, email, password, role)
        VALUES (?, ?, ?, ?)
    ');

    if (!$stmt) {
        throw new RuntimeException('Database error while creating agent');
    }

    $stmt->bind_param('ssss', $fullName, $email, $passwordHash, $role);
    $stmt->execute();
    $agentId = $conn->insert_id;
    $stmt->close();

    $adminId = (int) (current_user()['agent_id'] ?? 0);
    audit_log(
        $conn,
        $adminId,
        'agent_created',
        'agents',
        (string) $agentId,
        'Agent created: ' . $fullName . ' (' . $email . ') as ' . $role
    );

    $conn->commit();

    success_response('Agent created', [
        'agent_id' => $agentId,
        'full_name' => $fullName,
        'email' => $email,
        'role' => $role,
    ], 201);
} catch (Throwable $exception) {
    $conn->rollback();

    error_response('Agent creation failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
