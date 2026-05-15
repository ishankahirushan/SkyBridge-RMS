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
                                        <label for="cardNoInput">Card Number (enter manually)</label>
                                        <input id="cardNoInput" name="card_no" type="text" placeholder="Enter full card number" autocomplete="cc-number">
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
                if (e.target.value === 'card') {
                    loadCardAccounts();
                }
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
    // Placeholder for backwards compatibility
    return reservationState.pricing;
}

// ===== Step 5: Seat Selection =====
function renderSeatMap(flight, seatCategory) {
    const container = document.getElementById('seatMapContainer');
    if (!container) return;

    // Find seat category details
    const seatCategoryObj = (flight.seat_categories || []).find(
        (s) => s.seat_category === seatCategory
    );

    if (!seatCategoryObj) {
        container.innerHTML = '<p>Seat category not found.</p>';
        return;
    }

    const availableSeats = Number(seatCategoryObj.available_seats) || 0;
    const totalSeats = Number(seatCategoryObj.total_seats) || 1;
    const occupiedSeats = totalSeats - availableSeats;

    // Create a simple seat grid (6 columns, calculate rows)
    const cols = 6;
    const rows = Math.ceil(totalSeats / cols);
    let html = `<div class="seat-selection-info">
        <p><strong>Flight:</strong> ${escapeHtml(flight.flight_no || 'N/A')} | 
           <strong>Seat Category:</strong> ${escapeHtml(seatCategory)} | 
           <strong>Available:</strong> ${availableSeats}/${totalSeats}</p>
    </div>
    <div class="seat-map" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 8px; max-width: 400px;">`;

    for (let i = 1; i <= totalSeats; i++) {
        const seatId = `${seatCategory.charAt(0)}${i}`;
        const isOccupied = i > availableSeats;
        const isSelected = reservationState.selectedSeats.includes(seatId);
        const seatClass = isOccupied ? 'occupied' : isSelected ? 'selected' : 'available';

        html += `<button type="button" class="seat seat-${seatClass}" 
                    id="seat-${seatId}" 
                    onclick="toggleSeatSelection('${seatId}', ${isOccupied})"
                    ${isOccupied ? 'disabled' : ''}
                    style="padding: 10px; border: 1px solid #ccc; cursor: ${isOccupied ? 'not-allowed' : 'pointer'}; 
                           background: ${isOccupied ? '#ddd' : isSelected ? '#4CAF50' : '#fff'}; 
                           color: ${isOccupied ? '#999' : '#000'};">
                    ${seatId}
                </button>`;
    }

    html += '</div><div style="margin-top: 15px;"><p><strong>Selected Seats:</strong> ' +
            (reservationState.selectedSeats.length > 0 ? reservationState.selectedSeats.join(', ') : 'None') +
            '</p></div>';

    container.innerHTML = html;
}

function toggleSeatSelection(seatId, isOccupied) {
    if (isOccupied) {
        renderReservationMessage('This seat is not available.', 'error');
        return;
    }

    const index = reservationState.selectedSeats.indexOf(seatId);
    if (index > -1) {
        reservationState.selectedSeats.splice(index, 1);
    } else {
        // Only allow one seat per passenger for now
        reservationState.selectedSeats = [seatId];
    }

    // Re-render seat map to show updated selection
    if (reservationState.selectedFlight) {
        const flight = reservationState.flights.find(
            (f) => Number(f.flight_id) === reservationState.selectedFlight.flight_id
        );
        if (flight) {
            renderSeatMap(flight, reservationState.selectedFlight.seat_category);
        }
    }
}

async function handleStep5Complete() {
    if (reservationState.selectedSeats.length === 0) {
        renderReservationMessage('Please select at least one seat.', 'error');
        return;
    }

    renderReservationMessage('Proceeding to price calculation...', 'success');
    setTimeout(() => {
        loadPricingReview();
    }, 500);
}

