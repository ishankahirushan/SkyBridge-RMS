# Airline Ticket Agency Management System — Final Full Implementation Plan

---

## 1. Project Overview

### Project Name
**Airline Ticket Agency Management System**

---

## 2. Project Goal

Develop a realistic airline ticket agency management system that simulates the operational workflow of a real-world travel agency.

The system focuses on:
- Airline management
- Flight searching
- Passenger verification
- Ticket booking
- Payment processing
- Ticket generation
- Refunds
- Operational reporting

The project is designed as:
**Internal airline agency operational software** instead of a public airline booking website.

---

## 3. Technology Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Pure PHP

### Database
- MySQL

---

## 4. System Architecture

```
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

## 5. Architectural Principles

### 5.1 Frontend and Backend Separation

The project separates:
- Frontend UI
- Frontend interaction logic
- Backend business logic
- Database layer

#### Frontend Responsibilities
- UI rendering
- Forms
- Tables
- Modals
- DOM updates
- Fetch requests

#### JavaScript Responsibilities
- Form submissions
- AJAX requests
- Updating UI dynamically
- Updating tables instantly
- Modal handling
- Validation messages

#### Backend Responsibilities
- Authentication
- Database operations
- Business logic
- Validation
- Payment processing
- Ticket generation

#### Database Responsibilities
- Store operational data
- Store airline data
- Store booking records
- Store simulated payment data

### 5.2 No Page Refresh Architecture

The system behaves like a modern application.

The system DOES NOT use:
- Traditional page refresh workflow

Instead:
- Forms submit using JavaScript `fetch()`
- PHP returns JSON responses
- JavaScript updates UI instantly

### 5.3 No Polling Architecture

The system DOES NOT use:
- Constant polling

Instead:
- After successful operations
- JavaScript immediately updates affected tables/components

**Example:**
```
Create booking
→ Backend inserts booking
→ Backend returns booking data
→ JS appends new row instantly
```

---

## 6. User Roles

### 6.1 Administrator

Administrators manage:
- Supported airlines
- Ticket agents
- Reports and analytics

### 6.2 Ticket Agent

Agents perform:
- Flight searching
- Passenger verification
- Booking creation
- Payment processing
- Ticket generation
- Refunds

### 6.3 Passenger

Passengers:
- Visit physical agency
- Provide travel details
- Receive tickets
- Download tickets online without login

---

## 7. Realistic Business Model

The system simulates:
**A real travel agency operation** instead of a direct airline booking platform.

### 7.1 Airline Ownership Concept

Flights belong to airlines.

The agency DOES NOT create flights manually.

Instead:
- Flight data is considered imported airline data

### 7.2 Agency Supported Airlines

The agency only works with selected airlines.

Therefore:
- Global airline data
- Agency airline access
are separated.

---

## 8. Database Design

### 8.1 airlines
Master airline registry

| Field | Type |
|-------|------|
| airline_id | INT PK |
| airline_name | VARCHAR |
| airline_code | VARCHAR |
| country | VARCHAR |
| status | VARCHAR |

### 8.2 flights
Master flight repository

| Field | Type |
|-------|------|
| flight_id | INT PK |
| airline_id | FK |
| flight_no | VARCHAR |
| departure_airport | VARCHAR |
| destination_airport | VARCHAR |
| departure_datetime | DATETIME |
| arrival_datetime | DATETIME |
| available_seats | INT |
| base_ticket_price | DECIMAL |

### 8.3 our_airlines
Agency enabled airlines

| Field | Type |
|-------|------|
| id | INT PK |
| airline_id | FK |
| status | VARCHAR |

**Purpose:** Determine which airlines are supported by the agency

### 8.4 agents

| Field | Type |
|-------|------|
| agent_id | INT PK |
| full_name | VARCHAR |
| email | VARCHAR |
| password | VARCHAR |
| role | VARCHAR |
| status | VARCHAR |

### 8.5 passengers

| Field | Type |
|-------|------|
| passenger_id | INT PK |
| passport_no | VARCHAR |
| given_names | VARCHAR |
| surname | VARCHAR |
| email | VARCHAR |
| contact_no | VARCHAR |

### 8.6 passport_verification

| Field | Type |
|-------|------|
| verification_id | INT PK |
| passport_no | VARCHAR |
| expiry_date | DATE |
| status | VARCHAR |

**Possible status:**
- VALID
- EXPIRED
- BLACKLISTED

### 8.7 bookings

| Field | Type |
|-------|------|
| booking_ref | VARCHAR PK |
| passenger_id | FK |
| flight_id | FK |
| agent_id | FK |
| seat_no | VARCHAR |
| base_price | DECIMAL |
| service_charge | DECIMAL |
| discount | DECIMAL |
| final_price | DECIMAL |
| booking_status | VARCHAR |
| payment_status | VARCHAR |
| booking_date | DATETIME |

### 8.8 payment_accounts
Simulated payment system

| Field | Type |
|-------|------|
| account_id | INT PK |
| owner_type | VARCHAR |
| owner_name | VARCHAR |
| card_no | VARCHAR |
| account_no | VARCHAR |
| current_balance | DECIMAL |

**Purpose:**
- Represent passenger accounts
- Represent agency accounts
- Simulate payment processing

### 8.9 transactions

| Field | Type |
|-------|------|
| transaction_id | INT PK |
| booking_ref | FK |
| payment_method | VARCHAR |
| amount | DECIMAL |
| transaction_status | VARCHAR |
| transaction_date | DATETIME |

---

## 9. Pricing Logic

The system uses realistic business pricing.

### Formula
```
Final Ticket Price =
Airline Base Price
+ Agency Service Charge
- Agent Discount
```

### Example
```
Airline Price = $500
Agency Fee = $40
Discount = $20

