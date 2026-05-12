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

async function ensureAdminSession() {
  try {
    const data = await fetchJson('../../backend/auth/session.php');

    if (!data.loggedIn || !data.user || data.user.role !== 'ADMIN') {
      window.location.href = '../public/login.html';
      return;
    }

    const who = document.getElementById('session-user');
    if (who) {
      who.textContent = data.user.full_name || data.user.email;
    }
  } catch (error) {
    window.location.href = '../public/login.html';
  }
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

function currency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(amount || 0));
}
