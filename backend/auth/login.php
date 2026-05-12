<?php

declare(strict_types=1);

header('Content-Type: application/json');
http_response_code(501);
echo json_encode([
    'success' => false,
    'message' => 'Not implemented yet. Scheduled for Phase 2.'
]);
