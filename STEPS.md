# SkyBridge RMS — Implementation Steps

---

## System Summary

**Airline Ticket Agency Management System** — An internal operational software for managing flight bookings, payments, and refunds with workflow-driven reservations, simulated external systems, and enterprise architecture.

**Tech Stack:** Vanilla JavaScript, Pure PHP, MySQL  
**Architecture:** Frontend/Backend separation, no page refreshes, no polling  
**Database:** Single MySQL with 12 tables logically separated into company, airline, banking, and government systems

---

## Phase 1: Database Setup

### Step 1.1: Create Database Schema
- Create MySQL database `skybridge_rms`
- Create 12 tables with audit fields where applicable:
  - **Company Tables:** agency, agents, passengers, bookings, transactions, our_airlines, audit_logs (with created_at, created_by, updated_at, updated_by)
  - **Airline Tables:** airlines, flights, flight_seat_categories (no audit fields)
  - **Banking:** payment_accounts (no audit fields)
  - **Government:** passport_verification (no audit fields)

### Step 1.2: Seed Initial Data
- Populate airlines table with sample airline data
- Populate flights table with sample flights
- Populate flight_seat_categories with seat data (First, Business, Premium Economy, Economy)
- Populate passport_verification with test passengers
- Populate payment_accounts with test bank accounts

### Step 1.3: Create DB Configuration
- Create `backend/config/db.php` with database connection credentials
- Set up connection pooling/error handling

---

## Phase 2: Backend Infrastructure

### Step 2.1: Create Core Backend Structure
- Set up folder structure:
  - `backend/config/` — Configuration files
  - `backend/auth/` — Authentication handlers
  - `backend/bookings/` — Booking endpoints
  - `backend/passengers/` — Passenger endpoints
  - `backend/payments/` — Payment processing
  - `backend/flights/` — Flight search/retrieval
  - `backend/airlines/` — Airline management
  - `backend/reports/` — Reporting logic
  - `backend/utils/` — Helper functions

### Step 2.2: Create Authentication System
- Create login endpoint (`POST /backend/auth/login.php`)
  - Validate agent credentials against agents table
  - Create session/JWT token
  - Return user role and permissions
- Create logout endpoint (`POST /backend/auth/logout.php`)
- Create session validation middleware
- Create audit logging for login/logout events

### Step 2.3: Create Core Utility Functions
- Database query helpers
- JSON response formatter
- Error handler
- Session validator
- Audit logger (logs user actions to audit_logs table)

---

## Phase 3: Backend — Passport Verification

### Step 3.1: Passport Verification Endpoint
- Create `POST /backend/bookings/verify-passport.php`
- Accepts: passport_no
- Queries passport_verification table
- Returns:
  - Success: passenger name, passport details
  - Failure: error message (not found, expired, blacklisted)
- Validates passport expiry date
- Logs action to audit_logs

---

## Phase 4: Backend — Flight Search

### Step 4.1: Flight Search Endpoint
- Create `POST /backend/flights/search.php`
- Accepts: departure_date, departure_airport, arrival_airport
- Joins flights, airlines, flight_seat_categories, our_airlines tables
- **Critical Filter:** Only return flights with at least 1 available seat across any category
- Returns: flight_id, airline_name, departure_time, arrival_time, seat availability per category
- Logs search action to audit_logs

### Step 4.2: Get Flight Details Endpoint
- Create `GET /backend/flights/get-flight.php?flight_id={id}`
- Returns full flight details with pricing and seat categories
- Used after agent selects a flight

---

## Phase 5: Backend — Pricing Calculation

### Step 5.1: Calculate Pricing Endpoint
- Create `POST /backend/bookings/calculate-price.php`
- Accepts: flight_id, seat_category, discount
- Formula: `(base_price × seat_multiplier) + service_charge - discount`
- Gets base_price from flights table
- Gets seat_multiplier from flight_seat_categories table
- Gets service_charge from agency table
- Returns: base_price, service_charge, discount, final_price

---

## Phase 6: Backend — Payment Processing

### Step 6.1: Cash Payment Endpoint
- Create `POST /backend/payments/process-cash.php`
- Accepts: passport_no, contact_no, email, flight_id, seat_category, payment_method, amount, discount
- Validates all inputs
- Starts transaction (all-or-nothing)
- Operations in sequence:
  1. Verify passenger exists in passport_verification
  2. Check seat availability
  3. Get company account from agency table
  4. Update company balance in payment_accounts (increase)
  5. Create booking record
  6. Create passenger record (only after payment success)
  7. Create transaction record
  8. Decrease available_seats in flight_seat_categories
  9. Log action to audit_logs
