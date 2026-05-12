function renderRows(rows, columns) {
  return rows
    .map((row) => {
      const cells = columns.map((column) => `<td>${row[column]}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  await ensureAdminSession();
  bindLogout();

  const message = document.getElementById('reports-message');

  try {
    const data = await fetchJson('../../backend/reports/summary.php');

    document.getElementById('report-bookings').textContent = data.totals.total_bookings;
    document.getElementById('report-revenue').textContent = currency(data.totals.total_revenue);
    document.getElementById('report-refunds').textContent = data.totals.total_refunds;

    document.getElementById('bookings-airline-body').innerHTML = renderRows(
      data.bookings_per_airline,
      ['airline_name', 'booking_count']
    );

    document.getElementById('popular-destinations-body').innerHTML = renderRows(
      data.popular_destinations,
      ['destination_airport', 'booking_count']
    );

    document.getElementById('agent-activity-body').innerHTML = renderRows(
      data.agent_activity,
      ['full_name', 'booking_count']
    );

    message.textContent = 'Reports updated.';
  } catch (error) {
    message.textContent = error.message;
  }
});
