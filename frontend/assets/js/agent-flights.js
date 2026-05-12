async function searchFlights() {
  const form = document.getElementById('flight-search-form');
  const tbody = document.getElementById('flights-body');
  const message = document.getElementById('flights-message');
  const data = new FormData(form);

  const params = new URLSearchParams();
  ['departure', 'destination', 'date'].forEach((key) => {
    const value = String(data.get(key) || '').trim();
    if (value !== '') {
      params.set(key, value);
    }
  });

  try {
    const response = await fetchJson(`../../backend/flights/search.php?${params.toString()}`);

    tbody.innerHTML = response.flights
      .map((flight) => `
        <tr>
          <td>${flight.flight_no}</td>
          <td>${flight.airline_name}</td>
          <td>${flight.departure_airport} -> ${flight.destination_airport}</td>
          <td>${flight.departure_datetime}</td>
          <td>${flight.available_seats}</td>
          <td>${money(flight.base_ticket_price)}</td>
          <td>${flight.flight_id}</td>
        </tr>
      `)
      .join('');

    message.textContent = `${response.flights.length} flights found.`;
  } catch (error) {
    message.textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const message = document.getElementById('flights-message');

  try {
    await ensureAgentSession();
    bindLogout();
    await searchFlights();

    document.getElementById('flight-search-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      await searchFlights();
    });
  } catch (error) {
    message.textContent = error.message;
  }
});
