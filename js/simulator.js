/**
 * GCC Dashboard - Alert Simulator
 * Randomly generates alerts when enabled
 */
window.GCC = window.GCC || {};

window.GCC.Simulator = (function() {
    
    let timerId = null;
    
    function init() {
        const settings = window.GCC.Store.get('settings');
        if (settings.simulatorEnabled) {
            start();
        }
    }
    
    function start() {
        if (timerId) clearTimeout(timerId);
        scheduleNext();
    }
    
    function stop() {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    }
    
    function scheduleNext() {
        // Random interval between 30 and 90 seconds (30000 - 90000 ms)
        // For testing/demo purposes, we'll make it 10-25 seconds so the user isn't waiting forever
        const delay = Math.floor(Math.random() * 15000) + 10000;
        
        timerId = setTimeout(() => {
            generateAlert();
            scheduleNext();
        }, delay);
    }
    
    function generateAlert() {
        const assets = window.GCC.Store.get('assets');
        if (assets.length === 0) return;
        
        const severities = ['high', 'high', 'medium', 'medium', 'medium', 'low', 'low', 'critical']; // Weighted
        const types = ['server_unreachable', 'high_cpu', 'disk_warning', 'network_fail', 'power_warning', 'temp_warning'];
        
        const asset = assets[Math.floor(Math.random() * assets.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const messages = {
            'server_unreachable': `Host ${asset.hostname} stopped responding to ICMP ping`,
            'high_cpu': `CPU utilization sustained at >95% for 15 minutes on ${asset.hostname}`,
            'disk_warning': `Storage volume /dev/sda1 exceeding 90% capacity on ${asset.hostname}`,
            'network_fail': `Interface eth0 dropped link state on ${asset.hostname}`,
            'power_warning': `Redundant power supply failure detected on ${asset.hostname}`,
            'temp_warning': `Inlet temperature sensor reading 32°C (Warning Threshold) near ${asset.hostname}`
        };
        
        const newAlert = {
            id: window.GCC.Utils.generateId('ALR'),
            customerId: asset.customerId,
            siteId: asset.siteId,
            assetId: asset.id,
            type: type,
            severity: severity,
            message: messages[type],
            detectedAt: new Date().toISOString(),
            status: 'new',
            isDuplicate: false
        };
        
        // Add to store
        window.GCC.Store.add('alerts', newAlert);
        
        // Update asset status if critical
        if (severity === 'critical') {
            window.GCC.Store.update('assets', asset.id, { status: 'critical' });
        }
        
        // Notify UI
        window.GCC.Utils.createToast('New Alert Detected', `${newAlert.id}: ${newAlert.message}`, 'error');
        
        // If we are on the alerts page, re-render it
        if (window.location.hash.includes('/alerts')) {
            window.GCC.Router.navigate(window.location.hash);
        }
        // If we are on dashboard, it updates via the store subscriber in app.js
    }

    // Export interface
    const api = {
        init,
        start,
        stop
    };
    
    // Auto-init on load
    window.addEventListener('DOMContentLoaded', () => {
        // slight delay to let store load
        setTimeout(() => {
            api.init();
        }, 1000);
    });
    
    return api;

})();
