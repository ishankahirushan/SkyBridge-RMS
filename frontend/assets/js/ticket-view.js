// Ticket search form submission
// Check for URL parameters on page load
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingRef = urlParams.get('booking_ref');
  const passportNo = urlParams.get('passport_no');
  
  if (bookingRef && passportNo) {
    // Auto-populate form
    document.getElementById('bookingRef').value = bookingRef;
    document.getElementById('passportNo').value = passportNo;
    
    // Auto-search after a short delay
    setTimeout(() => {
      performTicketSearch(bookingRef, passportNo);
    }, 500);
  }
});

// Ticket search form submission
document.getElementById('ticketSearchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bookingRef = document.getElementById('bookingRef').value.trim();
  const passportNo = document.getElementById('passportNo').value.trim();
  
  if (!bookingRef || !passportNo) {
    showMessage('Please enter both booking reference and passport number', 'error');
    return;
  }
  
  performTicketSearch(bookingRef, passportNo);
});

async function performTicketSearch(bookingRef, passportNo) {
  showMessage('Searching for your ticket...', 'info');
  
  try {
    // Fetch ticket data
    const response = await fetch(`../../backend/bookings/get_ticket.php?booking_ref=${encodeURIComponent(bookingRef)}&passport_no=${encodeURIComponent(passportNo)}`);
    
    const data = await response.json();
    
    if (data.status === 'success') {
      displayTicket(data.ticket);
      showMessage('', '');
    } else {
      showMessage('✗ ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Ticket retrieval error:', error);
    showMessage('Server error: ' + error.message, 'error');
  }
}

function displayTicket(ticket) {
  const ticketDisplay = document.getElementById('ticketDisplay');
  
  // Format dates
  const departureDate = new Date(ticket.flight.departure.datetime);
  const arrivalDate = new Date(ticket.flight.arrival.datetime);
  
  const departureTime = departureDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const arrivalTime = arrivalDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const departureDate_str = departureDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const arrivalDate_str = arrivalDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  // Calculate duration
  const durationMs = arrivalDate - departureDate;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  const html = `
    <div class="ticket-header">
      <div class="ticket-number">Ticket #${ticket.ticket_no}</div>
      <div class="ticket-status">✓ CONFIRMED</div>
    </div>

    <div class="ticket-grid">
      <!-- Passenger Info -->
      <div class="ticket-block">
        <h3>Passenger</h3>
        <p><strong>${ticket.passenger.name}</strong></p>
        <p>Passport: ${ticket.passenger.passport_no}</p>
        <p>Email: ${ticket.passenger.email}</p>
        <p>Contact: ${ticket.passenger.contact}</p>
      </div>

      <!-- Booking Info -->
      <div class="ticket-block">
        <h3>Booking Details</h3>
        <p>Booking Reference: <strong>${ticket.booking_ref}</strong></p>
        <p>Seat: <strong>${ticket.booking.seat}</strong></p>
        <p>Booking Date: ${new Date(ticket.booking.booking_date).toLocaleDateString()}</p>
        <p>Status: <strong>${ticket.booking.booking_status}</strong></p>
      </div>

      <!-- Flight Information -->
      <div class="flight-info">
        <h3>Flight Details</h3>
        <div class="flight-header">
          <div class="airport-info">
            <div class="airport-code">${ticket.flight.departure.airport}</div>
            <div class="airport-name">Departure</div>
          </div>
          <div class="flight-arrow">→</div>
          <div class="airport-info">
            <div class="airport-code">${ticket.flight.arrival.airport}</div>
            <div class="airport-name">Arrival</div>
          </div>
        </div>

        <p style="text-align: center; margin-bottom: 15px;">
          <strong>${ticket.flight.airline}</strong> (${ticket.flight.airline_code})<br/>
          Flight ${ticket.flight.flight_no}
        </p>

        <div class="flight-times">
          <div class="time-info">
            <div class="time">${departureTime}</div>
            <div class="time-label">${departureDate_str}</div>
          </div>
          <div class="time-info">
            <div class="time">${arrivalTime}</div>
            <div class="time-label">${arrivalDate_str}</div>
          </div>
        </div>
        
        <p style="text-align: center; margin-top: 15px; color: #4b5563;">
          Duration: ${hours}h ${minutes}m
        </p>
      </div>

      <!-- Price Breakdown -->
      <div class="price-breakdown">
        <h3>Price Breakdown</h3>
        <div class="price-row">
          <span>Base Fare:</span>
          <span>$${ticket.booking.base_price}</span>
        </div>
        <div class="price-row">
          <span>Service Charge:</span>
          <span>+$${ticket.booking.service_charge}</span>
        </div>
        ${ticket.booking.discount !== '0.00' ? `
        <div class="price-row">
          <span>Discount:</span>
          <span>-$${ticket.booking.discount}</span>
        </div>
        ` : ''}
        <div class="price-row total">
          <span>Total Amount:</span>
          <span>$${ticket.booking.final_price}</span>
        </div>
      </div>
    </div>

    <div class="ticket-actions">
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print Ticket</button>
      <button class="btn btn-secondary" onclick="downloadTicketPDF('${ticket.booking_ref}')">⬇️ Download PDF</button>
      <button class="btn btn-secondary" onclick="location.reload()">↻ Search Another</button>
    </div>
  `;
  
  ticketDisplay.innerHTML = html;
  ticketDisplay.classList.add('active');
  window.scrollTo(0, ticketDisplay.offsetTop - 100);
}

function showMessage(message, type) {
  const messageBox = document.getElementById('searchMessage');
  
  if (!message) {
    messageBox.classList.remove('show', 'error', 'success', 'info');
    return;
  }
  
  messageBox.textContent = message;
  messageBox.className = 'message-box ' + type + ' show';
  
  if (type === 'error') {
    setTimeout(() => {
      messageBox.classList.remove('show');
    }, 5000);
  }
}

function downloadTicketPDF(bookingRef) {
  // For now, trigger print dialog as PDF export
  // In a real system, this would call a PDF generation endpoint
  alert('PDF download feature will be implemented with a backend PDF generation service.');
  // Example: fetch(`../../backend/bookings/generate_pdf.php?booking_ref=${bookingRef}`)
}
