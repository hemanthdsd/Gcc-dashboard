/**
 * GCC Dashboard Utils
 * Global namespace for utility functions
 */
window.GCC = window.GCC || {};

window.GCC.Utils = {
    // Generate unique IDs
    generateId: (prefix = 'ID') => {
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${randomNum}`;
    },

    // Date formatting
    formatDate: (dateString, includeTime = true) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        
        const pad = (n) => n.toString().padStart(2, '0');
        
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        
        let result = `${year}-${month}-${day}`;
        
        if (includeTime) {
            const hours = pad(date.getUTCHours());
            const minutes = pad(date.getUTCMinutes());
            result += ` ${hours}:${minutes} Z`;
        }
        
        return result;
    },
    
    // Time relative to now
    timeAgo: (dateString) => {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays}d ago`;
    },

    // UI Helpers
    createToast: (title, message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'warning') iconName = 'alert-triangle';
        if (type === 'error') iconName = 'alert-circle';
        
        toast.innerHTML = `
            <i data-lucide="${iconName}" class="toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close"><i data-lucide="x" width="16" height="16"></i></button>
        `;
        
        container.appendChild(toast);
        
        // Ensure Lucide icons are rendered for this specific element
        if (window.lucide) {
            lucide.createIcons({ root: toast });
        }
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Setup close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300); // Wait for transition
        });
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }
        }, 5000);
    },

    // Capitalize first letter
    capitalize: (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
    },
    
    // Convert object to HTML string (safely)
    escapeHtml: (unsafe) => {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
};
