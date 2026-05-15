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
            setView('home');
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
            case 'home':
                await loadAgentHome();
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
 * Load agent home tab
 */
async function loadAgentHome() {
    const contentArea = document.getElementById('content');
    
    contentArea.innerHTML = `
        <div class="agent-home">
            <div class="welcome-section">
                <h2>Welcome, ${currentUser.full_name}!</h2>
                <p>Reservation Agent Dashboard</p>
                <button id="refreshHomeBtn" class="btn btn-secondary" style="margin-top: 0.75rem;">Refresh Stats</button>
            </div>
            
            <div class="dashboard-grid">
                <div class="dashboard-widget">
                    <h3>Total Bookings</h3>
                    <div id="totalBookings" class="widget-value">--</div>
                    <p class="widget-unit">all bookings in scope</p>
                </div>
                <div class="dashboard-widget">
                    <h3>Today's Revenue</h3>
                    <div id="todayRevenue" class="widget-value">--</div>
                    <p class="widget-unit">completed transactions today</p>
                </div>
                <div class="dashboard-widget">
                    <h3>Refunds Issued</h3>
                    <div id="refundCount" class="widget-value">--</div>
                    <p class="widget-unit">refunded bookings</p>
                </div>
                <div class="dashboard-widget">
                    <h3>Active Flights</h3>
                    <div id="activeFlights" class="widget-value">--</div>
                    <p class="widget-unit">available seats</p>
                </div>
            </div>
            
            <div class="home-actions">
                <h3>Quick Actions</h3>
                <div class="action-buttons">
                    <button onclick="setView('reservation'); return false;" class="btn btn-primary btn-large">
                        <span class="btn-icon">✈</span> New Reservation
                    </button>
                    <button onclick="setView('registry'); return false;" class="btn btn-secondary btn-large">
                        <span class="btn-icon">📋</span> View Bookings
                    </button>
                </div>
            </div>
            
            <div class="recent-activity">
                <h3>Recent Transactions</h3>
                <div id="recentTransactions">
                    <p>Loading recent transactions...</p>
                </div>
            </div>

            <div class="operational-summaries">
                <h3>Operational Summaries</h3>
                <div class="summary-grid">
                    <div class="summary-card">
                        <h4>Booking Status Mix</h4>
                        <div id="bookingStatusSummary"></div>
                    </div>
                    <div class="summary-card">
                        <h4>Top Routes</h4>
                        <div id="topRoutesSummary"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load agent statistics
    try {
        const response = await Reports.dashboard();
        const data = response.data || {};
        const totals = data.totals || {};

        document.getElementById('totalBookings').textContent = String(totals.total_bookings || 0);
        document.getElementById('todayRevenue').textContent = formatCurrency(totals.today_revenue || 0);
        document.getElementById('refundCount').textContent = String(totals.refund_count || 0);
        document.getElementById('activeFlights').textContent = String(totals.active_flights || 0);

        renderRecentTransactions(data.recent_transactions || []);

        const operational = data.operational_summaries || {};
        renderBookingStatusSummary(operational.booking_status || []);
        renderTopRoutesSummary(operational.top_routes || []);

        const refreshBtn = document.getElementById('refreshHomeBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => loadAgentHome());
        }
    } catch (error) {
        console.error('Error loading agent home data:', error);
        document.getElementById('recentTransactions').innerHTML = '<p>Failed to load transactions.</p>';
        document.getElementById('bookingStatusSummary').innerHTML = '<p>Failed to load chart data.</p>';
        document.getElementById('topRoutesSummary').innerHTML = '<p>Failed to load route data.</p>';
    }
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    if (!transactions.length) {
        container.innerHTML = '<p>No recent transactions.</p>';
        return;
    }

    const items = transactions.map((txn) => {
        const passenger = escapeHtml(txn.passenger_name || 'Unknown Passenger');
        const bookingRef = escapeHtml(txn.booking_ref || '-');
        const flightNo = escapeHtml(txn.flight_no || '-');
        const method = escapeHtml(txn.payment_method || '-');
        const status = escapeHtml(txn.transaction_status || '-');
        const amount = formatCurrency(txn.amount || 0);
        const when = txn.created_at ? formatDateTime(txn.created_at) : '-';

        return `
            <div class="activity-item">
                <div class="activity-info">
                    <div class="activity-type">${passenger} - ${amount}</div>
                    <div class="activity-details">
                        ${bookingRef} | ${flightNo} | ${method} | ${status}
                    </div>
                </div>
                <div class="activity-time">${when}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="activity-list">${items}</div>`;
}

function renderBookingStatusSummary(statusRows) {
    const container = document.getElementById('bookingStatusSummary');
    if (!container) return;

    if (!statusRows.length) {
        container.innerHTML = '<p>No booking status data.</p>';
        return;
    }

    const total = statusRows.reduce((sum, row) => sum + (row.count || 0), 0);
    if (total === 0) {
        container.innerHTML = '<p>No booking status data.</p>';
        return;
    }

    const colors = ['#00a86b', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
    const segments = statusRows.map((row, index) => {
        const pct = Math.round(((row.count || 0) / total) * 100);
        return {
            label: row.status || 'unknown',
            count: row.count || 0,
            pct,
            color: colors[index % colors.length]
        };
    });

    let currentAngle = 0;
    const gradientParts = segments.map((segment) => {
        const start = currentAngle;
        const span = Math.round((segment.pct / 100) * 360);
        const end = currentAngle + span;
        currentAngle = end;
        return `${segment.color} ${start}deg ${end}deg`;
    });

    const legend = segments.map((segment) => `
        <div class="chart-legend-item">
            <span class="chart-dot" style="background:${segment.color}"></span>
            <span>${escapeHtml(segment.label)} (${segment.count})</span>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="pie-chart" style="background: conic-gradient(${gradientParts.join(', ')});"></div>
        <div class="chart-legend">${legend}</div>
    `;
}

function renderTopRoutesSummary(routeRows) {
    const container = document.getElementById('topRoutesSummary');
    if (!container) return;

    if (!routeRows.length) {
        container.innerHTML = '<p>No route data available.</p>';
        return;
    }

    const maxCount = Math.max(...routeRows.map(row => row.booking_count || 0), 1);

    const bars = routeRows.map((row) => {
        const pct = Math.round(((row.booking_count || 0) / maxCount) * 100);
        return `
            <div class="bar-row">
                <div class="bar-label">${escapeHtml(row.route || '-')}</div>
                <div class="bar-track">
                    <div class="bar-fill" style="width:${pct}%"></div>
                </div>
                <div class="bar-value">${row.booking_count || 0}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="bar-chart">${bars}</div>`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
    if (typeof window.loadReservationWizard === 'function' && window.loadReservationWizard !== loadReservationWizard) {
        window.loadReservationWizard();
        return;
    }

    const contentArea = document.getElementById('content');
    contentArea.innerHTML = `
        <div class="reservation-wizard">
            <h2>New Reservation</h2>
            <p>Reservation module not loaded.</p>
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
        <div id="registryContent"></div>
    `;

    // If registry module is loaded, render bookings
    if (typeof loadAndRenderBookings === 'function') {
        try {
            await loadAndRenderBookings();
        } catch (e) {
            console.error('Failed to load booking registry:', e);
            const container = document.getElementById('registryContent');
            if (container) container.innerHTML = '<p class="error-message">Failed to load bookings.</p>';
        }
    }
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
