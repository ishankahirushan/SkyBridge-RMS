<?php
require_once __DIR__ . '/backend/config/db.php';
\ = \->query('SELECT agent_id, full_name, role FROM agents WHERE status = \"active\" LIMIT 5');
\ = [];
while (\ = \->fetch_assoc()) {
    \[] = \;
}
echo json_encode(\, JSON_PRETTY_PRINT);
?>