// ===== Step 6: Price Review =====
async function loadPricingReview() {
    const container = document.getElementById('priceReviewContainer');
    if (!container) return;

    if (!reservationState.selectedFlight) {
        container.innerHTML = '<p>No flight selected.</p>';
        return;
    }

    container.innerHTML = '<p>Calculating pricing...</p>';

    try {
        const currentDiscount = Number(reservationState.pricing?.discount || 0);
        const response = await Pricing.calculate(
            reservationState.selectedFlight.flight_id,
            reservationState.selectedFlight.seat_category,
            currentDiscount
        );

        const pricing = response.data || response;
        reservationState.pricing = pricing;

        const priceData = {
            basePrice: pricing.base_price || 0,
            seatMultiplier: pricing.seat_multiplier || 1,
            serviceCharge: pricing.service_charge || 0,
            discount: pricing.discount || 0,
            finalPrice: pricing.final_price || 0
        };

        const flight = reservationState.flights.find(
            (f) => Number(f.flight_id) === reservationState.selectedFlight.flight_id
        );

        let html = `<div class="price-review">
            <h4>Booking Summary</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Flight:</strong></td>
                        <td>${escapeHtml(flight ? flight.flight_no : 'N/A')}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Route:</strong></td>
                        <td>${escapeHtml(reservationState.search.departure_airport)} → ${escapeHtml(reservationState.search.arrival_airport)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Seat Category:</strong></td>
                        <td>${escapeHtml(reservationState.selectedFlight.seat_category)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Selected Seats:</strong></td>
                        <td>${escapeHtml(reservationState.selectedSeats.join(', '))}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Passenger:</strong></td>
                        <td>${escapeHtml(reservationState.passenger.full_name)}</td>
                    </tr>
                </tbody>
            </table>
            
            <h4 style="margin-top: 20px;">Price Breakdown</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Base Ticket Price:</strong></td>
                        <td>LKR ${Number(priceData.basePrice).toFixed(2)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Seat Category Multiplier:</strong></td>
                        <td>${Number(priceData.seatMultiplier).toFixed(2)}x</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Subtotal (Base × Multiplier):</strong></td>
                        <td>LKR ${Number(priceData.basePrice * priceData.seatMultiplier).toFixed(2)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Service Charge:</strong></td>
                        <td>LKR ${Number(priceData.serviceCharge).toFixed(2)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Discount:</strong></td>
                        <td>
                            <input id="discountInput" type="number" min="0" step="0.01" value="${Number(priceData.discount).toFixed(2)}" style="width:120px; padding:4px;" />
                            <button id="applyDiscountBtn" style="margin-left:8px;">Apply</button>
                        </td>
                    </tr>
                    <tr style="background-color: #f9f9f9; border-bottom: 2px solid #333;">
                        <td><strong>TOTAL PRICE:</strong></td>
                        <td><strong>LKR ${Number(priceData.finalPrice).toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>`;

        container.innerHTML = html;
        showStep(6);
        // Attach discount handler
        const applyBtn = container.querySelector('#applyDiscountBtn');
        const discountInput = container.querySelector('#discountInput');
        if (applyBtn && discountInput) {
            applyBtn.addEventListener('click', async () => {
                const val = parseFloat(discountInput.value || '0');
                if (isNaN(val) || val < 0) {
                    renderReservationMessage('Please enter a valid discount amount.', 'error');
                    return;
                }
                renderReservationMessage('Applying discount...', 'success');
                try {
                    const resp = await Pricing.calculate(reservationState.selectedFlight.flight_id, reservationState.selectedFlight.seat_category, val);
                    const pricing = resp.data || resp;
                    reservationState.pricing = pricing;
                    // re-render price review with updated pricing (recursive)
                    loadPricingReview();
                } catch (e) {
                    renderReservationMessage(e.message || 'Failed to apply discount.', 'error');
                }
            });
        }
    } catch (error) {
        renderReservationMessage(error.message || 'Failed to calculate pricing.', 'error');
        container.innerHTML = '<p>Error calculating pricing. Please try again.</p>';
    }
}

async function handleStep6Complete() {
    if (!reservationState.pricing) {
        renderReservationMessage('Pricing information not available.', 'error');
        return;
    }

    renderReservationMessage('Creating booking...', 'success');
    setTimeout(() => {
        loadBookingConfirmation();
    }, 500);
}

