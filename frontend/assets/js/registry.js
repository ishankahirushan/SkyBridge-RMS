// SkyBridge RMS - Registry Module

function initRegistry() {
    console.info('Registry module loaded');
    // Dashboard controls when to render the registry tab.
}

async function loadBookingsList() {
    try {
        const resp = await Bookings.list(50, 0);
        // Support multiple shapes: {bookings:[...]}, {data:{bookings:[...]}}, {data:[...]}
        if (!resp) return [];
        if (Array.isArray(resp.bookings)) return resp.bookings;
        if (resp.data && Array.isArray(resp.data.bookings)) return resp.data.bookings;
        if (resp.data && Array.isArray(resp.data)) return resp.data;
        if (Array.isArray(resp)) return resp;
        return [];
    } catch (e) {
        console.error('Failed to load bookings', e);
        return [];
    }
}

function displayBookingsTable() {}

function filterBookings() {}

async function searchBookings() {
    return [];
}

async function viewBookingDetails() {
    return null;
}

async function updateBookingStatus() {
    return null;
}

function showRegistryMessage(msg, type = 'info') {
    const container = document.getElementById('registryMessage');
    if (!container) return;
    container.innerHTML = `<div class="${type}-message">${escapeHtml(msg)}</div>`;
}

async function processRefund(booking) {
    if (!booking) return;
    const bookingRef = booking.booking_ref ?? booking.bookingRef ?? '';
    if (!bookingRef) {
        showRegistryMessage('Booking reference not found for refund.', 'error');
        return;
    }

    if (!confirm(`Confirm cancellation and refund for ${bookingRef}?`)) return;

    try {
        showRegistryMessage('Processing refund...', 'info');

        // Use Payments.refund for bookings that are paid, otherwise use Bookings.cancel
        const isPaid = String((booking.payment_status || booking.paymentStatus || '')).toLowerCase() === 'paid';
        if (isPaid) {
            await Payments.refund(bookingRef);
        } else {
            await Bookings.cancel(bookingRef);
        }

        showRegistryMessage('Refund / cancellation processed successfully.', 'success');
        // Refresh table
        await loadAndRenderBookings();
    } catch (e) {
        console.error('Refund failed', e);
        showRegistryMessage(e.message || 'Refund failed.', 'error');
    }
}

async function loadAndRenderBookings() {
    const bookings = await loadBookingsList();
    const container = document.getElementById('registryContent');
    if (!container) return;
    const messageEl = document.createElement('div');
    messageEl.id = 'registryMessage';
    container.innerHTML = '';
    container.appendChild(messageEl);

    if (!bookings || bookings.length === 0) {
        container.innerHTML += '<p>No bookings found.</p>';
        return;
    }

    let html = `<table class="bookings-table" style="width:100%; border-collapse: collapse;">
        <thead>
            <tr style="text-align:left; border-bottom:1px solid #ddd;">
                <th>Booking Ref</th>
                <th>Passenger</th>
                <th>Flight</th>
                <th>Seat Category</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;

    const session = getCurrentUser();
    const isAgentUser = session && session.role === 'agent';
    const sessionAgentId = Number((session && (session.agent_id || session.agentId)) || 0);

    bookings.forEach(b => {
        const bookingRef = escapeHtml(b.booking_ref || b.bookingRef || 'N/A');
        const passenger = escapeHtml((b.passenger && (b.passenger.name || b.passenger.full_name)) || b.passenger_name || b.passengerName || 'N/A');
        const flight = escapeHtml(b.flight_no || (b.flight && b.flight.flight_no) || b.flight_id || 'N/A');
        const seat = escapeHtml(b.seat_category || b.seatCategory || 'N/A');
        const method = escapeHtml(b.payment_method || (b.passenger && b.passenger.payment_method) || b.paymentMethod || 'N/A');
        const amount = Number(b.final_price ?? b.amount ?? 0).toFixed(2);
        const statusValue = String(b.booking_status || b.status || 'N/A');
        const status = escapeHtml(statusValue);
        const paymentStatusValue = String(b.payment_status || b.paymentStatus || '');

        const ownerId = Number(b.agent_id ?? b.agentId ?? 0);
        const canCancel = statusValue.toLowerCase() === 'active' && (!isAgentUser || ownerId === sessionAgentId);

        html += `<tr style="border-bottom:1px solid #f1f1f1;">
            <td>${bookingRef}</td>
            <td>${passenger}</td>
            <td>${flight}</td>
            <td>${seat}</td>
            <td>${method}</td>
            <td>LKR ${amount}</td>
            <td>${status}</td>
            <td>`;

        if (canCancel) {
            html += `<button class="btn-cancel" data-booking-ref="${bookingRef}" data-booking-status="${escapeHtml(statusValue)}" data-payment-status="${escapeHtml(paymentStatusValue)}" data-agent-id="${ownerId}">Cancel</button>`;
        } else {
            html += `<span style="color:#666;">-</span>`;
        }

        html += `</td></tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML += html;

    // Attach cancel handlers
    container.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            const bookingRef = btn.getAttribute('data-booking-ref') || '';
            const bookingStatus = btn.getAttribute('data-booking-status') || '';
            const paymentStatus = btn.getAttribute('data-payment-status') || '';
            const agentId = btn.getAttribute('data-agent-id') || '';

            processRefund({
                booking_ref: bookingRef,
                booking_status: bookingStatus,
                payment_status: paymentStatus,
                agent_id: agentId,
            });
        });
    });
}

function generateReceipt() {}

function downloadReceiptPDF() {}

function printReceipt() {}

document.addEventListener('DOMContentLoaded', initRegistry);

window.initRegistry = initRegistry;
window.loadBookingsList = loadBookingsList;
window.displayBookingsTable = displayBookingsTable;
window.filterBookings = filterBookings;
window.searchBookings = searchBookings;
window.viewBookingDetails = viewBookingDetails;
window.updateBookingStatus = updateBookingStatus;
window.processRefund = processRefund;
window.generateReceipt = generateReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.printReceipt = printReceipt;
