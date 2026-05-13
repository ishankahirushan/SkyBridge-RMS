// SkyBridge RMS - Authentication Management

/**
 * Current session data
 */
let currentSession = null;

/**
 * Initialize authentication on page load
 */
function initAuth() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (isAuthenticated() && window.location.pathname.includes('/internal/login.html')) {
        redirectAfterLogin();
        return;
    }

    // Check current session
    checkSession();
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    // Validate inputs
    if (!email || !password) {
        showError('Please enter both email and password', 'errorMessage');
        return;
    }

    showLoading(true);

    try {
        const response = await apiCall('/auth/login.php', 'POST', {
            email: email,
            password: password
        });

        if (response.status === 'success') {
            // Store session data
            const sessionData = response.data?.user || response.data;
            sessionStorage.setItem('user', JSON.stringify(sessionData));
            sessionStorage.setItem('session_expires_at', String(Date.now() + (30 * 60 * 1000)));
            currentSession = sessionData;

            redirectAfterLogin();
        } else {
            showError(response.message || 'Login failed', 'errorMessage');
        }
    } catch (error) {
        showError('Login error: ' + error.message, 'errorMessage');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle logout
 */
async function handleLogout(event) {
    if (event) {
        event.preventDefault();
    }

    showLoading(true);

    try {
        await apiCall('/auth/logout.php', 'POST');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear session storage
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('session_expires_at');
        currentSession = null;

        // Redirect to login
        window.location.href = '../internal/login.html';
    }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    if (!currentSession) {
        const stored = sessionStorage.getItem('user');
        if (stored) {
            try {
                currentSession = JSON.parse(stored);
            } catch (e) {
                return false;
            }
        }
    }

    if (currentSession && isSessionExpired()) {
        clearSession();
        return false;
    }

    return currentSession !== null;
}

/**
 * Get current session
 */
function getSession() {
    if (!currentSession) {
        const stored = sessionStorage.getItem('user');
        if (stored) {
            try {
                currentSession = JSON.parse(stored);
            } catch (e) {
                return null;
            }
        }
    }

    if (currentSession && isSessionExpired()) {
        clearSession();
        return null;
    }

    return currentSession;
}

/**
 * Get current user
 */
function getCurrentUser() {
    return getSession();
}

/**
 * Check user role
 */
function hasRole(role) {
    const session = getSession();
    if (!session) return false;
    return session.role === role;
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return hasRole('admin');
}

/**
 * Check if user is agent
 */
function isAgent() {
    return hasRole('agent');
}

/**
 * Check session and redirect if not authenticated
 */
async function checkSession() {
    // First check local session storage
    if (isAuthenticated()) {
        return true;
    }

    // For dashboard pages, redirect to login
    const currentPath = window.location.pathname;
    if (currentPath.includes('/internal/dashboard.html')) {
        window.location.href = '../internal/login.html';
        return false;
    }

    if (currentPath.includes('/internal/login.html') && isAuthenticated()) {
        redirectAfterLogin();
        return true;
    }

    return false;
}

/**
 * Require authentication
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../internal/login.html';
        return false;
    }
    return true;
}

/**
 * Require specific role
 */
function requireRole(role) {
    if (!isAuthenticated()) {
        window.location.href = '../internal/login.html';
        return false;
    }

    const session = getSession();
    if (session.role !== role) {
        alert('Access denied. You do not have permission to view this page.');
        window.location.href = '../internal/login.html';
        return false;
    }

    return true;
}

function clearSession() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('session_expires_at');
    currentSession = null;
}

function isSessionExpired() {
    const expiry = Number(sessionStorage.getItem('session_expires_at') || 0);
    return expiry > 0 && Date.now() > expiry;
}

function redirectAfterLogin() {
    if (isAdmin()) {
        window.location.href = '../internal/dashboard.html?view=dashboard';
        return;
    }

    window.location.href = '../internal/dashboard.html?view=reservation';
}

/**
 * Setup auth headers for all API calls
 */
function setupAuthInterceptor() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        if (args[1] && typeof args[1] === 'object') {
            // Add session ID to headers if available
            const session = getSession();
            if (session && session.session_id) {
                if (!args[1].headers) {
                    args[1].headers = {};
                }
                args[1].headers['X-Session-ID'] = session.session_id;
            }
        }
        return originalFetch.apply(this, args);
    };
}

/**
 * Display user info in header
 */
function displayUserInfo() {
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');

    const session = getSession();
    if (session) {
        if (userNameEl) {
            userNameEl.textContent = session.full_name || session.email;
        }
        if (userRoleEl) {
            const roleText = session.role === 'admin' ? 'Administrator' : 'Agent';
            userRoleEl.textContent = roleText;
        }
    }
}

/**
 * Setup role-based menu visibility
 */
function setupRoleBasedMenus() {
    const agentMenu = document.getElementById('agentMenu');
    const adminMenu = document.getElementById('adminMenu');

    const session = getSession();
    if (session) {
        if (session.role === 'admin') {
            if (adminMenu) adminMenu.style.display = 'block';
            if (agentMenu) agentMenu.style.display = 'none';
        } else if (session.role === 'agent') {
            if (agentMenu) agentMenu.style.display = 'block';
            if (adminMenu) adminMenu.style.display = 'none';
        }
    }
}

/**
 * Helper functions for showError and showLoading (reused from utils)
 */
function showError(message, containerId = 'errorMessage') {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = message;
        container.style.display = 'block';
        
        setTimeout(() => {
            container.style.display = 'none';
        }, 8000);
    }
}

function showLoading(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

/**
 * API call function (reused from api.js)
 */
// Initialize auth when document is ready
document.addEventListener('DOMContentLoaded', initAuth);