// ===== Step 7: Booking Creation =====
async function loadBookingConfirmation() {
    const container = document.getElementById('bookingConfirmContainer');
    if (!container) return;

    const bookingDraft = {
        booking_ref: '',
        booking_status: 'pending payment',
        flight_id: reservationState.selectedFlight.flight_id,
        seat_category: reservationState.selectedFlight.seat_category,
        passenger: {
            full_name: reservationState.passenger.full_name,
            contact_no: reservationState.passenger.contact_no,
            email: reservationState.passenger.email,
            passport_no: reservationState.passport.passport_no
        },
        payment_method: reservationState.paymentMethod || 'cash',
        base_price: reservationState.pricing.base_price || 0,
        service_charge: reservationState.pricing.service_charge || 0,
        discount: reservationState.pricing.discount || 0,
        final_price: reservationState.pricing.final_price || 0
    };

    reservationState.booking = bookingDraft;

    const html = `<div class="booking-confirmation">
        <div style="padding: 20px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="color: #856404; margin: 0;">Review and confirm payment</h4>
            <p style="color: #856404; margin: 10px 0 0 0;">The booking will be created when payment is processed.</p>
        </div>

        <h4>Booking Details</h4>
        <table style="width: 100%; border-collapse: collapse;">
            <tbody>
                <tr style="border-bottom: 1px solid #eee;">
                    <td><strong>Flight:</strong></td>
                    <td>Flight ${bookingDraft.flight_id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td><strong>Seat Category:</strong></td>
                    <td>${escapeHtml(bookingDraft.seat_category)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td><strong>Passenger:</strong></td>
                    <td>${escapeHtml(bookingDraft.passenger.full_name)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td><strong>Contact:</strong></td>
                    <td>${escapeHtml(bookingDraft.passenger.contact_no)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                    <td><strong>Email:</strong></td>
                    <td>${escapeHtml(bookingDraft.passenger.email)}</td>
                </tr>
                <tr style="border-bottom: 2px solid #333;">
                    <td><strong>Total Price:</strong></td>
                    <td><strong>LKR ${Number(bookingDraft.final_price).toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>

        <p style="margin-top: 20px; color: #666;"><em>Proceed to payment to create the booking and finalize the reservation.</em></p>
    </div>`;

    container.innerHTML = html;
    showStep(7);
}

async function handleStep7Complete() {
    if (!reservationState.booking) {
        renderReservationMessage('Booking not found.', 'error');
        return;
    }

    renderReservationMessage('Preparing payment...', 'success');
    setTimeout(() => {
        loadPaymentPage();
    }, 500);
}

// ===== Step 8: Payment =====
async function loadPaymentPage() {
    const summaryContainer = document.getElementById('paymentSummary');
    if (summaryContainer && reservationState.booking) {
        summaryContainer.innerHTML = `<p><strong>Booking Reference:</strong> ${escapeHtml(reservationState.booking.booking_ref)}</p>
            <p><strong>Amount Due:</strong> LKR ${Number(reservationState.booking.final_price || 0).toFixed(2)}</p>`;
    }

    // Load card accounts if payment method is card
    if (reservationState.paymentMethod === 'card') {
        await loadCardAccounts();
    }

    showStep(8);
}

async function loadCardAccounts() {
    const cardSelect = document.getElementById('cardAccountId');
    if (!cardSelect) return;

    try {
        cardSelect.innerHTML = '<option value="">-- Select Card --</option>';
        cardSelect.innerHTML += '<option value="4532123456789012">MasterCard ••••9012</option>';
        cardSelect.innerHTML += '<option value="4532123456789013">Visa ••••9013</option>';
        cardSelect.innerHTML += '<option value="4532123456789014">Visa ••••9014</option>';
        cardSelect.innerHTML += '<option value="4532123456789015">MasterCard ••••9015</option>';
    } catch (error) {
        cardSelect.innerHTML = '<option value="">Error loading cards</option>';
    }
}

