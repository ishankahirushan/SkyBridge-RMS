<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    error_response('Email and password are required', 422);
}

try {
    $user = authenticate_agent($conn, $email, $password);

    $_SESSION['user'] = [
        'agent_id' => (int) $user['agent_id'],
        'full_name' => $user['full_name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ];

    audit_log(
        $conn,
        (int) $user['agent_id'],
        'login',
        'agents',
        (string) $user['agent_id'],
        'User logged in successfully'
    );

    success_response('Login successful', [
        'user' => $_SESSION['user'],
    ]);
} catch (Throwable $exception) {
    error_response('Login failed', 500, [
        'error' => $exception->getMessage(),
    ]);
}
