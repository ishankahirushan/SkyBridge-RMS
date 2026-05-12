function rowTemplate(booking) {
  return `
    <tr>
      <td>${booking.booking_ref}</td>
      <td>${booking.passenger_name} (${booking.passport_no})</td>
      <td>${booking.flight_no}</td>
      <td>${booking.departure_airport} -> ${booking.destination_airport}</td>
      <td>${booking.seat_no}</td>
      <td>${money(booking.final_price)}</td>
      <td>${pill(booking.booking_status)}</td>
      <td>${pill(booking.payment_status)}</td>
      <td><button class="warning" data-cancel="${booking.booking_ref}">Cancel</button></td>
    </tr>
  `;
}

async function loadBookings() {
  const message = document.getElementById('bookings-message');
  const ref = document.getElementById('search-booking-ref').value.trim();
  const params = ref ? `?booking_ref=${encodeURIComponent(ref)}` : '';

  try {
    const data = await fetchJson(`../../backend/bookings/list.php${params}`);
    document.getElementById('bookings-body').innerHTML = data.bookings.map(rowTemplate).join('');
    message.textContent = `${data.bookings.length} bookings loaded.`;
  } catch (error) {
    message.textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const message = document.getElementById('bookings-message');

  try {
    await ensureAgentSession();
    bindLogout();

    document.getElementById('create-booking-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        passport_no: document.getElementById('booking-passport').value.trim(),
        flight_id: Number(document.getElementById('booking-flight-id').value),
        seat_no: document.getElementById('booking-seat').value.trim(),
        service_charge: Number(document.getElementById('booking-service').value || 0),
        discount: Number(document.getElementById('booking-discount').value || 0)
      };

      try {
        const data = await fetchJson('../../backend/bookings/create.php', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        message.textContent = `${data.message} Ref: ${data.booking_ref} | Final: ${money(data.final_price)}`;
        await loadBookings();
      } catch (error) {
        message.textContent = error.message;
      }
    });

    document.getElementById('search-booking-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      await loadBookings();
    });

    document.getElementById('bookings-body').addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-cancel]');
      if (!button) {
        return;
      }

      try {
        await fetchJson('../../backend/bookings/cancel.php', {
          method: 'POST',
          body: JSON.stringify({ booking_ref: button.dataset.cancel })
        });
        await loadBookings();
      } catch (error) {
        message.textContent = error.message;
      }
    });

    await loadBookings();
  } catch (error) {
    message.textContent = error.message;
  }
});
