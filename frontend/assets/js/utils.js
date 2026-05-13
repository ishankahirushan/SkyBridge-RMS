// SkyBridge RMS - Utility Functions

/**
 * Display loading spinner
 */
function showLoading(show = true) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Display success message
 */
function showSuccess(message, containerId = 'content') {
    const container = document.getElementById(containerId);
    if (container) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'success-message';
        msgDiv.textContent = message;
        container.insertBefore(msgDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => msgDiv.remove(), 5000);
    }
}

/**
 * Display error message
 */
function showError(message, containerId = 'errorMessage') {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = message;
        container.style.display = 'block';
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            container.style.display = 'none';
        }, 8000);
    }
}

/**
 * Format currency (LKR)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'LKR'
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Format datetime
 */
function formatDateTime(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Format time only (HH:MM)
 */
function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    });
}

/**
 * Calculate time difference in hours and minutes
 */
function calculateDuration(departure, arrival) {
    const start = new Date(departure);
    const end = new Date(arrival);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    // At least 6 characters
    return password && password.length >= 6;
}

/**
 * Create a badge element with status
 */
function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge';
    
    if (status === 'active' || status === 'paid') {
        badge.classList.add('status-active');
        badge.textContent = 'Active';
    } else if (status === 'inactive') {
        badge.classList.add('status-inactive');
        badge.textContent = 'Inactive';
    } else if (status === 'pending' || status === 'unpaid') {
        badge.classList.add('status-pending');
        badge.textContent = 'Pending';
    }
    
    return badge;
}

/**
 * Create a booking status badge
 */
function createBookingStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'booking-status';
    
    if (status === 'paid') {
        badge.classList.add('status-paid');
        badge.textContent = 'Paid';
    } else if (status === 'unpaid') {
        badge.classList.add('status-unpaid');
        badge.textContent = 'Unpaid';
    } else if (status === 'cancelled') {
        badge.classList.add('status-cancelled');
        badge.textContent = 'Cancelled';
    }
    
    return badge;
}

/**
 * Convert role name to display text
 */
function getRoleDisplayName(role) {
    const roleMap = {
        'admin': 'Administrator',
        'agent': 'Agent'
    };
    return roleMap[role] || role;
}

/**
 * Debounce helper
 */
function debounce(func, delay = 300) {
    let timeoutId;

    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Local storage helper functions
 */
const Storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage error:', e);
        }
    }
};

/**
 * Generate UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Clone object deeply
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Group array by property
 */
function groupBy(array, property) {
    return array.reduce((groups, item) => {
        const key = item[property];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Sort array by property
 */
function sortBy(array, property, ascending = true) {
    return [...array].sort((a, b) => {
        if (a[property] < b[property]) return ascending ? -1 : 1;
        if (a[property] > b[property]) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Filter array by multiple conditions
 */
function filterBy(array, conditions) {
    return array.filter(item => {
        return Object.keys(conditions).every(key => {
            if (typeof conditions[key] === 'function') {
                return conditions[key](item[key]);
            }
            return item[key] === conditions[key];
        });
    });
}

/**
 * Convert form data to object
 */
function formToObject(form) {
    const formData = new FormData(form);
    const obj = {};
    for (const [key, value] of formData.entries()) {
        obj[key] = value;
    }
    return obj;
}

/**
 * Populate form with object data
 */
function populateForm(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.elements[key];
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = data[key];
            } else if (field.type === 'radio') {
                const radio = form.elements[key];
                if (radio.length) {
                    radio.value = data[key];
                }
            } else {
                field.value = data[key];
            }
        }
    });
}