Final Price = $520
```

---

## 10. Payment System

The system uses:
**Simulated payment processing** instead of real banking APIs.

### 10.1 Cash Payment Workflow
1. Agent selects CASH
2. System displays total amount
3. Agent confirms payment
4. Agency account balance increases
5. Payment marked SUCCESS

### 10.2 Card Payment Workflow
1. Agent selects CARD
2. Agent enters:
   - Card number
   - Account number
3. System checks balance
4. If enough balance:
   - Deduct passenger balance
   - Add agency balance
   - Payment success
5. Otherwise:
   - Payment failed

### 10.3 Refund Workflow

**Refund types:**
- Cash refund
- Card/account refund

#### Refund by Account
System:
- Deducts agency balance
- Adds passenger balance

#### Refund by Cash
System:
- Deducts agency balance

---

## 11. Booking Workflow

### Step 1 — Flight Search
Agent searches:
- Departure airport
- Destination airport
- Travel date

System only shows flights belonging to:
**our_airlines**

### Step 2 — Passenger Registration
Agent enters:
- Passport number
- Names
- Contact information

### Step 3 — Passenger Verification
System checks:
- Passport expiry
- Blacklist status

### Step 4 — Price Calculation
System calculates:
- Base ticket price
- Agency fee
- Optional discount

### Step 5 — Payment Processing
Agent selects:
- Cash
- Card

System processes payment.

### Step 6 — Booking Confirmation
System:
- Generates booking reference
- Allocates seat
- Stores booking

### Step 7 — E-Ticket Generation
Passenger can:
- View ticket
- Print ticket
- Download ticket
without login.

---

## 12. Public Pages

### 12.1 Landing Page
**Purpose:**
- Branding
- Quick navigation
- Agency introduction
- Ticket retrieval access

### 12.2 Ticket Search & Download Page
Passenger enters:
- Booking reference
- Passport number/account details

System:
- Retrieves ticket
- Allows viewing
- Allows downloading

---

## 13. Internal Pages

### 13.1 Login Page
Single authentication page.
Redirects users based on role.

### 13.2 Admin Dashboard
Contains:
- Analytics
- Airline management
- Agent management
- Operational summaries

### 13.3 Agent Dashboard
Contains:
- Flight search
- Booking management
- Passenger verification
- Payment processing
- Ticket generation

---

## 14. Administrator Features

### 14.1 Airline Management
Admin manages:
**our_airlines**

Functions:
- Enable airline
- Disable airline

### 14.2 Agent Management
Functions:
- Create agents
- Edit agents
- Deactivate agents
- Reset passwords

### 14.3 Analytics & Reports
Reports include:
- Total bookings
- Total revenue
- Bookings per airline
- Popular destinations
- Refund statistics
- Agent activity

---

## 15. Agent Features

### 15.1 Flight Search
Search flights dynamically.

### 15.2 Passenger Verification
Validate:
- Expiry dates
- Blacklist status

### 15.3 Booking Management
Functions:
- Create bookings
- Cancel bookings
- Search bookings
- View booking history

### 15.4 Payment Management
Functions:
- Process payments
- Process refunds
- Validate balances

### 15.5 Ticket Generation
Functions:
- Generate ticket
- Download PDF
- Print ticket

---

## 16. Frontend Behavior

The system behaves like a modern operational application.

### 16.1 Form Submission Behavior
Forms NEVER redirect pages.

Forms submit using:
**`fetch()`**

PHP returns:
**JSON responses**

### 16.2 Dynamic UI Updates
After operations:
- Tables update instantly
- Dashboard statistics update instantly
- Booking lists update instantly

WITHOUT:
- Page refresh
- Polling

---

## 17. Recommended Folder Structure

```
project/
│
├── frontend/
│   │
│   ├── public/
│   │   ├── index.html
│   │   ├── ticket-search.html
│   │   └── ticket-view.html
│   │
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── airlines.html
│   │   ├── agents.html
│   │   └── reports.html
│   │
│   ├── agent/
│   │   ├── dashboard.html
│   │   ├── flights.html
│   │   ├── bookings.html
│   │   ├── passengers.html
│   │   └── payments.html
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
│   │   ├── login.php
│   │   └── logout.php
│   │
│   ├── airlines/
│   ├── flights/
│   ├── bookings/
│   ├── passengers/
│   ├── payments/
│   ├── reports/
│   │
│   └── utils/
│
├── uploads/
│
└── database/
    └── airline_system.sql
