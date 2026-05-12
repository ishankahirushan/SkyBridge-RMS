document.addEventListener('DOMContentLoaded', async () => {
  const message = document.getElementById('dashboard-message');

  try {
    await ensureAgentSession();
    bindLogout();

    const data = await fetchJson('../../backend/bookings/agent_summary.php');
    const summary = data.summary || {};

    document.getElementById('metric-total').textContent = summary.total_bookings || 0;
    document.getElementById('metric-revenue').textContent = money(summary.total_success_revenue || 0);
    document.getElementById('metric-pending').textContent = summary.pending_bookings || 0;
    document.getElementById('metric-cancelled').textContent = summary.cancelled_bookings || 0;

    message.textContent = 'Agent dashboard updated.';
  } catch (error) {
    message.textContent = error.message;
  }
});
