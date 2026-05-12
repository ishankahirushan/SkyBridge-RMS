<?php
/**
 * Database Configuration
 * SkyBridge RMS - Airline Ticket Agency Management System
 */

// Database Credentials
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '1234');
define('DB_NAME', 'skybridge_rms');
define('DB_PORT', 3306);

// Connection Error Handling
try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database Connection Failed: " . $conn->connect_error);
    }
    
    // Set charset to UTF-8
    $conn->set_charset("utf8mb4");
    
    // Enable error reporting for development
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    
} catch (Exception $e) {
    http_response_code(500);
    die(json_encode([
        'status' => 'error',
        'message' => 'Database connection error',
        'error' => $e->getMessage()
    ]));
}

// Return connection object for use throughout the application
// Usage: require_once 'backend/config/db.php';
// Then use: $conn for database queries
