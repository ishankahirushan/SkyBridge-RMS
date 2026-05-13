// SkyBridge RMS - Reservation Module

const reservationState = {
    step: 1,
    passport: null,
    passenger: {
        full_name: '',
        contact_no: '',
        email: ''
    },
    search: {
        departure_date: '',
        departure_airport: '',
        arrival_airport: ''
    },
    flights: [],
    selectedFlight: null,
    selectedSeats: [],
    pricing: null,
    booking: null,
    paymentMethod: 'cash'
};

function initReservation() {
    console.info('Reservation module loaded');
}

function resetReservationState() {
    reservationState.step = 1;
    reservationState.passport = null;
    reservationState.passenger = {
        full_name: '',
        contact_no: '',
        email: ''
    };
    reservationState.search = {
        departure_date: '',
        departure_airport: '',
        arrival_airport: ''
    };
    reservationState.flights = [];
    reservationState.selectedFlight = null;
    reservationState.selectedSeats = [];
    reservationState.pricing = null;
    reservationState.booking = null;
    reservationState.paymentMethod = 'cash';
}

function loadReservationWizard() {
    const contentArea = document.getElementById('content');
    if (!contentArea) {
        return;
    }

    resetReservationState();

    contentArea.innerHTML = `
        <div class="reservation-wizard">
            <h2>New Reservation</h2>
            <div id="reservationMessage"></div>

            <div class="wizard-steps">
                <div class="wizard-step active" data-step="1">
                    <div class="step-number">1</div>
                    <div class="step-title">Passport Verification</div>
                </div>
                <div class="wizard-step" data-step="2">
                    <div class="step-number">2</div>
                    <div class="step-title">Passenger Information</div>
                </div>
                <div class="wizard-step" data-step="3">
                    <div class="step-number">3</div>
                    <div class="step-title">Flight Search</div>
                </div>
                <div class="wizard-step" data-step="4">
                    <div class="step-number">4</div>
                    <div class="step-title">Flight Results</div>
                </div>
                <div class="wizard-step" data-step="5">
                    <div class="step-number">5</div>
                    <div class="step-title">Seat Selection</div>
                </div>
                <div class="wizard-step" data-step="6">
                    <div class="step-number">6</div>
                    <div class="step-title">Price Review</div>
                </div>
                <div class="wizard-step" data-step="7">
                    <div class="step-number">7</div>
                    <div class="step-title">Confirm Booking</div>
                </div>
                <div class="wizard-step" data-step="8">
                    <div class="step-number">8</div>
                    <div class="step-title">Payment</div>
                </div>
            </div>

            <div class="wizard-content">
                <section id="step1" class="wizard-section active">
                    <h3>Step 1: Verify Passport</h3>
                    <form id="passportForm">
                        <div class="form-group">
                            <label for="passportNo">Passport Number</label>
                            <input id="passportNo" name="passport_no" type="text" required placeholder="Enter passport number">
                        </div>
                        <button id="passportSubmitBtn" type="submit" class="btn btn-primary">Verify Passport</button>
                    </form>
                </section>

                <section id="step2" class="wizard-section">
                    <h3>Step 2: Passenger Information</h3>
                    <form id="passengerForm" class="passenger-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="passengerName">Passenger Name</label>
                                <input id="passengerName" name="full_name" type="text" readonly>
                            </div>
                            <div class="form-group">
                                <label for="passengerPassport">Passport Number</label>
                                <input id="passengerPassport" name="passport_no" type="text" readonly>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="passengerContact">Contact Number</label>
                                <input id="passengerContact" name="contact_no" type="text" required placeholder="e.g. +94 77 1234567">
                            </div>
                            <div class="form-group">
                                <label for="passengerEmail">Email</label>
                                <input id="passengerEmail" name="email" type="email" required placeholder="passenger@example.com">
                            </div>
                        </div>
                        <div class="wizard-nav">
                            <button id="backToStep1Btn" type="button" class="btn-prev">Previous</button>
                            <button id="toStep3Btn" type="submit" class="btn-next">Next: Search Flights</button>
                        </div>
                    </form>
                </section>

                <section id="step3" class="wizard-section">
                    <h3>Step 3: Flight Search</h3>
                    <form id="flightSearchForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="departureDate">Departure Date</label>
                                <input id="departureDate" name="departure_date" type="date" required>
                            </div>
                            <div class="form-group">
                                <label for="departureAirport">Departure Airport</label>
                                <input id="departureAirport" name="departure_airport" type="text" required placeholder="e.g. CMB">
                            </div>
                            <div class="form-group">
                                <label for="arrivalAirport">Arrival Airport</label>
                                <input id="arrivalAirport" name="arrival_airport" type="text" required placeholder="e.g. DXB">
                            </div>
                        </div>
                        <div class="wizard-nav">
                            <button id="backToStep2Btn" type="button" class="btn-prev">Previous</button>
                            <button id="searchFlightsBtn" type="submit" class="btn-next">Search Flights</button>
                        </div>
                    </form>
                </section>

                <section id="step4" class="wizard-section">
                    <h3>Step 4: Flight Results</h3>
                    <div id="flightResultsContainer"></div>
                    <div class="wizard-nav">
                        <button id="backToStep3Btn" type="button" class="btn-prev">Previous</button>
                    </div>
                </section>

                <section id="step5" class="wizard-section">
                    <h3>Step 5: Select Your Seats</h3>
                    <div id="seatMapContainer">
                        <p>Seats will be loaded after flight selection.</p>
                    </div>
                    <div class="wizard-nav">
                        <button id="backToStep4Btn" type="button" class="btn-prev">Previous</button>
                        <button id="toStep6Btn" type="button" class="btn-next">Continue to Price Review</button>
                    </div>
                </section>

                <section id="step6" class="wizard-section">
                    <h3>Step 6: Price Review</h3>
                    <div id="priceReviewContainer">
                        <p>Calculating pricing...</p>
                    </div>
                    <div class="wizard-nav">
                        <button id="backToStep5Btn" type="button" class="btn-prev">Previous</button>
                        <button id="toStep7Btn" type="button" class="btn-next">Confirm Booking</button>
                    </div>
                </section>

                <section id="step7" class="wizard-section">
                    <h3>Step 7: Confirm Booking</h3>
                    <div id="bookingConfirmContainer">
                        <p>Preparing booking confirmation...</p>
                    </div>
                    <div class="wizard-nav">
                        <button id="backToStep6Btn" type="button" class="btn-prev">Previous</button>
                        <button id="toStep8Btn" type="button" class="btn-next">Proceed to Payment</button>
                    </div>
                </section>

                <section id="step8" class="wizard-section">
                    <h3>Step 8: Payment</h3>
                    <form id="paymentForm">
                        <div class="form-group">
                            <label>Payment Method</label>
                            <div class="payment-options">
                                <label class="radio-option">
                                    <input type="radio" name="payment_method" value="cash" checked> Cash Payment
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="payment_method" value="card"> Card Payment
                                </label>
                            </div>
                        </div>
                        <div id="cardDetailsContainer" style="display: none;">
                            <div class="form-group">
                                <label for="cardAccountId">Select Card Account</label>
                                <select id="cardAccountId" name="card_account_id">
                                    <option value="">-- Select Card --</option>
                                </select>
                            </div>
                        </div>
                        <div id="paymentSummary">
                            <p>Processing payment...</p>
                        </div>
                        <div class="wizard-nav">
                            <button id="backToStep7Btn" type="button" class="btn-prev">Previous</button>
                            <button id="processPaymentBtn" type="submit" class="btn-primary">Process Payment</button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    `;

    bindReservationEvents();
    showStep(1);
}

