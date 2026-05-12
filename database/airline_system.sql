CREATE DATABASE IF NOT EXISTS skybridge_rms;
USE skybridge_rms;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS passport_verification;
DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS payment_accounts;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS our_airlines;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS airlines;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE airlines (
    airline_id INT AUTO_INCREMENT PRIMARY KEY,
    airline_name VARCHAR(120) NOT NULL,
    airline_code VARCHAR(10) NOT NULL,
    country VARCHAR(80) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_airlines_code (airline_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE flights (
    flight_id INT AUTO_INCREMENT PRIMARY KEY,
    airline_id INT NOT NULL,
    flight_no VARCHAR(20) NOT NULL,
    departure_airport VARCHAR(10) NOT NULL,
    destination_airport VARCHAR(10) NOT NULL,
    departure_datetime DATETIME NOT NULL,
    arrival_datetime DATETIME NOT NULL,
    available_seats INT NOT NULL,
    base_ticket_price DECIMAL(10,2) NOT NULL,
    status ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_flights_airline FOREIGN KEY (airline_id) REFERENCES airlines(airline_id),
    CONSTRAINT chk_flights_seats CHECK (available_seats >= 0),
    CONSTRAINT chk_flights_price CHECK (base_ticket_price >= 0),
    CONSTRAINT chk_flights_time CHECK (arrival_datetime > departure_datetime),
    UNIQUE KEY uq_flights_no_departure (flight_no, departure_datetime),
    KEY idx_flights_route_date (departure_airport, destination_airport, departure_datetime),
    KEY idx_flights_airline (airline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE our_airlines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    airline_id INT NOT NULL,
    status ENUM('ENABLED', 'DISABLED') NOT NULL DEFAULT 'ENABLED',
    enabled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_our_airlines_airline FOREIGN KEY (airline_id) REFERENCES airlines(airline_id),
    UNIQUE KEY uq_our_airlines_airline (airline_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE agents (
    agent_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'AGENT') NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_agents_email (email),
    KEY idx_agents_role_status (role, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    passport_no VARCHAR(32) NOT NULL,
    given_names VARCHAR(120) NOT NULL,
    surname VARCHAR(120) NOT NULL,
    email VARCHAR(160) NULL,
    contact_no VARCHAR(30) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_passengers_passport (passport_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE passport_verification (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,
    passport_no VARCHAR(32) NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('VALID', 'EXPIRED', 'BLACKLISTED') NOT NULL,
    notes VARCHAR(255) NULL,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_passport_verification_passport (passport_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE bookings (
    booking_ref VARCHAR(24) PRIMARY KEY,
    passenger_id INT NOT NULL,
    flight_id INT NOT NULL,
    agent_id INT NOT NULL,
    seat_no VARCHAR(10) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_price DECIMAL(10,2) NOT NULL,
    booking_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_passenger FOREIGN KEY (passenger_id) REFERENCES passengers(passenger_id),
    CONSTRAINT fk_bookings_flight FOREIGN KEY (flight_id) REFERENCES flights(flight_id),
    CONSTRAINT fk_bookings_agent FOREIGN KEY (agent_id) REFERENCES agents(agent_id),
    CONSTRAINT chk_bookings_prices CHECK (
        base_price >= 0
        AND service_charge >= 0
        AND discount >= 0
        AND final_price = (base_price + service_charge - discount)
    ),
    UNIQUE KEY uq_bookings_flight_seat (flight_id, seat_no),
    KEY idx_bookings_status_date (booking_status, booking_date),
    KEY idx_bookings_payment_status (payment_status),
    KEY idx_bookings_agent (agent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE payment_accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    owner_type ENUM('PASSENGER', 'AGENCY') NOT NULL,
    owner_name VARCHAR(160) NOT NULL,
    card_no VARCHAR(32) NULL,
    account_no VARCHAR(32) NULL,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_accounts_balance CHECK (current_balance >= 0),
    UNIQUE KEY uq_payment_accounts_card_no (card_no),
    UNIQUE KEY uq_payment_accounts_account_no (account_no),
    KEY idx_payment_accounts_owner (owner_type, owner_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(24) NOT NULL,
    payment_method ENUM('CASH', 'CARD') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_status ENUM('SUCCESS', 'FAILED', 'REFUND_SUCCESS', 'REFUND_FAILED') NOT NULL,
    transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_note VARCHAR(255) NULL,
    CONSTRAINT fk_transactions_booking FOREIGN KEY (booking_ref) REFERENCES bookings(booking_ref),
    CONSTRAINT chk_transactions_amount CHECK (amount >= 0),
    KEY idx_transactions_booking_date (booking_ref, transaction_date),
    KEY idx_transactions_status (transaction_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO airlines (airline_name, airline_code, country, status) VALUES
('SkyLanka Airways', 'SKL', 'Sri Lanka', 'ACTIVE'),
('Pacific Wings', 'PCW', 'Singapore', 'ACTIVE'),
('EuroJet', 'EJT', 'Germany', 'ACTIVE'),
('Arabian Horizon', 'ABH', 'United Arab Emirates', 'ACTIVE'),
('NorthStar Air', 'NSA', 'Canada', 'INACTIVE');

INSERT INTO our_airlines (airline_id, status) VALUES
(1, 'ENABLED'),
(2, 'ENABLED'),
(3, 'ENABLED'),
(4, 'DISABLED');

INSERT INTO flights (
    airline_id,
    flight_no,
    departure_airport,
    destination_airport,
    departure_datetime,
    arrival_datetime,
    available_seats,
    base_ticket_price,
    status
) VALUES
(1, 'SKL101', 'CMB', 'DXB', '2026-06-02 09:30:00', '2026-06-02 13:30:00', 58, 420.00, 'SCHEDULED'),
(1, 'SKL205', 'CMB', 'SIN', '2026-06-03 15:15:00', '2026-06-03 21:00:00', 44, 380.00, 'SCHEDULED'),
(2, 'PCW890', 'SIN', 'BKK', '2026-06-04 08:10:00', '2026-06-04 09:40:00', 73, 150.00, 'SCHEDULED'),
(3, 'EJT450', 'FRA', 'LHR', '2026-06-05 10:20:00', '2026-06-05 11:30:00', 91, 210.00, 'SCHEDULED'),
(4, 'ABH777', 'DXB', 'CMB', '2026-06-06 22:00:00', '2026-06-07 03:30:00', 66, 405.00, 'SCHEDULED');

INSERT INTO agents (full_name, email, password, role, status) VALUES
('System Administrator', 'admin@skybridge.local', 'admin123', 'ADMIN', 'ACTIVE'),
('Nimal Perera', 'nimal.agent@skybridge.local', 'agent123', 'AGENT', 'ACTIVE'),
('Fathima Khan', 'fathima.agent@skybridge.local', 'agent123', 'AGENT', 'ACTIVE');

INSERT INTO passengers (passport_no, given_names, surname, email, contact_no) VALUES
('N1234567', 'Ayesha', 'Fernando', 'ayesha.fernando@example.com', '+94771234567'),
('P7654321', 'Ruwan', 'Silva', 'ruwan.silva@example.com', '+94779876543');

INSERT INTO passport_verification (passport_no, expiry_date, status, notes) VALUES
('N1234567', '2030-08-30', 'VALID', 'Verified by immigration sync'),
('P7654321', '2024-01-10', 'EXPIRED', 'Passport renewal required'),
('X9990001', '2029-05-16', 'BLACKLISTED', 'Travel restricted by authority');

INSERT INTO payment_accounts (owner_type, owner_name, card_no, account_no, current_balance, status) VALUES
('AGENCY', 'SkyBridge Agency Main Account', NULL, 'AGY-0001', 10000.00, 'ACTIVE'),
('PASSENGER', 'Ayesha Fernando', '4111111111111111', 'PAX-1001', 2500.00, 'ACTIVE'),
('PASSENGER', 'Ruwan Silva', '5555555555554444', 'PAX-1002', 200.00, 'ACTIVE');
