// SkyBridge RMS - Dashboard Logic

let currentView = 'dashboard';
let currentUser = null;

/**
 * Initialize dashboard on page load
 */
function initDashboard() {
    // Check authentication
    if (!requireAuth()) {
        return;
    }

    // Get current user
    currentUser = getSession();
    
    // Display user info
    displayUserInfo();
    
    // Setup role-based menus
    setupRoleBasedMenus();

    // Setup navigation
    setupNavigation();

    // Get view from URL parameters
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');

    // Set initial view based on role
    if (requestedView) {
        setView(requestedView);
    } else {
        if (isAdmin()) {
            setView('dashboard');
        } else {
            setView('reservation');
        }
    }
}

/**
 * Setup navigation click handlers
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const menu = item.getAttribute('data-menu');
            setView(menu);
        });
    });
}

/**
 * Set current view and load content
 */
async function setView(view) {
    // Check permissions
    if (view === 'dashboard' || view === 'airlines' || view === 'agents' || view === 'reports') {
        if (!isAdmin()) {
            alert('Access denied. Admin only.');
            return;
        }
    }

    currentView = view;
    
    // Update active navigation
    updateActiveNav();

    // Load content
    const contentArea = document.getElementById('content');
    contentArea.innerHTML = '';

    showLoading(true);

    try {
        switch (view) {
            case 'dashboard':
                await loadAdminDashboard();
                break;
            case 'airlines':
                await loadAirlines();
                break;
            case 'agents':
                await loadAgents();
                break;
            case 'reports':
                await loadReports();
                break;
            case 'reservation':
                loadReservationWizard();
                break;
            case 'registry':
                await loadBookingRegistry();
                break;
            default:
                contentArea.innerHTML = '<p>View not found.</p>';
        }
    } catch (error) {
        contentArea.innerHTML = `<div class="error-message">Error loading view: ${error.message}</div>`;
    } finally {
        showLoading(false);
    }

    // Update URL
    window.history.pushState({ view }, '', `?view=${view}`);
}

/**
 * Update active navigation item
 */
function updateActiveNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-menu') === currentView) {
            item.classList.add('active');
        }
    });
}

/**
 * Load admin dashboard
 */