function bindReservationEvents() {
    const passportForm = document.getElementById('passportForm');
    if (passportForm) {
        passportForm.addEventListener('submit', handlePassportVerification);
    }

    const passengerForm = document.getElementById('passengerForm');
    if (passengerForm) {
        passengerForm.addEventListener('submit', handlePassengerInfoSubmit);
    }

    const flightSearchForm = document.getElementById('flightSearchForm');
    if (flightSearchForm) {
        flightSearchForm.addEventListener('submit', handleFlightSearchSubmit);
    }

    // Step 4 - Back button
    const backToStep3Btn = document.getElementById('backToStep3Btn');
    if (backToStep3Btn) {
        backToStep3Btn.addEventListener('click', () => showStep(3));
    }

    // Step 5 - Back button and Next button
    const backToStep1Btn = document.getElementById('backToStep1Btn');
    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', () => showStep(1));
    }

    const backToStep2Btn = document.getElementById('backToStep2Btn');
    if (backToStep2Btn) {
        backToStep2Btn.addEventListener('click', () => showStep(2));
    }

    const backToStep4Btn = document.getElementById('backToStep4Btn');
    if (backToStep4Btn) {
        backToStep4Btn.addEventListener('click', () => showStep(4));
    }

    const toStep6Btn = document.getElementById('toStep6Btn');
    if (toStep6Btn) {
        toStep6Btn.addEventListener('click', handleStep5Complete);
    }

    // Step 6 - Back button and Next button
    const backToStep5Btn = document.getElementById('backToStep5Btn');
    if (backToStep5Btn) {
        backToStep5Btn.addEventListener('click', () => showStep(5));
    }

    const toStep7Btn = document.getElementById('toStep7Btn');
    if (toStep7Btn) {
        toStep7Btn.addEventListener('click', handleStep6Complete);
    }

    // Step 7 - Back button and Next button
    const backToStep6Btn = document.getElementById('backToStep6Btn');
    if (backToStep6Btn) {
        backToStep6Btn.addEventListener('click', () => showStep(6));
    }

    const toStep8Btn = document.getElementById('toStep8Btn');
    if (toStep8Btn) {
        toStep8Btn.addEventListener('click', handleStep7Complete);
    }

    // Step 8 - Payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);

        const paymentMethodRadios = paymentForm.querySelectorAll('input[name="payment_method"]');
        paymentMethodRadios.forEach((radio) => {
            radio.addEventListener('change', (e) => {
                reservationState.paymentMethod = e.target.value;
                toggleCardDetailsSection(e.target.value === 'card');
            });
        });
    }

    const backToStep7Btn = document.getElementById('backToStep7Btn');
    if (backToStep7Btn) {
        backToStep7Btn.addEventListener('click', () => showStep(7));
    }
}

