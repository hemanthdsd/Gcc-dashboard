/**
 * GCC Dashboard - Incidents View & Logic
 */
window.GCC = window.GCC || {};

(function() {
    
    let rafId = null;

    function renderIncidentList() {
        const incidents = window.GCC.Store.get('incidents');
        const customers = window.GCC.Store.get('customers');
        const assets = window.GCC.Store.get('assets');
        const session = window.GCC.Store.getSession();
        
        // Enrich
        const enriched = incidents.map(i => {
            const customer = customers.find(c => c.id === i.customerId) || {};
            const asset = assets.find(a => a.id === i.affectedAssetId) || {};
            return {
                ...i,
                customerName: customer.name || 'Unknown',
                assetName: asset.hostname || 'Unknown'
            };
        });
        
        const filter = document.getElementById('inc-filter')?.value || 'active';
        let filtered = enriched;
        
        if (filter === 'active') {
            filtered = filtered.filter(i => !['resolved', 'closed'].includes(i.status));
        } else if (filter === 'mine') {
            filtered = filtered.filter(i => i.assignedAnalyst === session.id && !['resolved', 'closed'].includes(i.status));
        }
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Incident Management</h1>
                    <p class="page-subtitle">Track and resolve operational issues affecting services</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="window.GCC.Utils.createToast('Not Implemented', 'Manual incident creation is mocked. Create from alerts instead.')">
                        <i data-lucide="plus"></i> New Incident
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="padding: var(--space-3) var(--space-5);">
                    <div style="display: flex; gap: var(--space-3);">
                        <select id="inc-filter" class="form-control" style="width: 150px; padding: 4px 8px;" onchange="window.GCC.Router.navigate(window.location.hash)">
                            <option value="active" ${filter === 'active' ? 'selected' : ''}>Active Incidents</option>
                            <option value="mine" ${filter === 'mine' ? 'selected' : ''}>Assigned to Me</option>
                            <option value="all" ${filter === 'all' ? 'selected' : ''}>All Incidents</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Incident</th>
                                <th>Severity</th>
                                <th>Customer</th>
                                <th>Asset</th>
                                <th>Status</th>
                                <th>Owner</th>
                                <th>SLA Remaining</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="8"><div class="empty-state">
                                    <i data-lucide="check-circle" class="empty-icon" style="color: var(--color-healthy); opacity: 1;"></i>
                                    <div class="empty-title">Zero active incidents!</div>
                                </div></td></tr>
                            ` : filtered.map(i => `
                                <tr>
                                    <td>
                                        <div style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">${i.id}</div>
                                        <div style="font-weight: 500; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i.title}</div>
                                    </td>
                                    <td><span class="status-badge ${i.severity}">${window.GCC.Utils.capitalize(i.severity)}</span></td>
                                    <td>${i.customerName}</td>
                                    <td>${i.assetName}</td>
                                    <td><span class="status-badge info">${window.GCC.Utils.capitalize(i.status)}</span></td>
                                    <td>${i.assignedAnalyst ? (i.assignedAnalyst === session.id ? 'Me' : 'Other Analyst') : '<span style="color: var(--color-critical);">Unassigned</span>'}</td>
                                    <td class="sla-cell" data-created="${i.createdAt}" data-target="${i.sla.resolutionTarget}">
                                        ${window.GCC.SLA.renderTimerHtml(i.createdAt, i.sla.resolutionTarget)}
                                    </td>
                                    <td>
                                        <a href="#/incidents/${i.id}" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 12px;">Manage</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        setTimeout(startSLATimers, 100);
        
        return html;
    }

    function renderIncidentDetail(params) {
        const id = params.id;
        const incident = window.GCC.Store.get('incidents').find(i => i.id === id);
        
        if (!incident) {
            return `
                <div class="empty-state">
                    <i data-lucide="alert-triangle" class="empty-icon"></i>
                    <div class="empty-title">Incident not found</div>
                    <a href="#/incidents" class="btn btn-primary" style="margin-top: 20px;">Back to Incidents</a>
                </div>
            `;
        }
        
        const customer = window.GCC.Store.get('customers').find(c => c.id === incident.customerId) || {};
        const asset = window.GCC.Store.get('assets').find(a => a.id === incident.affectedAssetId) || {};
        const session = window.GCC.Store.getSession();
        
        const isMine = incident.assignedAnalyst === session.id;
        
        const html = `
            <div style="margin-bottom: var(--space-4);">
                <a href="#/incidents" style="color: var(--text-secondary); display: inline-flex; align-items: center; gap: 4px; font-size: 13px;">
                    <i data-lucide="arrow-left" width="14" height="14"></i> Back to list
                </a>
            </div>
            
            <div class="page-header" style="align-items: center;">
                <div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <h1 class="page-title">${incident.id}</h1>
                        <span class="status-badge ${incident.severity}">${window.GCC.Utils.capitalize(incident.severity)}</span>
                        <span class="status-badge info">${window.GCC.Utils.capitalize(incident.status)}</span>
                    </div>
                    <p class="page-subtitle" style="font-size: var(--text-md); color: var(--text-primary);">${incident.title}</p>
                </div>
                <div class="page-actions">
                    ${!incident.assignedAnalyst ? 
                        `<button class="btn btn-primary" onclick="window.GCC.IncLogic.assignToMe('${id}')">Assign to Me</button>` 
                        : (isMine && !['resolved', 'closed'].includes(incident.status) ? 
                        `<button class="btn btn-secondary" onclick="window.GCC.IncLogic.markResolved('${id}')"><i data-lucide="check"></i> Mark Resolved</button>` 
                        : '')}
                </div>
            </div>

            <!-- Top metrics row -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6);">
                <div class="card" style="padding: var(--space-4);">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Customer</div>
                    <div style="font-weight: 500;">${customer.name}</div>
                </div>
                <div class="card" style="padding: var(--space-4);">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Affected Asset</div>
                    <div style="font-weight: 500;">${asset.hostname || 'Unknown'}</div>
                </div>
                <div class="card" style="padding: var(--space-4);">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Time Open</div>
                    <div style="font-weight: 500;">${window.GCC.Utils.timeAgo(incident.createdAt)}</div>
                </div>
                <div class="card" style="padding: var(--space-4);">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Resolution Target (SLA)</div>
                    <div class="sla-cell" data-created="${incident.createdAt}" data-target="${incident.sla.resolutionTarget}">
                        ${window.GCC.SLA.renderTimerHtml(incident.createdAt, incident.sla.resolutionTarget)}
                    </div>
                </div>
            </div>

            <!-- Main content grid -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-6);">
                
                <!-- Left column: Details & Timeline -->
                <div style="display: flex; flex-direction: column; gap: var(--space-6);">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Investigation Details</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label class="form-label">Notes</label>
                                <textarea id="inc-notes" class="form-control" ${!isMine ? 'disabled' : ''}>${incident.investigationNotes || ''}</textarea>
                            </div>
                            ${isMine ? `<button class="btn btn-secondary btn-sm" onclick="window.GCC.IncLogic.saveNotes('${id}')">Save Notes</button>` : ''}
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Timeline</h3>
                        </div>
                        <div class="card-body" style="max-height: 400px; overflow-y: auto;">
                            <div style="position: relative; border-left: 2px solid var(--border-default); padding-left: 20px; margin-left: 10px;">
                                ${(incident.timeline || []).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(t => `
                                    <div style="position: relative; margin-bottom: 20px;">
                                        <div style="position: absolute; left: -26px; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--accent-primary); border: 2px solid var(--bg-card);"></div>
                                        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">
                                            ${window.GCC.Utils.formatDate(t.timestamp)} • ${t.performedBy}
                                        </div>
                                        <div style="font-size: 14px;">${t.details}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right column: Comms & Escalation -->
                <div style="display: flex; flex-direction: column; gap: var(--space-6);">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Communications</h3>
                        </div>
                        <div class="card-body">
                            ${(incident.communications || []).length === 0 ? `
                                <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No communications logged.</div>
                            ` : (incident.communications || []).map(c => `
                                <div style="padding: 10px; background: var(--bg-elevated); border-radius: 6px; margin-bottom: 10px; font-size: 13px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: var(--text-secondary);">
                                        <span><i data-lucide="mail" width="12" height="12"></i> ${c.recipient}</span>
                                        <span style="font-family: var(--font-mono); font-size: 11px;">${window.GCC.Utils.timeAgo(c.timestamp)}</span>
                                    </div>
                                    <div>${c.summary}</div>
                                </div>
                            `).join('')}
                            
                            ${isMine ? `
                                <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" onclick="window.GCC.IncLogic.openCommModal()">
                                    <i data-lucide="send"></i> Log Customer Update
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Escalations</h3>
                        </div>
                        <div class="card-body">
                            ${(incident.escalations || []).length === 0 ? `
                                <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">Not escalated.</div>
                            ` : (incident.escalations || []).map(e => `
                                <div style="padding: 10px; border-left: 3px solid var(--color-high); background: var(--bg-elevated); margin-bottom: 10px; font-size: 13px;">
                                    <div style="font-weight: 500; margin-bottom: 4px;">Escalated to: ${e.escalatedTo}</div>
                                    <div style="color: var(--text-secondary);">${e.reason}</div>
                                    <div style="font-family: var(--font-mono); font-size: 11px; margin-top: 4px; color: var(--text-muted);">${window.GCC.Utils.timeAgo(e.timestamp)}</div>
                                </div>
                            `).join('')}
                            
                            ${isMine && (incident.escalations || []).length === 0 ? `
                                <button class="btn btn-ghost" style="width: 100%; margin-top: 10px; color: var(--color-high);" onclick="window.GCC.IncLogic.openEscalateModal()">
                                    <i data-lucide="alert-triangle"></i> Escalate to L2/L3
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modals for Phase 3 (Comms & Escalation) -->
            <!-- Communication Modal -->
            <div id="comm-modal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">Log Customer Communication</h2>
                        <button class="modal-close" onclick="document.getElementById('comm-modal').classList.remove('active')"><i data-lucide="x"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="comm-form">
                            <div class="form-group">
                                <label class="form-label">Template</label>
                                <select id="comm-template" class="form-control">
                                    <option value="investigation_update">Investigation Update</option>
                                    <option value="incident_acknowledgement">Incident Acknowledgement</option>
                                    <option value="sla_warning">SLA Warning</option>
                                    <option value="resolution">Resolution Notification</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Recipient</label>
                                <input type="text" id="comm-recipient" class="form-control" value="${customer.contactEmail || 'customer@example.com'}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Message Summary</label>
                                <textarea id="comm-summary" class="form-control" rows="3" placeholder="Brief summary of what was sent..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" onclick="document.getElementById('comm-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="window.GCC.IncLogic.sendComm('${id}')">Send Update</button>
                    </div>
                </div>
            </div>

            <!-- Escalation Modal -->
            <div id="escalate-modal" class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h2 class="modal-title">Escalate Incident</h2>
                        <button class="modal-close" onclick="document.getElementById('escalate-modal').classList.remove('active')"><i data-lucide="x"></i></button>
                    </div>
                    <div class="modal-body">
                        <form id="escalate-form">
                            <div class="form-group">
                                <label class="form-label">Escalate To</label>
                                <select id="esc-target" class="form-control">
                                    <option value="L2 Network Team">L2 Network Team</option>
                                    <option value="L3 Infrastructure">L3 Infrastructure</option>
                                    <option value="Shift Manager">Shift Manager</option>
                                    <option value="Vendor Support">Vendor Support</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Reason for Escalation</label>
                                <textarea id="esc-reason" class="form-control" rows="3" placeholder="Explain why this requires escalation..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" onclick="document.getElementById('escalate-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-danger" onclick="window.GCC.IncLogic.submitEscalation('${id}')">Confirm Escalation</button>
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(startSLATimers, 100);
        return html;
    }
    
    function startSLATimers() {
        if (rafId) cancelAnimationFrame(rafId);
        
        const cells = document.querySelectorAll('.sla-cell');
        if (cells.length === 0) return;
        
        function tick() {
            cells.forEach(cell => {
                const created = cell.getAttribute('data-created');
                const target = cell.getAttribute('data-target');
                if (created && target) {
                    cell.innerHTML = window.GCC.SLA.renderTimerHtml(created, target);
                }
            });
            // Also re-init icons for the newly injected HTML
            if (window.lucide) {
                // To avoid massive performance hit, only update icons inside sla-cells if needed. 
                // Since the timer icon is static, we could just render it as SVG directly in renderTimerHtml, 
                // but let's just use lucide.createIcons on the cells.
                lucide.createIcons({
                    nameAttr: 'data-lucide',
                    attrs: {
                        class: "lucide lucide-clock",
                        width: 16, height: 16,
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        "stroke-width": 2,
                        "stroke-linecap": "round",
                        "stroke-linejoin": "round"
                    }
                });
            }
            
            // Only update every 1 second to save CPU instead of every frame
            setTimeout(() => {
                rafId = requestAnimationFrame(tick);
            }, 1000);
        }
        tick();
    }
    
    function cleanup() {
        if (rafId) cancelAnimationFrame(rafId);
    }

    // Logic namespace
    window.GCC.IncLogic = {
        assignToMe: (id) => {
            const session = window.GCC.Store.getSession();
            const now = new Date().toISOString();
            
            const incident = window.GCC.Store.get('incidents').find(i => i.id === id);
            const newTimeline = [...(incident.timeline || []), {
                id: window.GCC.Utils.generateId('TL'),
                timestamp: now,
                action: "assigned",
                performedBy: session.id,
                details: `Assigned to ${session.name}`
            }];
            
            window.GCC.Store.update('incidents', id, { 
                assignedAnalyst: session.id,
                status: incident.status === 'new' ? 'investigating' : incident.status,
                timeline: newTimeline
            });
            
            window.GCC.Utils.createToast('Assigned', `Incident ${id} assigned to you.`, 'success');
            window.GCC.Router.navigate(window.location.hash); // re-render
        },
        
        saveNotes: (id) => {
            const notes = document.getElementById('inc-notes').value;
            window.GCC.Store.update('incidents', id, { investigationNotes: notes });
            window.GCC.Utils.createToast('Saved', `Notes saved successfully.`, 'success');
        },
        
        markResolved: (id) => {
            const session = window.GCC.Store.getSession();
            const now = new Date().toISOString();
            const incident = window.GCC.Store.get('incidents').find(i => i.id === id);
            
            const newTimeline = [...(incident.timeline || []), {
                id: window.GCC.Utils.generateId('TL'),
                timestamp: now,
                action: "resolved",
                performedBy: session.id,
                details: `Incident marked as resolved.`
            }];
            
            window.GCC.Store.update('incidents', id, { 
                status: 'resolved',
                resolvedAt: now,
                timeline: newTimeline
            });
            
            window.GCC.Utils.createToast('Resolved', `Incident ${id} resolved.`, 'success');
            window.GCC.Router.navigate(window.location.hash); // re-render
        },
        
        openCommModal: () => {
            document.getElementById('comm-modal').classList.add('active');
        },
        
        sendComm: (id) => {
            const template = document.getElementById('comm-template').value;
            const recipient = document.getElementById('comm-recipient').value;
            const summary = document.getElementById('comm-summary').value;
            
            if(!summary) {
                alert("Please provide a summary.");
                return;
            }
            
            const session = window.GCC.Store.getSession();
            const now = new Date().toISOString();
            const incident = window.GCC.Store.get('incidents').find(i => i.id === id);
            
            const newComm = {
                id: window.GCC.Utils.generateId('COM'),
                timestamp: now,
                template: template,
                channel: "email",
                recipient: recipient,
                summary: summary,
                sentBy: session.id
            };
            
            const newTimeline = [...(incident.timeline || []), {
                id: window.GCC.Utils.generateId('TL'),
                timestamp: now,
                action: "customer_update",
                performedBy: session.id,
                details: `Sent customer update: ${window.GCC.Utils.capitalize(template).replace('_', ' ')}`
            }];
            
            window.GCC.Store.update('incidents', id, {
                communications: [...(incident.communications || []), newComm],
                timeline: newTimeline,
                status: (template === 'investigation_update' && incident.status === 'investigating') ? 'monitoring' : incident.status
            });
            
            document.getElementById('comm-modal').classList.remove('active');
            window.GCC.Utils.createToast('Success', 'Customer update logged.', 'success');
            window.GCC.Router.navigate(window.location.hash);
        },
        
        openEscalateModal: () => {
            document.getElementById('escalate-modal').classList.add('active');
        },
        
        submitEscalation: (id) => {
            const target = document.getElementById('esc-target').value;
            const reason = document.getElementById('esc-reason').value;
            
            if(!reason) {
                alert("Please provide a reason.");
                return;
            }
            
            const session = window.GCC.Store.getSession();
            const now = new Date().toISOString();
            const incident = window.GCC.Store.get('incidents').find(i => i.id === id);
            
            const newEsc = {
                id: window.GCC.Utils.generateId('ESC'),
                timestamp: now,
                escalatedTo: target,
                reason: reason,
                escalatedBy: session.id
            };
            
            const newTimeline = [...(incident.timeline || []), {
                id: window.GCC.Utils.generateId('TL'),
                timestamp: now,
                action: "escalated",
                performedBy: session.id,
                details: `Escalated to ${target}`
            }];
            
            window.GCC.Store.update('incidents', id, {
                escalations: [...(incident.escalations || []), newEsc],
                timeline: newTimeline,
                priority: 'P1', // Automagic bump
                severity: incident.severity === 'medium' ? 'high' : incident.severity
            });
            
            document.getElementById('escalate-modal').classList.remove('active');
            window.GCC.Utils.createToast('Escalated', `Incident escalated to ${target}.`, 'warning');
            window.GCC.Router.navigate(window.location.hash);
        }
    };

    // Register routes
    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/incidents', renderIncidentList, cleanup);
        window.GCC.Router.register('/incidents/:id', renderIncidentDetail, cleanup);
    });

})();