async function loadAdminDashboard() {
    const contentArea = document.getElementById('content');
    
    contentArea.innerHTML = `
        <h2>Admin Dashboard</h2>
        <p>Welcome, ${currentUser.full_name}!</p>
        
        <div class="dashboard-grid">
            <div class="dashboard-widget">
                <h3>Total Airlines</h3>
                <div id="airlinesCount" class="widget-value">--</div>
            </div>
            <div class="dashboard-widget">
                <h3>Active Agents</h3>
                <div id="agentsCount" class="widget-value">--</div>
            </div>
            <div class="dashboard-widget">
                <h3>Total Bookings</h3>
                <div id="bookingsCount" class="widget-value">--</div>
            </div>
            <div class="dashboard-widget">
                <h3>Monthly Revenue</h3>
                <div id="revenueAmount" class="widget-value">--</div>
            </div>
        </div>

        <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h3>Quick Actions</h3>
                <ul style="list-style: none; padding: 0;">
                    <li style="margin-bottom: 0.5rem;">
                        <a href="#" onclick="setView('airlines'); return false;" class="btn btn-primary">
                            Manage Airlines
                        </a>
                    </li>
                    <li style="margin-bottom: 0.5rem;">
                        <a href="#" onclick="setView('agents'); return false;" class="btn btn-primary">
                            Manage Agents
                        </a>
                    </li>
                    <li style="margin-bottom: 0.5rem;">
                        <a href="#" onclick="setView('reports'); return false;" class="btn btn-primary">
                            View Reports
                        </a>
                    </li>
                </ul>
            </div>
            <div id="dashboardStats">
                <!-- Stats will be loaded here -->
            </div>
        </div>
    `;

    // Load dashboard data
    try {
        const airlines = await Admin.airlines.list();
        document.getElementById('airlinesCount').textContent = airlines.data?.length || 0;

        const agents = await Admin.agents.list();
        const activeAgents = agents.data?.filter(a => a.status === 'active').length || 0;
        document.getElementById('agentsCount').textContent = activeAgents;
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load airlines management
 */
async function loadAirlines() {
    const contentArea = document.getElementById('content');
    
    contentArea.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Airlines Management</h2>
                <div class="admin-actions">
                    <button onclick="showAddAirlineForm()" class="btn btn-primary">+ Add Airline</button>
                </div>
            </div>
            <div id="airlinesList"></div>
        </div>
    `;

    try {
        const response = await Admin.airlines.list();
        displayAirlinesList(response.data || []);
    } catch (error) {
        contentArea.innerHTML = `<div class="error-message">Error loading airlines: ${error.message}</div>`;
    }
}

/**
 * Display airlines list
 */
function displayAirlinesList(airlines) {
    const listDiv = document.getElementById('airlinesList');
    
    if (airlines.length === 0) {
        listDiv.innerHTML = '<p>No airlines found.</p>';
        return;
    }

    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Airline Name</th>
                    <th>Code</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    airlines.forEach(airline => {
        const statusBadge = createStatusBadge(airline.status);
        html += `
            <tr>
                <td>${airline.airline_name}</td>
                <td>${airline.airline_code}</td>
                <td>${airline.country}</td>
                <td>${statusBadge.outerHTML}</td>
                <td>
                    <div class="table-actions">
                        <button onclick="editAirline(${airline.airline_id})" class="action-btn action-btn-edit">Edit</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    listDiv.innerHTML = html;
}

/**
 * Show add airline form
 */
function showAddAirlineForm() {
    // This will be expanded in Phase 13
    alert('Add Airline form - to be implemented');
}

/**
 * Edit airline
 */
function editAirline(airlineId) {
    // This will be expanded in Phase 13
    alert('Edit Airline form - to be implemented');
}

/**
 * Load agents management
 */
async function loadAgents() {
    const contentArea = document.getElementById('content');
    
    contentArea.innerHTML = `
        <div class="admin-section">
            <div class="admin-section-header">
                <h2>Agents Management</h2>
                <div class="admin-actions">
                    <button onclick="showAddAgentForm()" class="btn btn-primary">+ Add Agent</button>
                </div>
            </div>
            <div id="agentsList"></div>
        </div>
    `;

    try {
        const response = await Admin.agents.list();
        displayAgentsList(response.data || []);
    } catch (error) {
        contentArea.innerHTML = `<div class="error-message">Error loading agents: ${error.message}</div>`;
    }
}

/**
 * Display agents list
 */
function displayAgentsList(agents) {
    const listDiv = document.getElementById('agentsList');
    
    if (agents.length === 0) {
        listDiv.innerHTML = '<p>No agents found.</p>';
        return;
    }

    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    agents.forEach(agent => {
        const statusBadge = createStatusBadge(agent.status);
        html += `
            <tr>
                <td>${agent.full_name}</td>
                <td>${agent.email}</td>
                <td>${agent.role}</td>
                <td>${statusBadge.outerHTML}</td>
                <td>
                    <div class="table-actions">
                        <button onclick="editAgent(${agent.agent_id})" class="action-btn action-btn-edit">Edit</button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    listDiv.innerHTML = html;
}

/**
 * Show add agent form
 */
function showAddAgentForm() {
    // This will be expanded in Phase 13
    alert('Add Agent form - to be implemented');
}

/**
 * Edit agent
 */
function editAgent(agentId) {
    // This will be expanded in Phase 13
    alert('Edit Agent form - to be implemented');
}

/**
 * Load reports
 */
async function loadReports() {
    const contentArea = document.getElementById('content');
    contentArea.innerHTML = `
        <h2>Reports & Analytics</h2>
        <p>Reports section - to be implemented in Phase 14</p>
    `;
}

/**
 * Load reservation wizard (agent view)
 */
function loadReservationWizard() {
    const contentArea = document.getElementById('content');
    contentArea.innerHTML = `
        <div class="reservation-wizard">
            <h2>New Reservation</h2>
            <p>Reservation wizard - to be implemented in Phase 11</p>
        </div>
    `;
}

/**
 * Load booking registry (agent view)
 */
async function loadBookingRegistry() {
    const contentArea = document.getElementById('content');
    contentArea.innerHTML = `
        <h2>Bookings Registry</h2>
        <p>Booking registry - to be implemented in Phase 12</p>
    `;
}

/**
 * Helper functions (reused from utils)
 */
function showLoading(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    
    if (status === 'active') {
        badge.classList.add('status-active');
        badge.textContent = 'Active';
    } else if (status === 'inactive') {
        badge.classList.add('status-inactive');
        badge.textContent = 'Inactive';
    }
    
    return badge;
}

// Initialize dashboard when document is ready
document.addEventListener('DOMContentLoaded', initDashboard);

export {
    initDashboard,
    setView,
    loadAdminDashboard,
    loadAirlines,
    loadAgents,
    loadReports,
    loadReservationWizard,
    loadBookingRegistry
};