function showStep(stepNumber) {
    reservationState.step = stepNumber;

    const sections = document.querySelectorAll('.wizard-section');
    sections.forEach((section) => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`step${stepNumber}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    const stepNodes = document.querySelectorAll('.wizard-step');
    stepNodes.forEach((node) => {
        const nodeStep = Number(node.getAttribute('data-step'));
        node.classList.remove('active');
        if (nodeStep === stepNumber) {
            node.classList.add('active');
        }
        if (nodeStep < stepNumber) {
            node.classList.add('completed');
        } else {
            node.classList.remove('completed');
        }
    });
}

async function handlePassportVerification(event) {
    event.preventDefault();
    clearReservationMessage();

    const passportNoEl = document.getElementById('passportNo');
    const submitBtn = document.getElementById('passportSubmitBtn');

    if (!passportNoEl || !submitBtn) {
        return;
    }

    const passportNo = passportNoEl.value.trim().toUpperCase();
    if (!passportNo) {
        renderReservationMessage('Passport number is required.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';

    try {
        const response = await Passport.verify(passportNo);
        const passportData = response.passport || response.data?.passport;

        if (!passportData) {
            throw new Error('Unexpected passport verification response');
        }

        reservationState.passport = passportData;
        reservationState.passenger.full_name = passportData.full_name || '';

        const passengerName = document.getElementById('passengerName');
        const passengerPassport = document.getElementById('passengerPassport');
        if (passengerName) {
            passengerName.value = passportData.full_name || '';
        }
        if (passengerPassport) {
            passengerPassport.value = passportData.passport_no || passportNo;
        }

        renderReservationMessage('Passport verified successfully.', 'success');
        showStep(2);
    } catch (error) {
        renderReservationMessage(error.message || 'Passport verification failed.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Verify Passport';
    }
}

function handlePassengerInfoSubmit(event) {
    event.preventDefault();
    clearReservationMessage();

    const contactNo = document.getElementById('passengerContact')?.value.trim();
    const email = document.getElementById('passengerEmail')?.value.trim();

    if (!reservationState.passport) {
        renderReservationMessage('Please verify passport first.', 'error');
        showStep(1);
        return;
    }

    if (!contactNo || !email) {
        renderReservationMessage('Contact number and email are required.', 'error');
        return;
    }

    if (typeof isValidEmail === 'function' && !isValidEmail(email)) {
        renderReservationMessage('Please enter a valid email address.', 'error');
        return;
    }

    reservationState.passenger.contact_no = contactNo;
    reservationState.passenger.email = email;

    showStep(3);
}

async function handleFlightSearchSubmit(event) {
    event.preventDefault();
    clearReservationMessage();

    const departureDate = document.getElementById('departureDate')?.value.trim();
    const departureAirport = document.getElementById('departureAirport')?.value.trim().toUpperCase();
    const arrivalAirport = document.getElementById('arrivalAirport')?.value.trim().toUpperCase();
    const searchBtn = document.getElementById('searchFlightsBtn');

    if (!departureDate || !departureAirport || !arrivalAirport) {
        renderReservationMessage('Departure date and airports are required.', 'error');
        return;
    }

    if (departureAirport === arrivalAirport) {
        renderReservationMessage('Departure and arrival airports cannot be the same.', 'error');
        return;
    }

    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
    }

    try {
        reservationState.search = {
            departure_date: departureDate,
            departure_airport: departureAirport,
            arrival_airport: arrivalAirport
        };

        const response = await Flights.search(departureAirport, arrivalAirport, departureDate);
        const flights = response.flights || response.data?.flights || [];

        reservationState.flights = flights;
        renderFlightResults(flights);
        showStep(4);
    } catch (error) {
        renderReservationMessage(error.message || 'Flight search failed.', 'error');
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Search Flights';
        }
    }
}

function renderFlightResults(flights) {
    const container = document.getElementById('flightResultsContainer');
    if (!container) {
        return;
    }

    if (!Array.isArray(flights) || flights.length === 0) {
        container.innerHTML = '<p>No flights found for the selected route/date.</p>';
        return;
    }

    let html = `
        <table class="registry-table">
            <thead>
                <tr>
                    <th>Airline</th>
                    <th>Flight</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Seat Options</th>
                </tr>
            </thead>
            <tbody>
    `;

    flights.forEach((flight) => {
        const airline = escapeHtml(flight.airline?.airline_name || '-');
        const flightNo = escapeHtml(flight.flight_no || '-');
        const route = `${escapeHtml(flight.departure_airport || '-')} -> ${escapeHtml(flight.destination_airport || '-')}`;
        const departure = typeof formatDateTime === 'function' ? formatDateTime(flight.departure_datetime) : escapeHtml(flight.departure_datetime || '-');
        const arrival = typeof formatDateTime === 'function' ? formatDateTime(flight.arrival_datetime) : escapeHtml(flight.arrival_datetime || '-');

        const seatOptions = (flight.seat_categories || [])
            .filter((seat) => Number(seat.available_seats) > 0)
            .map((seat) => {
                const seatCategory = escapeHtml(seat.seat_category || 'Seat');
                const available = Number(seat.available_seats) || 0;
                return `<button class="btn btn-primary" style="margin:0.2rem; padding:0.4rem 0.7rem;" onclick="selectFlight(${Number(flight.flight_id)}, '${encodeURIComponent(seat.seat_category || '')}')">${seatCategory} (${available})</button>`;
            })
            .join('');

        html += `
            <tr>
                <td>${airline}</td>
                <td>${flightNo}</td>
                <td>${route}</td>
                <td>${departure}</td>
                <td>${arrival}</td>
                <td>${seatOptions || 'No seats available'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function selectFlight(flightId, encodedSeatCategory) {
    const seatCategory = decodeURIComponent(encodedSeatCategory || '');
    const flight = reservationState.flights.find((item) => Number(item.flight_id) === Number(flightId));

    if (!flight) {
        renderReservationMessage('Selected flight could not be found.', 'error');
        return;
    }

    reservationState.selectedFlight = {
        flight_id: Number(flightId),
        seat_category: seatCategory
    };

    const flightNo = flight.flight_no || `Flight ${flightId}`;
    renderReservationMessage(`Selected ${flightNo} (${seatCategory}). Proceeding to seat selection...`, 'success');
    
    // Auto-proceed to Step 5
    setTimeout(() => {
        renderSeatMap(flight, seatCategory);
        showStep(5);
    }, 1000);
}

function clearReservationMessage() {
    const messageEl = document.getElementById('reservationMessage');
    if (messageEl) {
        messageEl.innerHTML = '';
    }
}

function renderReservationMessage(message, type) {
    const messageEl = document.getElementById('reservationMessage');
    if (!messageEl) {
        return;
    }

    const className = type === 'success' ? 'success-message' : 'error-message';
    messageEl.innerHTML = `<div class="${className}">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Compatibility hooks (to avoid breaking previous references)
function loadFlightSearchForm() {
    loadReservationWizard();
}

async function searchFlights() {
    return reservationState.flights;
}

function displayFlightResults() {
    renderFlightResults(reservationState.flights);
}

function loadPassengerForm() {
    showStep(2);
}

async function validatePassport() {
    return reservationState.passport;
}

async function calculateBookingPrice() {
    return null;
}

function selectSeats() {}

async function processPayment() {
    return null;
}

async function completeBooking() {
    return null;
}

document.addEventListener('DOMContentLoaded', initReservation);

window.initReservation = initReservation;
window.loadReservationWizard = loadReservationWizard;
window.loadFlightSearchForm = loadFlightSearchForm;
window.searchFlights = searchFlights;
window.displayFlightResults = displayFlightResults;
window.selectFlight = selectFlight;
window.loadPassengerForm = loadPassengerForm;
window.validatePassport = validatePassport;
window.calculateBookingPrice = calculateBookingPrice;
window.selectSeats = selectSeats;
window.processPayment = processPayment;
window.completeBooking = completeBooking;
