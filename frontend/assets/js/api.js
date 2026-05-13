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
            }
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
        const params = new URLSearchParams({
            departure_airport: departureAirport,
            arrival_airport: arrivalAirport,
            departure_date: departureDate
        });
        return apiCall(`/flights/search.php?${params}`, 'GET');
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
        return apiCall('/bookings/cancel.php', 'POST', { booking_id: bookingId });
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
        const params = new URLSearchParams({ passport_no: passportNo });
        return apiCall(`/bookings/verify-passport.php?${params}`, 'GET');
    }
};

/**
 * Price Calculation API Calls
 */
const Pricing = {
    async calculate(flightId, seatCategoryId, passengerCount = 1) {
        const params = new URLSearchParams({
            flight_id: flightId,
            seat_category_id: seatCategoryId,
            passenger_count: passengerCount
        });
        return apiCall(`/bookings/calculate-price.php?${params}`, 'GET');
    }
};

/**
 * Payment API Calls
 */
const Payments = {
    async processCash(bookingId, agencyId) {
        return apiCall('/payments/process-cash.php', 'POST', {
            booking_id: bookingId,
            agency_id: agencyId
        });
    },

    async processCard(bookingId, agencyId, cardAccountId) {
        return apiCall('/payments/process-card.php', 'POST', {
            booking_id: bookingId,
            agency_id: agencyId,
            card_account_id: cardAccountId
        });
    },

    async refund(bookingId) {
        return apiCall('/payments/refund.php', 'POST', { booking_id: bookingId });
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