- Returns: booking reference, transaction_id, success message
- On error: rollback all changes

### Step 6.2: Card Payment Endpoint
- Create `POST /backend/payments/process-card.php`
- Accepts: passport_no, contact_no, email, flight_id, seat_category, card_no, company_account_no, amount, discount
- Validation sequence:
  1. Verify card exists in payment_accounts
  2. Verify card balance ≥ amount
  3. Verify company account exists
- Starts transaction:
  1. Check seat availability
  2. Deduct from passenger card balance
  3. Increase company balance
  4. Create booking record
  5. Create passenger record (only after payment success)
  6. Create transaction record
  7. Decrease available_seats
  8. Log action to audit_logs
- Returns: booking reference, transaction_id, success message
- On error: rollback all changes

---

## Phase 7: Backend — Refund Processing

### Step 7.1: Card Payment Refund Endpoint
- Create `POST /backend/payments/refund.php`
- Accepts: booking_ref
- Validates booking exists and status is 'paid'
- Starts transaction:
  1. Decrease company balance
  2. Increase passenger card balance
  3. Update transaction_status to 'refunded'
  4. Update booking_status to 'cancelled'
  5. Increase available_seats in flight_seat_categories
  6. Log refund to audit_logs
- Returns: success message

### Step 7.2: Cash Payment Refund
- Same as card refund but WITHOUT passenger balance increase
- Only decreases company balance
- Logs action

---

## Phase 8: Backend — Registry Management

### Step 8.1: Get Passenger Bookings Endpoint
- Create `GET /backend/passengers/get-bookings.php?agent_id={id}`
- Returns list of bookings for agent with columns:
  - booking_ref, passenger_name, flight_details, seat_category, payment_method, amount, status
- Logs action

### Step 8.2: Cancel Booking Endpoint
- Create `POST /backend/bookings/cancel.php`
- Accepts: booking_ref
- Validates booking exists
- Calls refund endpoint
- Logs action

---

## Phase 9: Backend — Admin Features

### Step 9.1: Airline Management Endpoints
- `POST /backend/airlines/enable.php` — Add airline to our_airlines
- `POST /backend/airlines/disable.php` — Remove from our_airlines
- `GET /backend/airlines/list.php` — Get all supported airlines
- Logs all actions

### Step 9.2: Agent Management Endpoints
- `POST /backend/agents/create.php` — Create new agent
- `POST /backend/agents/update.php` — Update agent details
- `POST /backend/agents/toggle-status.php` — Enable/disable agent
- `GET /backend/agents/list.php` — Get all agents
- Logs all actions

### Step 9.3: Reports & Analytics Endpoints
- `GET /backend/reports/dashboard.php` — Get dashboard statistics
- `GET /backend/reports/today-revenue.php` — Today's revenue
- `GET /backend/reports/refund-count.php` — Refund count
- `GET /backend/reports/recent-transactions.php` — Recent transactions
- `GET /backend/reports/active-flights.php` — Active flights

---

## Phase 10: Frontend Structure Setup

### Step 10.1: Create Folder Structure
```
frontend/
├── public/
│   ├── index.html          (Landing page)
│   └── ticket-search.html  (Public ticket search & download)
├── internal/
│   ├── login.html          (Login page)
│   └── dashboard.html      (Admin/Agent dashboard - single page)
├── assets/
│   ├── css/
│   │   ├── style.css       (Global styles)
│   │   ├── admin.css       (Admin dashboard styles)
│   │   └── agent.css       (Agent dashboard styles)
│   └── js/
│       ├── api.js          (API communication)
│       ├── auth.js         (Authentication logic)
│       ├── dashboard.js    (Dashboard logic - routes based on role)
│       ├── reservation.js  (Reservation workflow)
│       ├── registry.js     (Registry tab)
│       ├── admin.js        (Admin features)
│       └── utils.js        (Helper functions)
└── images/
    ├── logo.png
    └── icons/
```

---

## Phase 11: Frontend — Public Pages

### Step 11.1: Create Landing Page
- File: `frontend/public/index.html`
- Display agency information
- Navigation to ticket search
- Navigation to login (internal link only, no form)

### Step 11.2: Create Ticket Search & Download Page
- File: `frontend/public/ticket-search.html`
- Search form: booking_ref input
- Fetch passenger ticket by booking_ref
- Display ticket information
- Download ticket as PDF or print

### Step 11.3: No Login on Public Pages
- Public pages MUST NOT contain login forms
- Ensure no internal operations exposed

---

## Phase 12: Frontend — Authentication