```

---

## 18. JavaScript Communication Pattern

### Example Flow
```
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

## 19. UI Design Direction

The interface should feel like:
**Enterprise airline agency software**

NOT:
**Consumer travel booking website**

### Recommended UI Style
- Navy blue palette
- White work surfaces
- Clean tables
- Operational dashboards
- Minimal animations
- Enterprise layout

---

## 20. Design System & Color Palette

### CSS Variables

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

### Color Usage Guide

| Variable | Purpose | Example |
|----------|---------|---------|
| `--brand-navy` | Primary dark brand color | Navigation bars, headers |
| `--brand-indigo` | Secondary dark color | Sidebar backgrounds |
| `--brand-blue` | Primary action color | Buttons, links, highlights |
| `--luxury-gold` | Accent color | Premium features, badges |
| `--soft-background` | Page background | Overall page surface |
| `--card-background` | Card/box backgrounds | Content cards, panels |
| `--border-light` | Border color | Dividers, borders |
| `--text-primary` | Main text color | Body text, labels |
| `--text-secondary` | Secondary text | Subtext, descriptions |
| `--text-muted` | Muted text | Hints, timestamps |
| `--background` | Element backgrounds | Form inputs, surfaces |
| `--foreground` | Element text | Button text, icons |
| `--success` | Success state | Confirmation, success messages |
| `--warning` | Warning state | Warnings, caution messages |
| `--danger` | Error state | Errors, deletions, alerts |

---

## 21. Future Improvements (Optional)

Possible future additions:
- Real airline APIs
- Real banking integration
- Email notifications
- QR code tickets
- Seat map visualization
- Real-time flight tracking

These are outside first-year scope.

---

## 22. Final System Direction

This project is designed as:
**A realistic airline ticket agency operational management system**

with:
- Realistic workflows
- Airline separation
- Operational dashboards
- Passenger verification
- Simulated payment processing
- Instant UI updates
- No page refreshes
- No polling
- Clean frontend/backend separation

while remaining fully achievable using:
- Vanilla JavaScript
- Pure PHP
- MySQL

---

## Implementation Checklist

### Phase 1: Setup & Database
- [ ] Set up project folder structure
- [ ] Create MySQL database schema
- [ ] Configure PHP database connection
- [ ] Create test data for airlines, flights, and accounts

### Phase 2: Authentication
- [ ] Create login page
- [ ] Implement PHP login endpoint
- [ ] Implement role-based redirect logic
- [ ] Create logout functionality

### Phase 3: Admin Dashboard
- [ ] Build admin dashboard UI
- [ ] Implement airline management features
- [ ] Implement agent management features
- [ ] Create analytics and reports pages

### Phase 4: Agent Dashboard
- [ ] Build agent dashboard UI
- [ ] Implement flight search functionality
- [ ] Implement passenger verification system
- [ ] Create booking management interface

### Phase 5: Booking System
- [ ] Implement booking creation workflow
- [ ] Create payment processing system
- [ ] Implement refund functionality
- [ ] Create ticket generation system

### Phase 6: Public Pages
- [ ] Create landing page
- [ ] Build ticket search and download page
- [ ] Implement public ticket viewing

### Phase 7: Testing & Optimization
- [ ] Test all workflows
- [ ] Optimize database queries
- [ ] Ensure no page refreshes
- [ ] Test responsive design

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation