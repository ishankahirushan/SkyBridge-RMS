// SkyBridge RMS - API Communication

const API_BASE = 'http://localhost:8000/backend';

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const url = `${API_BASE}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Accept': 'application/json'
            },
            // Ensure cookies (PHPSESSID) are sent/received for same-origin requests
            credentials: 'same-origin'
        };

        if (data && method !== 'GET' && method !== 'HEAD') {
            const formData = new URLSearchParams();

            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value);
                }
            });

            options.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            options.body = formData.toString();
        }

        const response = await fetch(url, options);
            const result = await response.json();

            // Normalize legacy top-level `user` to `data.user` to maintain a
            // consistent response shape across endpoints.
            if (result && result.user && !result.data) {
                result.data = { user: result.user };
            }

        // Check for API errors
        if (result.status === 'error') {
            throw new Error(result.message || 'API Error');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Authentication API Calls
 */
const Auth = {
    async login(email, password) {
        return apiCall('/auth/login.php', 'POST', { email, password });
    },

    async logout() {
        return apiCall('/auth/logout.php', 'POST');
    },

    async checkSession() {
        try {
            return await apiCall('/auth/session.php', 'GET');
        } catch (error) {
            return null;
        }
    }
};

/**
 * Flights API Calls
 */
const Flights = {
    async search(departureAirport, arrivalAirport, departureDate) {
        return apiCall('/flights/search.php', 'POST', {
            departure_airport: departureAirport,
            arrival_airport: arrivalAirport,
            departure_date: departureDate
        });
    },

    async getDetails(flightId) {
        return apiCall(`/flights/get-flight.php?flight_id=${flightId}`, 'GET');
    }
};

/**
 * Bookings API Calls
 */
const Bookings = {
    async create(bookingData) {
        return apiCall('/bookings/create.php', 'POST', bookingData);
    },

    async list(limit = 10, offset = 0) {
        const params = new URLSearchParams({ limit, offset });
        return apiCall(`/bookings/list.php?${params}`, 'GET');
    },

    async getDetails(bookingId) {
        return apiCall(`/bookings/get.php?booking_id=${bookingId}`, 'GET');
    },

    async cancel(bookingId) {
        // Backend expects `booking_ref` in POST body
        return apiCall('/bookings/cancel.php', 'POST', { booking_ref: bookingId });
    },

    async searchByReference(bookingRef) {
        const params = new URLSearchParams({ booking_ref: bookingRef });
        return apiCall(`/bookings/search.php?${params}`, 'GET');
    }
};

/**
 * Passport Verification API Calls
 */
const Passport = {
    async verify(passportNo) {
        return apiCall('/bookings/verify-passport.php', 'POST', {
            passport_no: passportNo
        });
    }
};

/**
 * Price Calculation API Calls
 */
const Pricing = {
    async calculate(flightId, seatCategory, discount = 0) {
        return apiCall('/bookings/calculate-price.php', 'POST', {
            flight_id: flightId,
            seat_category: seatCategory,
            discount: discount
        });
    }
};

/**
 * Payment API Calls
 */
const Payments = {
    async processCash(passportNo, contactNo, email, flightId, seatCategory, amount, discount = 0) {
        return apiCall('/payments/process-cash.php', 'POST', {
            passport_no: passportNo,
            contact_no: contactNo,
            email: email,
            flight_id: flightId,
            seat_category: seatCategory,
            amount: amount,
            discount: discount
        });
    },

    async processCard(passportNo, contactNo, email, flightId, seatCategory, cardNo, companyAccountNo, amount, discount = 0) {
        return apiCall('/payments/process-card.php', 'POST', {
            passport_no: passportNo,
            contact_no: contactNo,
            email: email,
            flight_id: flightId,
            seat_category: seatCategory,
            card_no: cardNo,
            company_account_no: companyAccountNo,
            amount: amount,
            discount: discount
        });
    },

    async refund(bookingId) {
        // Backend expects `booking_ref` in POST body
        return apiCall('/payments/refund.php', 'POST', { booking_ref: bookingId });
    }
};

/**
 * Agent Reports API Calls
 */
const Reports = {
    async dashboard() {
        return apiCall('/reports/dashboard.php', 'GET');
    }
};

/**
 * Admin API Calls
 */
const Admin = {
    // Airlines
    airlines: {
        async list() {
            return apiCall('/admin/airlines/list.php', 'GET');
        },

        async create(airlineData) {
            return apiCall('/admin/airlines/create.php', 'POST', airlineData);
        },

        async update(airlineId, airlineData) {
            return apiCall('/admin/airlines/update.php', 'POST', {
                airline_id: airlineId,
                ...airlineData
            });
        }
    },

    // Agents
    agents: {
        async list() {
            return apiCall('/admin/agents/list.php', 'GET');
        },

        async create(agentData) {
            return apiCall('/admin/agents/create.php', 'POST', agentData);
        },

        async update(agentId, agentData) {
            return apiCall('/admin/agents/update.php', 'POST', {
                agent_id: agentId,
                ...agentData
            });
        }
    },

    // Reports
    reports: {
        async revenue(startDate, endDate) {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            return apiCall(`/admin/reports/revenue.php?${params}`, 'GET');
        },

        async bookingStats(startDate, endDate) {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            return apiCall(`/admin/reports/bookings.php?${params}`, 'GET');
        }
    }
};