### Step 12.1: Create Login Page
- File: `frontend/internal/login.html`
- Form fields: email, password
- Submit via fetch POST to `/backend/auth/login.php`
- On success: store token/session, redirect to dashboard
- On failure: show error message
- Remember role from response for dashboard routing

### Step 12.2: Session Management
- Create `frontend/assets/js/auth.js`
- Check session on page load
- Redirect to login if not authenticated
- Logout functionality
- Session timeout handling

---

## Phase 13: Frontend — Dashboard Base

### Step 13.1: Create Dashboard Shell
- File: `frontend/internal/dashboard.html`
- Single-page dashboard for both Admin and Agent
- Role-based content rendering (check user role from session)
- Header with logo, user info, logout button
- Sidebar for navigation
- Main content area for dynamic page loading

### Step 13.2: Role-Based Routing
- Check user role on page load
- Hide/show tabs based on role
- Route to correct content section
- Admin sees: Airline Management, Agent Management, Reports
- Agent sees: Home, Reservation, Registry

---

## Phase 14: Frontend — Agent Dashboard — Home Tab

### Step 14.1: Create Home Tab Content
- Fetch dashboard statistics from `/backend/reports/dashboard.php`
- Display:
  - Total bookings (count)
  - Today's revenue (sum of transactions)
  - Refund count (count of refunded bookings)
  - Recent transactions (last 10)
  - Active flights (flights with available seats)
  - Operational summaries (pie charts, bar charts)
- Update on tab load
- Optional: Add refresh button

---

## Phase 15: Frontend — Agent Dashboard — Reservation Workflow

### Step 15.1: Create Reservation Tab Shell
- File: `frontend/assets/js/reservation.js`
- Initialize with Step 1 visible only
- Progressively reveal steps based on previous step completion
- No page refreshes during workflow
- Clear workflow state on tab switch

### Step 15.2: Implement Step 1 — Passport Verification
- Display: Passport ID input, Submit button
- Fetch POST to `/backend/bookings/verify-passport.php`
- On success: 
  - Store passenger name from response
  - Reveal Step 2
  - Show success message
- On error: Show error message, keep Step 1
- Disable submit button during fetch

### Step 15.3: Implement Step 2 — Passenger Information
- Auto-fill Name from Step 1 response
- Input fields: Contact, Email
- Next button to proceed to Step 3
- Previous button to return to Step 1

### Step 15.4: Implement Step 3 — Flight Search
- Input fields: Departure Date, Departure Airport, Arrival Airport
- Search button
- Fetch POST to `/backend/flights/search.php`
- On success: 
  - Populate Step 4 with results
  - Reveal Step 4
- On error: Show error message
- Disable search button during fetch

### Step 15.5: Implement Step 4 — Flight Results Table
- Display flights in table format
- Columns: Flight ID, Airline Name, Departure Time, Arrival Time, Seat Availability (per category)
- Mark unavailable categories as FULL or DISABLED
- Flight selection radio buttons
- Seat category selection dropdowns (only enabled categories)
- Next button (after flight + category selected)
- Previous button to Step 3

### Step 15.6: Implement Step 5 — Pricing
- Display: Base Price (read-only), Service Charge (read-only), Discount (editable), Final Price (auto-calculated)
- Fetch from `/backend/bookings/calculate-price.php` on load with selected flight and category
- Recalculate on discount change
- Next button to proceed to Step 6
- Previous button to Step 4

### Step 15.7: Implement Step 6 — Payment Processing
- Radio buttons: Cash, Card
- If Cash selected:
  - Auto-fill company account from agency table
  - Show company account number (read-only)
- If Card selected:
  - Input: Card Number
  - Auto-fill Company Account Number
- Process Payment button
- Fetch POST to appropriate payment endpoint
- On success:
  - Show booking reference, transaction_id
  - Show "Payment Successful" message
  - Reset workflow
  - Option to view receipt or start new booking
- On error: Show error message with reason
- Disable button during fetch

---

## Phase 16: Frontend — Agent Dashboard — Registry Tab

### Step 16.1: Create Registry Tab Content
- File: `frontend/assets/js/registry.js`
- Fetch passenger bookings from `/backend/passengers/get-bookings.php`
- Display in table format
- Columns: Booking Reference, Passenger Name, Flight, Seat Category, Payment Method, Paid Amount, Status
- Include Cancel button in Actions column
- Pagination (if many records)
- Sort/filter capabilities

### Step 16.2: Implement Refund Workflow
- Cancel button triggers confirmation dialog
- On confirm: Fetch POST to `/backend/bookings/cancel.php`
- On success: Remove row from table, show success message
- On error: Show error message
- Update dashboard statistics after refund

---