function toggleCardDetailsSection(show) {
    const cardSection = document.getElementById('cardDetailsContainer');
    if (cardSection) {
        cardSection.style.display = show ? 'block' : 'none';
    }
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    clearReservationMessage();

    if (!reservationState.booking) {
        renderReservationMessage('Booking not found.', 'error');
        return;
    }

    const processBtn = document.getElementById('processPaymentBtn');
    if (processBtn) {
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';
    }

    try {
        let response;
        const bookingAmount = Number(reservationState.booking.final_price || 0);
        const bookingDiscount = Number(reservationState.pricing.discount || 0);
        const companyAccountNo = 'ACC-001-2026';

        if (reservationState.paymentMethod === 'cash') {
            response = await Payments.processCash(
                reservationState.passport.passport_no,
                reservationState.passenger.contact_no,
                reservationState.passenger.email,
                reservationState.selectedFlight.flight_id,
                reservationState.selectedFlight.seat_category,
                bookingAmount,
                bookingDiscount
            );
        } else {
            const cardNo = document.getElementById('cardNoInput')?.value?.replace(/\s+/g, '') || '';
            if (!cardNo) {
                renderReservationMessage('Please enter a card number.', 'error');
                return;
            }
            if (!/^\d{13,19}$/.test(cardNo)) {
                renderReservationMessage('Card number must be numeric and 13–19 digits.', 'error');
                return;
            }
            response = await Payments.processCard(
                reservationState.passport.passport_no,
                reservationState.passenger.contact_no,
                reservationState.passenger.email,
                reservationState.selectedFlight.flight_id,
                reservationState.selectedFlight.seat_category,
                cardNo,
                companyAccountNo,
                bookingAmount,
                bookingDiscount
            );
        }

        const paymentData = response.data || response;
        renderReservationMessage('Payment processed successfully! Booking is confirmed.', 'success');

        // Show completion page
        setTimeout(() => {
            showCompletionPage(paymentData);
        }, 1500);
    } catch (error) {
        renderReservationMessage(error.message || 'Payment processing failed.', 'error');
    } finally {
        if (processBtn) {
            processBtn.disabled = false;
            processBtn.textContent = 'Process Payment';
        }
    }
}

function showCompletionPage(paymentData) {
    const contentArea = document.getElementById('content');
    if (!contentArea) return;

    const booking = reservationState.booking || {};
    const bookingRef = paymentData.booking_ref || booking.booking_ref || 'N/A';
    const totalAmount = paymentData.calculated_amount ?? booking.final_price ?? 0;
    const html = `<div class="reservation-complete" style="padding: 40px; text-align: center;">
        <div style="padding: 30px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; margin-bottom: 30px;">
            <h2 style="color: #155724; margin: 0;">✓ Booking Complete!</h2>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 5px; max-width: 600px; margin: 0 auto; text-align: left;">
            <h3>Booking Confirmation</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Booking Reference:</strong></td>
                        <td>${escapeHtml(bookingRef)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Passenger:</strong></td>
                        <td>${escapeHtml(booking.passenger?.full_name || reservationState.passenger.full_name)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Email:</strong></td>
                        <td>${escapeHtml(booking.passenger?.email || reservationState.passenger.email)}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Flight:</strong></td>
                        <td>Flight ${booking.flight_id || reservationState.selectedFlight?.flight_id || 'N/A'}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Seat Category:</strong></td>
                        <td>${escapeHtml(booking.seat_category || reservationState.selectedFlight?.seat_category || 'N/A')}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Total Amount Paid:</strong></td>
                        <td><strong>LKR ${Number(totalAmount).toFixed(2)}</strong></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td><strong>Payment Method:</strong></td>
                        <td>${reservationState.paymentMethod === 'cash' ? 'Cash Payment' : 'Card Payment'}</td>
                    </tr>
                    <tr>
                        <td><strong>Booking Date:</strong></td>
                        <td>${new Date().toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
            
            <p style="margin-top: 30px; color: #666; text-align: center;">
                <em>A confirmation email has been sent to ${escapeHtml(booking.passenger.email)}</em>
            </p>
        </div>
        
        <div style="margin-top: 30px;">
            <button class="btn btn-primary" onclick="window.location.href='dashboard.html?view=registry'" style="padding: 12px 30px; font-size: 16px;">
                View Bookings
            </button>
        </div>
    </div>`;

    contentArea.innerHTML = html;
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
window.reservationState = reservationState;
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
