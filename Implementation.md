# Airline Ticket Agency Management System — Final Complete Implementation Plan

---

# 1. Project Overview

## Project Name

```text id="7m2q5v"
Airline Ticket Agency Management System
```

---

# 2. Project Goal

Develop a realistic airline ticket agency management system that simulates the operational workflow of a real-world travel agency.

The system is designed as:

```text id="4x7p1n"
internal airline agency operational software
```

instead of a public airline booking website.

The project focuses on:

* airline management
* flight searching
* passenger verification
* reservation workflows
* payment processing
* refund processing
* ticket generation
* operational reporting

The system should feel like:

```text id="9k3w6r"
real enterprise reservation software
```

while still remaining achievable using:

* Vanilla JavaScript
* Pure PHP
* MySQL

---

# 3. Technology Stack

---

# Frontend

* HTML5
* CSS3
* Vanilla JavaScript

---

# Backend

* Pure PHP

---

# Database

* MySQL

---

# 4. Core System Philosophy

The project follows:

```text id="2v8m4q"
workflow-oriented operational architecture
```

NOT:

```text id="7n3x5m"
basic CRUD-only architecture
```

The system simulates:

* real travel agency workflows
* external airline systems
* external banking systems
* government passport verification systems

ALL inside:

```text id="5m2q8v"
a single MySQL database
```

for:

* simplicity
* academic feasibility
* offline implementation
* API simulation

---

# 5. System Architecture

```text id="1p6v4x"
Frontend (HTML/CSS)
        ↓
Vanilla JavaScript
(fetch + DOM updates)
        ↓
PHP Backend Endpoints
        ↓
MySQL Database
```

---

# 6. Architectural Principles

---

# 6.1 Frontend and Backend Separation

The project uses:

```text id="8q4n1m"
clean frontend/backend separation
```

---

# Frontend Responsibilities

* UI rendering
* forms
* tables
* modal windows
* DOM updates
* user interactions

---

# JavaScript Responsibilities

* fetch() requests
* form submission handling
* dynamic UI updates
* table rendering
* validation messages
* workflow control

---

# Backend Responsibilities

* authentication
* business logic
* database operations
* payment processing
* booking management
* ticket generation

---

# Database Responsibilities

* operational data storage
* simulated external systems
* booking records
* financial simulation

---

# 6.2 No Page Refresh Architecture

The system behaves like:

```text id="6x9p3w"
modern operational software
```

Forms NEVER:

* reload pages
* redirect pages

Instead:

* JavaScript handles submissions using `fetch()`
* PHP returns JSON responses
* JavaScript updates UI instantly

---

# 6.3 No Polling Architecture

The system DOES NOT use:

```text id="3m8q1v"
constant polling
```

Instead:

* after successful operations
* JavaScript immediately updates affected tables/components

Example:

```text id="9v2m6x"
Create Booking
→ Backend inserts booking
→ Backend returns booking data
→ JS appends new row instantly
```

---

# 7. User Roles

---

# 7.1 Administrator

Administrators manage:

* supported airlines
* ticket agents
* reports and analytics
* company operational configuration

---

# 7.2 Ticket Agent

Agents perform:

* passport verification
* flight searching
* reservation workflows
* payment processing
* ticket generation
* refunds

---

# 7.3 Passenger

Passengers:

* visit physical agency offices
* provide travel details
* receive tickets
* download tickets online without login

---

# 8. Logical Database Separation

ALL tables exist inside:

```text id="4m2x8q"
one MySQL database
```

BUT are logically separated into:

* internal company systems
* airline systems
* banking systems
* government systems

This simulates:

```text id="5x9n2v"
external system integrations
```

without requiring:

* real APIs
* multiple databases
* network services

---

# 8.1 Company Operational Tables

These represent:

```text id="8p1q6m"
internal agency-owned data
```

Tables:

* agency
* agents
* passengers
* bookings
* transactions
* our_airlines
* audit_logs

These tables:

* are fully controlled by the company
* contain audit tracking fields
* generate audit logs

---

# 8.2 Airline Global Tables

These simulate:

```text id="4m2x8q"
external airline provider systems
```

Tables:

* airlines
* flights
* flight_seat_categories

Agency:

* only reads/filter these tables
* does NOT manage global airline data

Therefore:

* no audit fields
* no audit logs

---

# 8.3 Banking System Tables

These simulate:

```text id="5x9n2v"
external banking infrastructure
```

Tables:

* payment_accounts

Agency:

* only communicates with this system

Therefore:

* no audit fields
* no audit logs

---

# 8.4 Government System Tables

These simulate:

```text id="8p1q6m"
passport department systems
```

Tables:

* passport_verification

Agency:

* only validates against this system

Therefore:

* no audit fields
* no audit logs

---

# 9. Audit Tracking Architecture

---

# 9.1 Audit Fields

Critical company tables contain:

| Field      |
| ---------- |
| created_at |
| created_by |
| updated_at |
| updated_by |

---

# 9.2 Audit Logs Table

## audit_logs

Purpose:

```text id="4m2x8q"
track important operational activities
```

---

# Example Logged Events

* login
* logout
* booking creation
* payment success
* refund issued
* booking cancellation
* airline enable/disable
* agent creation/update

---

# 10. Database Design

---

# 10.1 agency

Stores company information.

| Field          |
| -------------- |
| agency_id      |
| agency_name    |
| whatsapp       |
| email          |
| service_charge |
| account_number |
| address        |
| logo           |
| created_at     |
| created_by     |
| updated_at     |
| updated_by     |

---

# 10.2 airlines

Global airline registry.

| Field        |
| ------------ |
| airline_id   |
| airline_name |
| airline_code |
| country      |
| status       |

---

# 10.3 flights

Global flight repository.

| Field               |
| ------------------- |
| flight_id           |
| airline_id          |
| flight_no           |
| departure_airport   |
| destination_airport |
| departure_datetime  |
| arrival_datetime    |
| base_ticket_price   |

---

# 10.4 flight_seat_categories

Stores seat categories and availability.

| Field            |
| ---------------- |
| category_id      |
| flight_id        |
| seat_category    |
| total_seats      |
| available_seats  |
| price_multiplier |

---

# Seat Categories

```text id="5x9n2v"
First Class
Business Class
Premium Economy
Economy Class
```

---

# 10.5 our_airlines

Stores airlines supported by the agency.

| Field      |
| ---------- |
| id         |
| airline_id |
| status     |
| created_at |
| created_by |
| updated_at |
| updated_by |

---

# 10.6 agents

Stores operational agents.

| Field      |
| ---------- |
| agent_id   |
| full_name  |
| email      |
| password   |
| role       |
| status     |
| created_at |
| created_by |
| updated_at |
| updated_by |

---

# 10.7 passengers

Stores ONLY successfully paid passengers.

| Field          |
| -------------- |
| passenger_id   |
| booking_ref    |
| passport_no    |
| full_name      |
| contact_no     |
| email          |
| payment_method |
| created_at     |
| created_by     |
| updated_at     |
| updated_by     |

IMPORTANT:

```text id="8p1q6m"
unpaid passengers are NEVER stored
```

---

# 10.8 passport_verification

Simulated government verification database.

| Field           |
| --------------- |
| verification_id |
| passport_no     |
| full_name       |
| expiry_date     |
| status          |

---

# Possible Status Values

```text id="4m2x8q"
VALID
EXPIRED
BLACKLISTED
```

---

# 10.9 bookings

Stores successful reservations.

| Field          |
| -------------- |
| booking_ref    |
| passenger_id   |
| flight_id      |
| seat_category  |
| agent_id       |
| base_price     |
| service_charge |
| discount       |
| final_price    |
| booking_status |
| payment_status |
| booking_date   |
| created_at     |
| created_by     |
| updated_at     |
| updated_by     |

---

# 10.10 payment_accounts

Simulated bank database.

| Field           |
| --------------- |
| account_id      |
| owner_type      |
| owner_name      |
| card_no         |
| account_no      |
| current_balance |

---

# 10.11 transactions

Stores operational payment transactions.

| Field              |
| ------------------ |
| transaction_id     |
| booking_ref        |
| payment_method     |
| amount             |
| transaction_status |
| transaction_date   |
| created_at         |
| created_by         |
| updated_at         |
| updated_by         |

---

# 10.12 audit_logs

Stores operational activity history.

| Field       |
| ----------- |
| log_id      |
| user_id     |
| action_type |
| table_name  |
| record_id   |
| description |
| created_at  |

---

# 11. Frontend Structure

The frontend contains:

* public pages
* protected internal operational pages

---

# 11.1 Public Pages

These pages:

* require NO login
* are customer-facing only

---

# Public Pages

| Page                          |
| ----------------------------- |
| Landing Page                  |
| Ticket Search & Download Page |

---

# Important Rule

Public pages:

* MUST NOT contain login portals
* MUST NOT expose internal operations

---

# 11.2 Internal System Pages

These pages require:

```text id="5x9n2v"
successful authentication
```

Main pages:

* Login Page
* Dashboard Page

Internal operational routes:

* should not be publicly exposed
* require session validation

---

# 12. Internal Dashboard Architecture

Dashboard content changes dynamically based on:

```text id="8p1q6m"
user role
```

---

# 12.1 Administrator Dashboard

Admin pages remain as originally planned.

---

# Admin Features

* airline management
* agent management
* operational analytics
* reports

---

# 12.2 Agent Dashboard

Agent dashboard contains:

```text id="4m2x8q"
3 sidebar tabs
```

| Tab         |
| ----------- |
| Home        |
| Reservation |
| Registry    |

---

# 13. Agent Dashboard — Home Tab

Displays:

* total bookings
* today's revenue
* refund count
* recent transactions
* active flights
* operational summaries

Purpose:

```text id="5x9n2v"
basic operational statistics
```

---

# 14. Agent Dashboard — Reservation Tab

This is:

```text id="8p1q6m"
the main reservation workflow page
```

The reservation process is:

* sequential
* workflow-driven
* dynamically revealed

WITHOUT:

* page refreshes
* redirects

---

# STEP 1 — Passport Verification

Initially visible fields:

| Field         |
| ------------- |
| Passport ID   |
| Submit Button |

---

# Verification Process

System communicates with:

```text id="4m2x8q"
passport_verification
```

(simulated government system)

---

# If Verification Fails

Examples:

* passport not found
* expired
* blacklisted

Then:

* flow stops
* error message shown

Example:

```text id="5x9n2v"
Verification Failed — Passport Expired
```

---

# If Verification Succeeds

System returns:

* passenger name

Then dynamically reveals:

* passenger information fields
* flight search fields

---

# STEP 2 — Passenger Information

Visible fields:

| Field              |
| ------------------ |
| Name (auto-filled) |
| Contact            |
| Email              |

Name comes from:

```text id="8p1q6m"
passport verification system
```

---

# STEP 3 — Flight Search

Agent enters:

| Field             |
| ----------------- |
| Departure Date    |
| Departure Airport |
| Arrival Airport   |

Then clicks:

```text id="4m2x8q"
Search Flights
```

---

# Flight Search Logic

System searches:

* flights
* airlines
* flight_seat_categories
* our_airlines

using selected filters.

---

# IMPORTANT FLIGHT FILTER RULE

A flight ONLY appears IF:

```text id="5x9n2v"
at least one seat exists in any category
```

Meaning:

* not every category needs seats
* at least one available seat overall is enough

---

# STEP 4 — Flight Result Table

After search:
a dynamic table appears.

---

# Table Columns

| Column                     |
| -------------------------- |
| Flight ID                  |
| Airline Name               |
| Departure Time             |
| Arrival Time               |
| First Class Free Seats     |
| Business Class Free Seats  |
| Premium Economy Free Seats |
| Economy Free Seats         |

---

# Important Behavior

If a category has:

```text id="8p1q6m"
0 seats available
```

Then it should:

* appear disabled
  OR
* appear marked FULL

---

# Flight Selection

Agent:

* selects a flight
* selects a seat category based on availability

Agents DO NOT manually memorize flight IDs.

---

# STEP 5 — Pricing

After flight and category selection:
pricing section appears.

---

# Visible Pricing Fields

| Field          | Editable |
| -------------- | -------- |
| Base Price     | NO       |
| Service Charge | NO       |
| Discount       | YES      |
| Final Price    | AUTO     |

---

# Pricing Formula

```text id="4m2x8q"
(base price × seat multiplier)
+ agency service charge
- discount
```

---

# STEP 6 — Payment Processing

Payment methods:

| Method |
| ------ |
| Cash   |
| Card   |

---

# CASH PAYMENT FLOW

If:

```text id="5x9n2v"
Cash selected
```

Then:

* company account number auto appears from agency table
* no manual bank input required