## Phase 17: Frontend — Admin Dashboard

### Step 17.1: Create Admin Airline Management
- Display list of supported airlines (from our_airlines + airlines join)
- Show status (enabled/disabled)
- Enable button (if disabled)
- Disable button (if enabled)
- Fetch POST to appropriate endpoint
- Update table on action completion

### Step 17.2: Create Admin Agent Management
- Display list of agents
- Show agent details: name, email, role, status
- Create new agent form
- Update agent form
- Enable/disable agent toggle
- Fetch to appropriate endpoints
- Update table on changes

### Step 17.3: Create Admin Reports & Analytics
- Dashboard statistics section
- Charts: booking trends, revenue by airline, payment methods distribution
- Export reports as CSV/PDF

---

## Phase 18: API Communication Layer

### Step 18.1: Create API Wrapper
- File: `frontend/assets/js/api.js`
- Centralize all fetch requests
- Handle authentication headers/tokens
- Error handling and retry logic
- Loading state management
- Response validation

### Step 18.2: Add Error Handling
- Handle network errors
- Handle server errors (4xx, 5xx)
- Display user-friendly error messages
- Log errors for debugging

---

## Phase 19: Styling & UI

### Step 19.1: Create Base Stylesheet
- File: `frontend/assets/css/style.css`
- Implement design system colors (navy, indigo, blue, gold, etc.)
- Base typography, spacing, layout
- Responsive design utilities

### Step 19.2: Style Admin Dashboard
- File: `frontend/assets/css/admin.css`
- Dashboard layout and components
- Tables, forms, charts
- Enterprise look and feel

### Step 19.3: Style Agent Dashboard
- File: `frontend/assets/css/agent.css`
- Tab navigation
- Reservation workflow styling
- Registry table styling
- Responsive mobile considerations

### Step 19.4: Polish Styling
- Add brand colors throughout
- Ensure consistent spacing and typography
- Add hover states, transitions
- Test responsive design

---

## Phase 20: Testing & Validation

### Step 20.1: Unit Testing
- Test backend endpoints in isolation
- Test database transactions (rollback on error)
- Test validation logic

### Step 20.2: Integration Testing
- Test complete workflows:
  - Passport verification → Flight search → Booking → Payment → Receipt
  - Refund workflow
  - Admin airline enable/disable
- Test with various scenarios (missing data, errors, edge cases)

### Step 20.3: Security Testing
- Test session validation
- Test authentication bypass attempts
- Test SQL injection prevention
- Test CSRF protection (if needed)

### Step 20.4: UI/UX Testing
- Test no-page-refresh behavior
- Test form validation messages
- Test table updates without reload
- Test responsiveness

---

## Phase 21: Documentation & Deployment

### Step 21.1: Create Database Documentation
- SQL dump file
- Schema documentation
- Sample data instructions

### Step 21.2: Create API Documentation
- Endpoint reference (request/response formats)
- Authentication details
- Error codes and meanings

### Step 21.3: Create User Documentation
- Admin guide
- Agent guide
- Troubleshooting guide

### Step 21.4: Deployment Preparation
- Create .htaccess or server config for routing
- Create environment configuration
- Create deployment checklist
- Deploy to server

---

## Implementation Order Recommendation

1. **Database (Phase 1)** — Foundation for everything
2. **Backend Infrastructure (Phase 2-3)** — Core API endpoints
3. **Backend Flight Search (Phase 4-5)** — Reservation workflow start
4. **Backend Payments (Phase 6-7)** — Critical business logic
5. **Backend Admin (Phase 9)** — Admin operations
6. **Frontend Setup (Phase 10-13)** — UI scaffolding
7. **Agent Reservation Workflow (Phase 15)** — Main feature, implement step-by-step
8. **Registry Tab (Phase 16)** — Booking management
9. **Admin Features (Phase 17)** — Admin operations
10. **API Layer & Styling (Phase 18-19)** — Polish and communication
11. **Testing (Phase 20)** — Quality assurance
12. **Deployment (Phase 21)** — Production readiness

---

## Key Implementation Notes

- **No Page Refreshes:** Use fetch() with DOM updates only
- **Workflow State:** Keep reservation workflow state in JavaScript (don't reload)
- **Transactions:** All payment operations must be database transactions (atomic)
- **Audit Logging:** Log all critical actions (login, booking, refund, etc.)
- **Seat Availability:** Always check before booking and decrement atomically
- **Passenger Data:** Only store after successful payment
- **Error Handling:** Graceful error messages, never expose raw database errors
- **Role-Based Access:** Always validate user role on backend before executing operations
- **Session Management:** Validate session on every backend request

---
