/**
 * GCC Dashboard - Overview / Dashboard View
 */
window.GCC = window.GCC || {};

(function() {
    
    // Store chart instances to destroy them on cleanup
    let charts = [];
    // Animation frame request ID for SLA timers
    let rafId = null;

    function renderDashboard() {
        const incidents = window.GCC.Store.get('incidents');
        const alerts = window.GCC.Store.get('alerts');
        const requests = window.GCC.Store.get('requests');
        
        // Calculate metrics
        const openIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status));
        const activeAlerts = alerts.filter(a => !['resolved', 'suppressed'].includes(a.status));
        const openReqs = requests.filter(r => !['completed', 'cancelled'].includes(r.status));
        
        const criticalInc = openIncidents.filter(i => i.severity === 'critical');
        const breachedSLA = openIncidents.filter(i => i.sla.breached);
        const nearBreach = openIncidents.filter(i => !i.sla.breached && window.GCC.SLA.calculateState(i.createdAt, i.sla.resolutionTarget).status === 'critical');
        const unassigned = openIncidents.filter(i => !i.assignedAnalyst);
        const awaitCust = openIncidents.filter(i => i.status === 'awaiting_customer');
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Operations Overview</h1>
                    <p class="page-subtitle">Real-time status of data centre infrastructure and services</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="window.GCC.Utils.createToast('Action', 'Simulator toggle not yet implemented')">
                        <i data-lucide="play"></i> Start Simulator
                    </button>
                    <button class="btn btn-secondary">
                        <i data-lucide="download"></i> Export Report
                    </button>
                </div>
            </div>

            <!-- Summary Cards -->
            <div class="dashboard-grid">
                ${renderCard('Active Alerts', activeAlerts.length, 'bell', 'warning', 12, 'up')}
                ${renderCard('Open Incidents', openIncidents.length, 'alert-triangle', 'warning', -5, 'down')}
                ${renderCard('Critical Incidents', criticalInc.length, 'flame', 'critical', 2, 'up')}
                ${renderCard('SLA Breaches', breachedSLA.length, 'clock', 'critical', 0, 'neutral')}
                ${renderCard('Near SLA Breach', nearBreach.length, 'alert-circle', 'warning', 3, 'up')}
                ${renderCard('Unassigned', unassigned.length, 'user-minus', 'info', -2, 'down')}
                ${renderCard('Open Requests', openReqs.length, 'inbox', 'info', 15, 'up')}
                ${renderCard('Awaiting Customer', awaitCust.length, 'user-clock', 'healthy', -10, 'down')}
            </div>

            <!-- Charts & Feed -->
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Incidents by Severity</h3>
                        <button class="btn btn-ghost btn-icon-only"><i data-lucide="more-horizontal"></i></button>
                    </div>
                    <div class="chart-body">
                        <canvas id="chart-severity"></canvas>
                    </div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Incident Status Distribution</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="chart-status"></canvas>
                    </div>
                </div>
                
                <div class="chart-card live-feed-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Live Operations Feed</h3>
                        <div class="status-badge healthy">
                            <i data-lucide="activity"></i> Live
                        </div>
                    </div>
                    <div class="chart-body feed-list" id="live-feed">
                        <!-- Feed populated by JS -->
                    </div>
                </div>
            </div>
        `;
        
        // Defer chart and feed initialization until after DOM is updated
        setTimeout(() => {
            initCharts(incidents);
            renderLiveFeed(incidents, alerts);
            startSLATimers();
        }, 0);
        
        return html;
    }

    function renderCard(title, value, icon, type, trendVal, trendDir) {
        let trendHtml = '';
        if (trendDir !== 'neutral') {
            const isGood = (trendDir === 'down' && (type === 'critical' || type === 'warning')) || 
                           (trendDir === 'up' && type === 'healthy');
            const trendClass = isGood ? 'good' : 'bad';
            const trendIcon = trendDir === 'up' ? 'trending-up' : 'trending-down';
            
            trendHtml = `
                <div class="trend ${trendDir} ${trendClass}">
                    <i data-lucide="${trendIcon}" class="trend-icon"></i>
                    <span>${Math.abs(trendVal)}%</span>
                </div>
                <span class="trend-text">vs last shift</span>
            `;
        } else {
            trendHtml = `<span class="trend-text">No change vs last shift</span>`;
        }
        
        return `
            <div class="summary-card ${type}">
                <div class="summary-header">
                    <div class="summary-title">${title}</div>
                    <i data-lucide="${icon}" class="summary-icon"></i>
                </div>
                <div class="summary-value">${value}</div>
                <div class="summary-footer">
                    ${trendHtml}
                </div>
            </div>
        `;
    }

    function initCharts(incidents) {
        // Clear old charts
        charts.forEach(c => c.destroy());
        charts = [];
        
        // Setup common chart.js defaults for dark theme
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94A3B8' : '#475569';
        const gridColor = isDark ? '#263A52' : '#E2E8F0';
        
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = 'Inter, sans-serif';

        // 1. Severity Doughnut
        const ctxSev = document.getElementById('chart-severity');
        if (ctxSev) {
            const counts = { critical: 0, high: 0, medium: 0, low: 0 };
            incidents.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });
            
            charts.push(new Chart(ctxSev, {
                type: 'doughnut',
                data: {
                    labels: ['Critical', 'High', 'Medium', 'Low'],
                    datasets: [{
                        data: [counts.critical, counts.high, counts.medium, counts.low],
                        backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#3B82F6'],
                        borderWidth: 0,
                        cutout: '70%'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' }
                    }
                }
            }));
        }

        // 2. Status Bar Chart
        const ctxStat = document.getElementById('chart-status');
        if (ctxStat) {
            const statuses = ['new', 'investigating', 'assigned', 'awaiting_customer', 'resolved'];
            const labels = ['New', 'Investigating', 'Assigned', 'Awaiting Cust', 'Resolved'];
            const data = statuses.map(s => incidents.filter(i => i.status === s).length);
            
            charts.push(new Chart(ctxStat, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Incidents',
                        data: data,
                        backgroundColor: '#3B82F6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: gridColor } },
                        x: { grid: { display: false } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            }));
        }
    }

    function renderLiveFeed(incidents, alerts) {
        const feedContainer = document.getElementById('live-feed');
        if (!feedContainer) return;
        
        // Generate timeline from both incidents and alerts
        let events = [];
        
        // Add incident events
        incidents.slice(0, 20).forEach(i => {
            events.push({
                time: new Date(i.lastUpdated),
                type: 'incident',
                title: `Incident ${i.status}: ${i.id}`,
                desc: i.title,
                class: i.severity === 'critical' ? 'alert' : 'incident'
            });
        });
        
        // Add alert events
        alerts.slice(0, 20).forEach(a => {
            events.push({
                time: new Date(a.detectedAt),
                type: 'alert',
                title: `New Alert: ${a.id}`,
                desc: a.message,
                class: 'alert'
            });
        });
        
        // Sort by time descending and take top 10
        events.sort((a,b) => b.time - a.time);
        events = events.slice(0, 10);
        
        feedContainer.innerHTML = events.map(e => `
            <div class="feed-item ${e.class}">
                <div class="feed-time">${window.GCC.Utils.timeAgo(e.time)}</div>
                <div class="feed-content">
                    <div class="feed-title">${e.title}</div>
                    <div class="feed-desc">${e.desc}</div>
                </div>
            </div>
        `).join('');
    }
    
    function startSLATimers() {
        // Dashboard doesn't have individual timers yet, but if it did, we'd loop them here.
        // We will need this loop for the Incident list view.
        if (rafId) cancelAnimationFrame(rafId);
        
        function tick() {
            // Update any elements with class 'live-sla-timer'
            rafId = requestAnimationFrame(tick);
        }
        tick();
    }

    function cleanup() {
        charts.forEach(c => c.destroy());
        charts = [];
        if (rafId) cancelAnimationFrame(rafId);
    }

    // Register route when script loads
    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/dashboard', renderDashboard, cleanup);
    });

})();
