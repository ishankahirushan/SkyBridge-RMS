function statusPill(status) {
  const normalized = String(status || '').toLowerCase();
  const css = normalized === 'enabled' ? 'status-enabled' : 'status-disabled';
  return `<span class="status-pill ${css}">${status}</span>`;
}

async function loadAirlines() {
  const tbody = document.getElementById('airlines-body');
  const message = document.getElementById('airlines-message');

  try {
    const data = await fetchJson('../../backend/airlines/list.php');

    tbody.innerHTML = data.airlines
      .map((airline) => {
        const next = airline.agency_status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
        return `
          <tr>
            <td>${airline.airline_name}</td>
            <td>${airline.airline_code}</td>
            <td>${airline.country}</td>
            <td>${statusPill(airline.agency_status)}</td>
            <td><button data-id="${airline.airline_id}" data-next="${next}">${next}</button></td>
          </tr>
        `;
      })
      .join('');

    message.textContent = 'Airline list refreshed.';
  } catch (error) {
    message.textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await ensureAdminSession();
  bindLogout();
  await loadAirlines();

  document.getElementById('airlines-body').addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) {
      return;
    }

    const airlineId = Number(button.dataset.id);
    const status = button.dataset.next;

    try {
      await fetchJson('../../backend/airlines/update_status.php', {
        method: 'POST',
        body: JSON.stringify({
          airline_id: airlineId,
          status
        })
      });
      await loadAirlines();
    } catch (error) {
      document.getElementById('airlines-message').textContent = error.message;
    }
  });
});
