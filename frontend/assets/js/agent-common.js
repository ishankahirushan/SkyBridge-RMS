async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

async function ensureAgentSession() {
  const data = await fetchJson('../../backend/auth/session.php');

  if (!data.loggedIn || !data.user || !['ADMIN', 'AGENT'].includes(data.user.role)) {
    window.location.href = '../public/login.html';
    return null;
  }

  const userNode = document.getElementById('session-user');
  if (userNode) {
    userNode.textContent = data.user.full_name || data.user.email;
  }

  return data.user;
}

function bindLogout() {
  const button = document.getElementById('logout-btn');
  if (!button) {
    return;
  }

  button.addEventListener('click', async () => {
    try {
      await fetchJson('../../backend/auth/logout.php', {
        method: 'POST',
        body: JSON.stringify({})
      });
    } catch (error) {
      console.error(error);
    }

    window.location.href = '../public/login.html';
  });
}

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value || 0));
}

function pill(status) {
  const safe = String(status || 'UNKNOWN');
  const css = `status-${safe.toLowerCase()}`;
  return `<span class="status-pill ${css}">${safe}</span>`;
}
