<?php

require_once __DIR__ . '/../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_response('Method not allowed', 405);
}

$user = current_user();

if ($user !== null) {
    audit_log(
        $conn,
        (int) $user['agent_id'],
        'logout',
        'agents',
        (string) $user['agent_id'],
        'User logged out'
    );
}

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
}

session_destroy();

success_response('Logout successful');
