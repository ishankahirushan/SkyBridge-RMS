<?php

function json_response(string $status, string $message, array $data = [], int $httpCode = 200): void
{
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');

    $payload = [
        'status' => $status,
        'message' => $message,
    ];

    if (!empty($data)) {
        $payload = array_merge($payload, $data);
    }

    echo json_encode($payload);
    exit;
}

function success_response(string $message, array $data = [], int $httpCode = 200): void
{
    json_response('success', $message, $data, $httpCode);
}

function error_response(string $message, int $httpCode = 400, array $data = []): void
{
    json_response('error', $message, $data, $httpCode);
}
