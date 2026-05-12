function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function statusPill(status) {
  const normalized = String(status || '').toLowerCase();
  const css = normalized === 'active' ? 'status-active' : 'status-inactive';
  return `<span class="status-pill ${css}">${status}</span>`;
}

async function loadAgents() {
  const tbody = document.getElementById('agents-body');
  const message = document.getElementById('agents-message');

  try {
    const data = await fetchJson('../../backend/agents/list.php');

    tbody.innerHTML = data.agents
      .map((agent) => {
        return `
          <tr>
            <td>${esc(agent.full_name)}</td>
            <td>${esc(agent.email)}</td>
            <td>${esc(agent.role)}</td>
            <td>${statusPill(agent.status)}</td>
            <td>
              <button class="secondary" data-edit='${JSON.stringify(agent)}'>Edit</button>
              <button class="warning" data-deactivate="${agent.agent_id}">Deactivate</button>
              <button data-reset="${agent.agent_id}">Reset Password</button>
            </td>
          </tr>
        `;
      })
      .join('');

    message.textContent = 'Agent list refreshed.';
  } catch (error) {
    message.textContent = error.message;
  }
}

function bindCreate() {
  const form = document.getElementById('create-agent-form');
  const message = document.getElementById('agents-message');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const payload = {
      full_name: String(data.get('full_name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      password: String(data.get('password') || ''),
      role: String(data.get('role') || 'AGENT')
    };

    try {
      await fetchJson('../../backend/agents/create.php', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      form.reset();
      await loadAgents();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

function bindTableActions() {
  const tbody = document.getElementById('agents-body');
  const message = document.getElementById('agents-message');

  tbody.addEventListener('click', async (event) => {
    const editButton = event.target.closest('button[data-edit]');
    const deactivateButton = event.target.closest('button[data-deactivate]');
    const resetButton = event.target.closest('button[data-reset]');

    try {
      if (editButton) {
        const current = JSON.parse(editButton.dataset.edit);
        const fullName = prompt('Full name', current.full_name);
        if (fullName === null) {
          return;
        }
        const email = prompt('Email', current.email);
        if (email === null) {
          return;
        }
        const role = prompt('Role (ADMIN or AGENT)', current.role);
        if (role === null) {
          return;
        }
        const status = prompt('Status (ACTIVE or INACTIVE)', current.status);
        if (status === null) {
          return;
        }

        await fetchJson('../../backend/agents/update.php', {
          method: 'POST',
          body: JSON.stringify({
            agent_id: current.agent_id,
            full_name: fullName,
            email,
            role,
            status
          })
        });

        await loadAgents();
        return;
      }

      if (deactivateButton) {
        await fetchJson('../../backend/agents/deactivate.php', {
          method: 'POST',
          body: JSON.stringify({
            agent_id: Number(deactivateButton.dataset.deactivate)
          })
        });

        await loadAgents();
        return;
      }

      if (resetButton) {
        const newPassword = prompt('Enter new password (minimum 6 characters)');
        if (!newPassword) {
          return;
        }

        await fetchJson('../../backend/agents/reset_password.php', {
          method: 'POST',
          body: JSON.stringify({
            agent_id: Number(resetButton.dataset.reset),
            new_password: newPassword
          })
        });

        message.textContent = 'Password reset successful.';
      }
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await ensureAdminSession();
  bindLogout();
  bindCreate();
  bindTableActions();
  await loadAgents();
});
