document.addEventListener('DOMContentLoaded', async () => {
  await ensureAdminSession();
  bindLogout();

  const message = document.getElementById('dashboard-message');

  try {
    const data = await fetchJson('../../backend/reports/summary.php');
    document.getElementById('total-bookings').textContent = data.totals.total_bookings;
    document.getElementById('total-revenue').textContent = currency(data.totals.total_revenue);
    document.getElementById('total-refunds').textContent = data.totals.total_refunds;

    const topAirline = data.bookings_per_airline[0];
    document.getElementById('top-airline').textContent = topAirline
      ? `${topAirline.airline_name} (${topAirline.booking_count})`
      : 'No data yet';

    message.textContent = 'Dashboard updated.';
  } catch (error) {
    message.textContent = error.message;
  }
});
