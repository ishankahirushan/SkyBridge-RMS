-- SkyBridge RMS Database Schema
-- Airline Ticket Agency Management System

CREATE DATABASE IF NOT EXISTS skybridge_rms;
USE skybridge_rms;

-- Disable foreign key checks during table creation
SET FOREIGN_KEY_CHECKS=0;

-- ============================================================================
-- COMPANY TABLES (with audit fields)
-- ============================================================================

-- Agency Information
CREATE TABLE IF NOT EXISTS agency (
    agency_id INT PRIMARY KEY AUTO_INCREMENT,
    agency_name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    service_charge DECIMAL(10, 2) DEFAULT 0,
    account_number VARCHAR(50),
    address TEXT,
    logo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Agents/Staff
CREATE TABLE IF NOT EXISTS agents (
    agent_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent') DEFAULT 'agent',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Successfully Paid Passengers
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_ref VARCHAR(50) UNIQUE NOT NULL,
    passport_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    contact_no VARCHAR(20),
    email VARCHAR(100),
    payment_method ENUM('cash', 'card') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    UNIQUE KEY unique_booking_ref (booking_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Successful Reservations/Bookings
CREATE TABLE IF NOT EXISTS bookings (
    booking_ref VARCHAR(50) PRIMARY KEY,
    passenger_id INT NOT NULL,
    flight_id INT NOT NULL,
    seat_category VARCHAR(50) NOT NULL,
    agent_id INT NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    service_charge DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('active', 'cancelled') DEFAULT 'active',
    payment_status ENUM('paid', 'pending', 'refunded') DEFAULT 'paid',
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id),
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment Transactions
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_ref VARCHAR(50) NOT NULL,
    payment_method ENUM('cash', 'card') NOT NULL,
    card_no VARCHAR(20) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_status ENUM('completed', 'pending', 'failed', 'refunded') DEFAULT 'completed',
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (booking_ref) REFERENCES bookings(booking_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Supported Airlines (Agency-controlled)
CREATE TABLE IF NOT EXISTS our_airlines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    airline_id INT NOT NULL,
    status ENUM('enabled', 'disabled') DEFAULT 'enabled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES agents(agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- AIRLINE TABLES (no audit fields - simulated external system)
-- ============================================================================

-- Global Airline Registry
CREATE TABLE IF NOT EXISTS airlines (
    airline_id INT PRIMARY KEY AUTO_INCREMENT,
    airline_name VARCHAR(255) NOT NULL,
    airline_code VARCHAR(10) UNIQUE NOT NULL,
    country VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Global Flight Repository
CREATE TABLE IF NOT EXISTS flights (
    flight_id INT PRIMARY KEY AUTO_INCREMENT,
    airline_id INT NOT NULL,
    flight_no VARCHAR(20) UNIQUE NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    destination_airport VARCHAR(10) NOT NULL,
    departure_datetime DATETIME NOT NULL,
    arrival_datetime DATETIME NOT NULL,
    base_ticket_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (airline_id) REFERENCES airlines(airline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Flight Seat Categories and Availability
CREATE TABLE IF NOT EXISTS flight_seat_categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    flight_id INT NOT NULL,
    seat_category VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    price_multiplier DECIMAL(3, 2) NOT NULL,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    UNIQUE KEY unique_flight_category (flight_id, seat_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- BANKING SYSTEM TABLE (no audit fields - simulated external system)
-- ============================================================================

-- Simulated Bank Accounts
CREATE TABLE IF NOT EXISTS payment_accounts (
    account_id INT PRIMARY KEY AUTO_INCREMENT,
    owner_type ENUM('agency', 'passenger') NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    card_no VARCHAR(20) UNIQUE,
    account_no VARCHAR(50) UNIQUE,
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- GOVERNMENT SYSTEM TABLE (no audit fields - simulated external system)
-- ============================================================================

-- Passport Verification Database
CREATE TABLE IF NOT EXISTS passport_verification (
    verification_id INT PRIMARY KEY AUTO_INCREMENT,
    passport_no VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('VALID', 'EXPIRED', 'BLACKLISTED') DEFAULT 'VALID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_bookings_passenger ON bookings(passenger_id);
CREATE INDEX idx_bookings_flight ON bookings(flight_id);
CREATE INDEX idx_bookings_agent ON bookings(agent_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_transactions_booking ON transactions(booking_ref);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_flights_airline ON flights(airline_id);
CREATE INDEX idx_flights_airports ON flights(departure_airport, destination_airport);
CREATE INDEX idx_flights_datetime ON flights(departure_datetime);
CREATE INDEX idx_seat_categories_flight ON flight_seat_categories(flight_id);
CREATE INDEX idx_passengers_passport ON passengers(passport_no);
CREATE INDEX idx_agents_email ON agents(email);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert Agency Information
INSERT INTO agency (agency_name, whatsapp, email, service_charge, account_number, address) VALUES
('SkyBridge Travel Agency', '+94773456789', 'info@skybridge.lk', 500.00, 'ACC-001-2026', '123 Colombo Street, Colombo 3, Sri Lanka');

-- Insert Airlines
INSERT INTO airlines (airline_name, airline_code, country, status) VALUES
('SriLankan Airlines', 'UL', 'Sri Lanka', 'active'),
('Air Asia', 'AK', 'Malaysia', 'active'),
('Emirates', 'EK', 'UAE', 'active'),
('Qatar Airways', 'QR', 'Qatar', 'active'),
('Singapore Airlines', 'SQ', 'Singapore', 'active');

-- Insert Supported Airlines (Our Airlines)
INSERT INTO our_airlines (airline_id, status, created_by) VALUES
(1, 'enabled', 1),
(2, 'enabled', 1),
(3, 'enabled', 1);

-- Insert Agents/Staff
INSERT INTO agents (full_name, email, password, role, status, created_by) VALUES
('Admin User', 'admin@skybridge.lk', '$2y$12$fFudTWAKGl8hzIt/0/XEtueBAZuUmdDVaR6Cr3mMqBKNLf9hjKeDi', 'admin', 'active', 1),
('John Agent', 'john@skybridge.lk', '$2y$12$fFudTWAKGl8hzIt/0/XEtueBAZuUmdDVaR6Cr3mMqBKNLf9hjKeDi', 'agent', 'active', 1),
('Sarah Agent', 'sarah@skybridge.lk', '$2y$12$fFudTWAKGl8hzIt/0/XEtueBAZuUmdDVaR6Cr3mMqBKNLf9hjKeDi', 'agent', 'active', 1);

-- Insert Test Flights (SriLankan Airlines)
INSERT INTO flights (airline_id, flight_no, departure_airport, destination_airport, departure_datetime, arrival_datetime, base_ticket_price) VALUES
(1, 'UL101', 'CMB', 'DEL', '2026-05-15 08:00:00', '2026-05-15 11:30:00', 15000.00),
(1, 'UL102', 'CMB', 'SIN', '2026-05-16 10:00:00', '2026-05-16 16:00:00', 18000.00),
(1, 'UL103', 'CMB', 'DXB', '2026-05-17 14:00:00', '2026-05-17 18:30:00', 20000.00),
(2, 'AK201', 'CMB', 'KUL', '2026-05-15 12:00:00', '2026-05-15 18:00:00', 12000.00),
(3, 'EK301', 'CMB', 'DXB', '2026-05-16 16:00:00', '2026-05-16 20:30:00', 22000.00);

-- Insert Flight Seat Categories
INSERT INTO flight_seat_categories (flight_id, seat_category, total_seats, available_seats, price_multiplier) VALUES
(1, 'First Class', 8, 8, 2.50),
(1, 'Business Class', 20, 20, 1.80),
(1, 'Premium Economy', 30, 30, 1.30),
(1, 'Economy Class', 150, 150, 1.00),
(2, 'First Class', 8, 8, 2.50),
(2, 'Business Class', 20, 18, 1.80),
(2, 'Premium Economy', 30, 25, 1.30),
(2, 'Economy Class', 150, 120, 1.00),
(3, 'First Class', 8, 5, 2.50),
(3, 'Business Class', 20, 15, 1.80),
(3, 'Premium Economy', 30, 20, 1.30),
(3, 'Economy Class', 150, 80, 1.00),
(4, 'Business Class', 25, 25, 1.80),
(4, 'Economy Class', 180, 180, 1.00),
(5, 'First Class', 10, 10, 2.50),
(5, 'Business Class', 30, 30, 1.80),
(5, 'Premium Economy', 40, 40, 1.30),
(5, 'Economy Class', 200, 200, 1.00);

-- Insert Passport Verification Data (Test Passengers)
INSERT INTO passport_verification (passport_no, full_name, expiry_date, status) VALUES
('N1234567', 'Kamal Perera', '2027-12-31', 'VALID'),
('N1234568', 'Nimal Silva', '2026-08-15', 'VALID'),
('N1234569', 'Ravi Kumar', '2025-06-30', 'EXPIRED'),
('N1234570', 'Ahmed Hassan', '2024-12-31', 'BLACKLISTED'),
('N1234571', 'Priya Sharma', '2028-03-20', 'VALID'),
('N1234572', 'Deepak Reddy', '2027-09-10', 'VALID'),
('N1234573', 'Samantha Williams', '2026-11-05', 'VALID'),
('N1234574', 'James Taylor', '2027-04-18', 'VALID');

-- Insert Payment Accounts (Bank Accounts)
INSERT INTO payment_accounts (owner_type, owner_name, account_no, current_balance) VALUES
('agency', 'SkyBridge Travel Agency', 'ACC-001-2026', 500000.00);

-- Insert Test Passenger Card Accounts
INSERT INTO payment_accounts (owner_type, owner_name, card_no, current_balance) VALUES
('passenger', 'Kamal Perera', '4532123456789012', 100000.00),
('passenger', 'Nimal Silva', '4532123456789013', 75000.00),
('passenger', 'Priya Sharma', '4532123456789014', 150000.00),
('passenger', 'Deepak Reddy', '4532123456789015', 85000.00),
('passenger', 'Samantha Williams', '4532123456789016', 95000.00),
('passenger', 'James Taylor', '4532123456789017', 120000.00);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show table count
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'skybridge_rms';

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
