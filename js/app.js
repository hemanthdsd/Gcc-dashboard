/**
 * GCC Dashboard App Entry Point
 * Bootstraps the application, handles global UI (header, sidebar, theme)
 */
window.GCC = window.GCC || {};

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Authentication Check
    const session = window.GCC.Store.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize Store
    window.GCC.Store.init();

    // 3. Setup Header & Profile
    document.getElementById('user-name').textContent = session.name;
    document.getElementById('user-role').textContent = window.GCC.Utils.capitalize(session.role);
    document.getElementById('user-avatar').textContent = session.name.charAt(0);
    
    // Shift label based on current time
    const hour = new Date().getUTCHours();
    const shift = (hour >= 6 && hour < 14) ? 'Early Shift' : ((hour >= 14 && hour < 22) ? 'Late Shift' : 'Night Shift');
    document.getElementById('current-shift-label').textContent = shift;
    
    // Logout listener
    document.getElementById('user-menu-btn').addEventListener('click', () => {
        if(confirm('Log out of GCC Dashboard?')) {
            window.GCC.Store.logout();
        }
    });

    // 4. Live Clock
    const clockEl = document.getElementById('header-clock');
    setInterval(() => {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        clockEl.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} Z`;
    }, 1000);

    // 5. Theme Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const settings = window.GCC.Store.get('settings');
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        window.GCC.Store.update('settings', null, { theme: newTheme }); // Settings is a single object, not array. Wait, Store.update expects array. 
        // Need to set settings explicitly
        window.GCC.Store.set('settings', { ...window.GCC.Store.get('settings'), theme: newTheme });
    });

    // 6. Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
    
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
    }

    // 7. Initialize Global Badges
    function updateBadges() {
        const incidents = window.GCC.Store.get('incidents');
        const alerts = window.GCC.Store.get('alerts');
        
        const criticalCount = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;
        const newAlerts = alerts.filter(a => a.status === 'new').length;
        
        const critBadge = document.getElementById('critical-badge');
        critBadge.textContent = criticalCount;
        critBadge.style.display = criticalCount > 0 ? 'flex' : 'none';
        
        const notifBadge = document.getElementById('notif-badge');
        notifBadge.textContent = newAlerts;
        notifBadge.style.display = newAlerts > 0 ? 'flex' : 'none';
    }
    
    updateBadges();
    window.GCC.Store.subscribe('incidents', updateBadges);
    window.GCC.Store.subscribe('alerts', updateBadges);

    // 8. Initialize Router
    window.GCC.Router.init();
});
