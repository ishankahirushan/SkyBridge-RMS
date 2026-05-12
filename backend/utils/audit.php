<?php

function audit_log(mysqli $conn, ?int $userId, string $actionType, ?string $tableName = null, ?string $recordId = null, ?string $description = null): bool
{
    $sql = "INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param(
        'issss',
        $userId,
        $actionType,
        $tableName,
        $recordId,
        $description
    );

    $result = $stmt->execute();
    $stmt->close();

    return $result;
}
