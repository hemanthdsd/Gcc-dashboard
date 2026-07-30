/**
 * GCC Dashboard - Alerts View & Logic
 */
window.GCC = window.GCC || {};

(function() {
    
    let activeAlertId = null;

    function renderAlerts() {
        const alerts = window.GCC.Store.get('alerts');
        const assets = window.GCC.Store.get('assets');
        const customers = window.GCC.Store.get('customers');
        
        // Enhance alerts with asset and customer names for display
        const enrichedAlerts = alerts.map(a => {
            const asset = assets.find(as => as.id === a.assetId) || {};
            const customer = customers.find(c => c.id === a.customerId) || {};
            return {
                ...a,
                assetName: asset.hostname || 'Unknown',
                customerName: customer.name || 'Unknown'
            };
        });

        // Filter and sort
        const statusFilter = document.getElementById('alert-status-filter')?.value || 'active';
        let filtered = enrichedAlerts;
        
        if (statusFilter === 'active') {
            filtered = filtered.filter(a => !['resolved', 'suppressed'].includes(a.status));
        } else if (statusFilter !== 'all') {
            filtered = filtered.filter(a => a.status === statusFilter);
        }
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Alert Monitoring</h1>
                    <p class="page-subtitle">Infrastructure and service alerts requiring triage</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="window.GCC.AlertLogic.markAllRead()">
                        <i data-lucide="check-circle"></i> Acknowledge All
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="padding: var(--space-3) var(--space-5);">
                    <div class="header-actions" style="width: 100%; justify-content: space-between;">
                        <div style="display: flex; gap: var(--space-3);">
                            <select id="alert-status-filter" class="form-control" style="width: 150px; padding: 4px 8px;" onchange="window.GCC.AlertLogic.refresh()">
                                <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Active Alerts</option>
                                <option value="new" ${statusFilter === 'new' ? 'selected' : ''}>New Only</option>
                                <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All Alerts</option>
                            </select>
                        </div>
                        <div style="font-size: var(--text-sm); color: var(--text-secondary);">
                            Showing ${filtered.length} alerts
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Severity</th>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Asset</th>
                                <th>Customer</th>
                                <th>Detected</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="8"><div class="empty-state">
                                    <i data-lucide="bell-off" class="empty-icon"></i>
                                    <div class="empty-title">No alerts found</div>
                                </div></td></tr>
                            ` : filtered.map(a => `
                                <tr>
                                    <td><span class="status-badge ${a.severity}">${window.GCC.Utils.capitalize(a.severity)}</span></td>
                                    <td style="font-family: var(--font-mono); font-size: var(--text-xs);">${a.id}</td>
                                    <td>${window.GCC.Utils.capitalize(a.type)}</td>
                                    <td>${a.assetName}</td>
                                    <td>${a.customerName}</td>
                                    <td>${window.GCC.Utils.timeAgo(a.detectedAt)}</td>
                                    <td><span class="status-badge ${a.status === 'new' ? 'warning' : 'info'}">${window.GCC.Utils.capitalize(a.status)}</span></td>
                                    <td>
                                        <button class="btn btn-ghost btn-icon-only" onclick="window.GCC.AlertLogic.openPanel('${a.id}')" title="View Details">
                                            <i data-lucide="eye"></i>
                                        </button>
                                        ${a.status === 'new' ? `
                                        <button class="btn btn-ghost btn-icon-only" style="color: var(--color-low);" onclick="window.GCC.AlertLogic.acknowledge('${a.id}')" title="Acknowledge">
                                            <i data-lucide="check"></i>
                                        </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Slide Panel for Alert Details -->
            <div id="alert-panel-overlay" class="slide-panel-overlay" onclick="window.GCC.AlertLogic.closePanel()"></div>
            <div id="alert-panel" class="slide-panel">
                <div class="modal-header">
                    <h2 class="modal-title" id="ap-title">Alert Details</h2>
                    <button class="modal-close" onclick="window.GCC.AlertLogic.closePanel()"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" id="ap-body">
                    <!-- Populated by JS -->
                </div>
                <div class="modal-footer" id="ap-footer">
                    <!-- Populated by JS -->
                </div>
            </div>
            
            <!-- Create Incident Modal -->
            <div id="create-incident-modal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">Create Incident from Alert</h2>
                        <button class="modal-close" onclick="document.getElementById('create-incident-modal').classList.remove('active')"><i data-lucide="x"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="create-inc-form">
                            <div class="form-group">
                                <label class="form-label">Incident Title</label>
                                <input type="text" id="ci-title" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Priority</label>
                                <select id="ci-priority" class="form-control">
                                    <option value="P1">P1 - Critical</option>
                                    <option value="P2">P2 - High</option>
                                    <option value="P3">P3 - Medium</option>
                                    <option value="P4">P4 - Low</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Initial Investigation Notes</label>
                                <textarea id="ci-notes" class="form-control" placeholder="Add initial notes here..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" onclick="document.getElementById('create-incident-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="window.GCC.AlertLogic.submitIncident()">Create Incident</button>
                    </div>
                </div>
            </div>
        `;
        
        return html;
    }

    // Logic namespace
    window.GCC.AlertLogic = {
        refresh: () => {
            const container = document.getElementById('view-container');
            container.innerHTML = renderAlerts();
            lucide.createIcons();
        },
        
        acknowledge: (id) => {
            window.GCC.Store.update('alerts', id, { 
                status: 'acknowledged', 
                acknowledgedAt: new Date().toISOString() 
            });
            window.GCC.Utils.createToast('Alert Acknowledged', `${id} has been acknowledged.`, 'success');
            window.GCC.AlertLogic.refresh();
        },
        
        markAllRead: () => {
            const alerts = window.GCC.Store.get('alerts');
            let count = 0;
            alerts.forEach(a => {
                if (a.status === 'new') {
                    window.GCC.Store.update('alerts', a.id, { 
                        status: 'acknowledged', 
                        acknowledgedAt: new Date().toISOString() 
                    });
                    count++;
                }
            });
            window.GCC.Utils.createToast('Bulk Action', `${count} alerts acknowledged.`, 'success');
            window.GCC.AlertLogic.refresh();
        },
        
        openPanel: (id) => {
            activeAlertId = id;
            const alert = window.GCC.Store.get('alerts').find(a => a.id === id);
            const asset = window.GCC.Store.get('assets').find(as => as.id === alert.assetId) || {};
            const customer = window.GCC.Store.get('customers').find(c => c.id === alert.customerId) || {};
            
            document.getElementById('ap-title').innerHTML = `Alert ${alert.id} <span class="status-badge ${alert.severity}" style="margin-left: 10px;">${alert.severity}</span>`;
            
            const body = document.getElementById('ap-body');
            body.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="font-size: 12px; color: var(--text-secondary);">Message</div>
                    <div style="font-size: 16px; font-weight: 500; margin-top: 4px;">${alert.message}</div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: var(--bg-elevated); padding: 15px; border-radius: 8px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Type</div>
                        <div style="font-weight: 500;">${window.GCC.Utils.capitalize(alert.type)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Status</div>
                        <div style="font-weight: 500;">${window.GCC.Utils.capitalize(alert.status)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Detected At</div>
                        <div>${window.GCC.Utils.formatDate(alert.detectedAt)}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-secondary);">Asset</div>
                        <div>${asset.hostname || alert.assetId}</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 14px; border-bottom: 1px solid var(--border-default); padding-bottom: 8px; margin-bottom: 12px;">Customer Information</h3>
                    <div><strong>${customer.name}</strong></div>
                    <div style="color: var(--text-secondary); font-size: 13px;">SLA Profile: ${customer.slaProfile}</div>
                </div>
            `;
            
            const footer = document.getElementById('ap-footer');
            footer.innerHTML = `
                <button class="btn btn-ghost" onclick="window.GCC.AlertLogic.closePanel()">Close</button>
                ${alert.status === 'new' ? `<button class="btn btn-secondary" onclick="window.GCC.AlertLogic.acknowledge('${alert.id}'); window.GCC.AlertLogic.closePanel();">Acknowledge</button>` : ''}
                <button class="btn btn-primary" onclick="window.GCC.AlertLogic.showCreateIncident()">Create Incident</button>
            `;
            
            document.getElementById('alert-panel-overlay').classList.add('active');
            document.getElementById('alert-panel').classList.add('active');
        },
        
        closePanel: () => {
            document.getElementById('alert-panel-overlay').classList.remove('active');
            document.getElementById('alert-panel').classList.remove('active');
        },
        
        showCreateIncident: () => {
            const alert = window.GCC.Store.get('alerts').find(a => a.id === activeAlertId);
            const asset = window.GCC.Store.get('assets').find(as => as.id === alert.assetId) || {};
            
            document.getElementById('ci-title').value = `${window.GCC.Utils.capitalize(alert.type).replace('_', ' ')} on ${asset.hostname}`;
            
            let p = 'P3';
            if(alert.severity === 'critical') p = 'P1';
            if(alert.severity === 'high') p = 'P2';
            document.getElementById('ci-priority').value = p;
            
            document.getElementById('create-incident-modal').classList.add('active');
        },
        
        submitIncident: () => {
            const alert = window.GCC.Store.get('alerts').find(a => a.id === activeAlertId);
            const title = document.getElementById('ci-title').value;
            const priority = document.getElementById('ci-priority').value;
            const notes = document.getElementById('ci-notes').value;
            
            const now = new Date().toISOString();
            
            // Generate SLA target
            let limitHours = 8;
            if(priority === 'P1') limitHours = 2;
            if(priority === 'P2') limitHours = 4;
            const target = new Date(Date.now() + (limitHours * 3600000)).toISOString();
            
            const session = window.GCC.Store.getSession();
            
            const newInc = {
                id: window.GCC.Utils.generateId('INC'),
                title: title,
                customerId: alert.customerId,
                siteId: alert.siteId,
                affectedAssetId: alert.assetId,
                severity: alert.severity,
                priority: priority,
                status: 'investigating',
                assignedAnalyst: session.id,
                createdAt: now,
                lastUpdated: now,
                investigationNotes: notes,
                sla: {
                    resolutionTarget: target,
                    breached: false
                },
                linkedAlerts: [alert.id],
                timeline: [
                    {
                        id: window.GCC.Utils.generateId('TL'),
                        timestamp: now,
                        action: "incident_created",
                        performedBy: session.id,
                        details: `Incident created from alert ${alert.id}`
                    }
                ]
            };
            
            window.GCC.Store.add('incidents', newInc);
            window.GCC.Store.update('alerts', alert.id, { status: 'converted', linkedIncidentId: newInc.id });
            
            document.getElementById('create-incident-modal').classList.remove('active');
            window.GCC.AlertLogic.closePanel();
            window.GCC.Utils.createToast('Incident Created', `${newInc.id} has been created and assigned to you.`, 'success');
            
            // Navigate to new incident
            window.location.hash = `#/incidents/${newInc.id}`;
        }
    };

    // Register route
    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/alerts', renderAlerts);
    });

})();