---

# Cash Payment Success

System:

* increases company balance
* creates booking
* creates passenger record
* creates transaction record

Then:

```text id="8p1q6m"
Payment Successful
```

---

# CARD PAYMENT FLOW

If:

```text id="4m2x8q"
Card selected
```

Visible fields:

| Field                                |
| ------------------------------------ |
| Card Number                          |
| Company Account Number (auto-filled) |

---

# Card Validation Workflow

System communicates with:

```text id="5x9n2v"
payment_accounts
```

(simulated banking system)

---

# Validation Sequence

---

# 1. Card Exists?

If not:

```text id="8p1q6m"
Card Not Found
```

Flow stops.

---

# 2. Balance Enough?

If insufficient:

```text id="4m2x8q"
Insufficient Balance
```

Flow stops.

---

# 3. Successful Transaction

System:

* deducts passenger balance
* increases company balance
* creates booking
* creates passenger
* creates transaction

Then:

```text id="5x9n2v"
Payment Successful
```

---

# IMPORTANT BUSINESS RULE

Passenger data is stored ONLY after:

```text id="8p1q6m"
successful payment
```

---

# 15. Agent Dashboard — Registry Tab

Purpose:

```text id="4m2x8q"
manage successfully paid passengers
```

---

# Registry Table Columns

| Column            |
| ----------------- |
| Booking Reference |
| Passenger Name    |
| Flight            |
| Seat Category     |
| Payment Method    |
| Paid Amount       |
| Status            |
| Actions           |

---

# Action Column

Contains:

```text id="5x9n2v"
Cancel Button
```

---

# 16. Refund Workflow

---

# CARD PAYMENT REFUND

System:

* decreases company balance
* increases passenger balance

Then:

```text id="8p1q6m"
Refund Successful
```

---

# CASH PAYMENT REFUND

System:

* decreases company balance

NO passenger balance increase because:

```text id="4m2x8q"
cash payments are not digitally stored in passenger accounts
```

---

# 17. JavaScript Communication Pattern

```text id="5x9n2v"
HTML Form
    ↓
JavaScript fetch()
    ↓
PHP Endpoint
    ↓
MySQL Query
    ↓
JSON Response
    ↓
JavaScript DOM Update
```

---

# 18. Recommended Folder Structure

```text id="8p1q6m"
project/
│
├── frontend/
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── ticket-search.html
│   │   └── ticket-view.html
│   │
│   ├── internal/
│   │   ├── login.html
│   │   └── dashboard.html
│   │
│   └── assets/
│       ├── css/
│       ├── js/
│       └── images/
│
├── backend/
│   │
│   ├── config/
│   │   └── db.php
│   │
│   ├── auth/
│   │
│   ├── bookings/
│   ├── passengers/
│   ├── payments/
│   ├── reports/
│   ├── flights/
│   ├── airlines/
│   │
│   └── utils/
│
├── uploads/
│
└── database/
    └── airline_system.sql
```

---

# 19. UI Design Direction

The interface should feel like:

```text id="4m2x8q"
enterprise airline operational software
```

NOT:

```text id="5x9n2v"
consumer travel booking website
```

---

# Recommended Design Style

* navy blue branding
* white work surfaces
* operational dashboards
* clean tables
* minimal animations
* enterprise layout
* data-focused interface

---

# 20. Design System & Color Palette

```css
--brand-navy: #0a1628;
--brand-indigo: #1b2b4b;
--brand-blue: #2f6bff;
--luxury-gold: #c9a227;
--soft-background: #f7f9fc;
--card-background: #eef2f7;
--border-light: #e3e8ef;
--text-primary: #0b1220;
--text-secondary: #4b5563;
--text-muted: #8a94a6;
--background: #ffffff;
--foreground: #0b1220;

--success: #1f9d55;
--warning: #d97706;
--danger: #dc2626;
```

---

# 21. Final System Direction

This project is:

```text id="8p1q6m"
a realistic airline ticket agency operational management system
```

with:

* workflow-driven reservations
* simulated external systems
* dynamic frontend behavior
* enterprise operational architecture
* realistic payment simulation
* audit tracking
* seat-category management
* refund workflows
* no page refreshes
* no polling
* clean frontend/backend separation

while remaining fully achievable using:

* Vanilla JavaScript
* Pure PHP
* MySQL
