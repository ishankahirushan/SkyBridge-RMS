document.addEventListener('DOMContentLoaded', async () => {
  const message = document.getElementById('passenger-message');

  try {
    await ensureAgentSession();
    bindLogout();

    document.getElementById('verify-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const passportNo = document.getElementById('verify-passport').value.trim();

      try {
        const data = await fetchJson('../../backend/passengers/verify.php', {
          method: 'POST',
          body: JSON.stringify({ passport_no: passportNo })
        });

        const statusNode = document.getElementById('verification-status');
        if (data.verification) {
          statusNode.innerHTML = `${pill(data.verification.status)} Expiry: ${data.verification.expiry_date}`;
        } else {
          statusNode.textContent = data.message || 'No verification record.';
        }

        if (data.passenger) {
          document.getElementById('reg-passport').value = data.passenger.passport_no || passportNo;
          document.getElementById('reg-given').value = data.passenger.given_names || '';
          document.getElementById('reg-surname').value = data.passenger.surname || '';
          document.getElementById('reg-email').value = data.passenger.email || '';
          document.getElementById('reg-contact').value = data.passenger.contact_no || '';
        }

        message.textContent = 'Verification completed.';
      } catch (error) {
        message.textContent = error.message;
      }
    });

    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = {
        passport_no: document.getElementById('reg-passport').value.trim(),
        given_names: document.getElementById('reg-given').value.trim(),
        surname: document.getElementById('reg-surname').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        contact_no: document.getElementById('reg-contact').value.trim()
      };

      try {
        const data = await fetchJson('../../backend/passengers/register.php', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        message.textContent = `${data.message} Passenger ID: ${data.passenger_id}`;
      } catch (error) {
        message.textContent = error.message;
      }
    });
  } catch (error) {
    message.textContent = error.message;
  }
});
