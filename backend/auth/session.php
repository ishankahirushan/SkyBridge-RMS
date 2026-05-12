<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/utils/auth.php';

requireRequestMethod('GET');

$user = getSessionUser();

if ($user === null) {
    sendJsonResponse([
        'success' => true,
        'loggedIn' => false,
        'user' => null
    ]);
}

sendJsonResponse([
    'success' => true,
    'loggedIn' => true,
    'user' => $user
]);
