(function () {
  const form = document.getElementById('login-form');
  const message = document.getElementById('login-message');

  if (!form || !message) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || '')
    };

    message.textContent = 'Signing in...';

    try {
      const response = await fetch('../../backend/auth/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        message.textContent = data.message || 'Login failed.';
        return;
      }

      message.textContent = 'Login successful. Redirecting...';
      window.location.href = data.redirectUrl;
    } catch (error) {
      message.textContent = 'Unable to reach server. Please try again.';
      console.error(error);
    }
  });
})();
