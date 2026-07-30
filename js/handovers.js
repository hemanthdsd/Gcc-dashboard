/**
 * GCC Dashboard - Shift Handovers View & Logic
 */
window.GCC = window.GCC || {};

(function() {
    
    function renderHandovers() {
        const handovers = window.GCC.Store.get('handovers');
        const session = window.GCC.Store.getSession();
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Shift Handover</h1>
                    <p class="page-subtitle">Structured handover reports between outgoing and incoming shifts</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="window.GCC.HandoverLogic.openCreateModal()">
                        <i data-lucide="plus"></i> Start Handover
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Shift</th>
                                <th>Outgoing</th>
                                <th>Incoming</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${handovers.length === 0 ? `
                                <tr><td colspan="7"><div class="empty-state">
                                    <i data-lucide="clipboard-list" class="empty-icon"></i>
                                    <div class="empty-title">No handovers found</div>
                                </div></td></tr>
                            ` : handovers.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).map(h => `
                                <tr>
                                    <td style="font-family: var(--font-mono); font-size: var(--text-xs);">${h.id}</td>
                                    <td>${h.shiftDate}</td>
                                    <td>${h.shiftTime}</td>
                                    <td>${h.outgoingAnalystName || h.outgoingAnalyst}</td>
                                    <td>${h.incomingAnalystName || h.incomingAnalyst}</td>
                                    <td><span class="status-badge ${h.status === 'approved' ? 'success' : (h.status === 'submitted' ? 'warning' : 'info')}">${window.GCC.Utils.capitalize(h.status)}</span></td>
                                    <td>
                                        <button class="btn btn-ghost btn-sm" onclick="window.GCC.HandoverLogic.view('${h.id}')" title="View Report">
                                            <i data-lucide="eye"></i>
                                        </button>
                                        <button class="btn btn-ghost btn-sm" onclick="window.print()" title="Print">
                                            <i data-lucide="printer"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Create Handover Modal -->
            <div id="handover-modal" class="modal-overlay">
                <div class="modal" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2 class="modal-title">Create Shift Handover</h2>
                        <button class="modal-close" onclick="document.getElementById('handover-modal').classList.remove('active')"><i data-lucide="x"></i></button>
                    </div>
                    <div class="modal-body" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);">
                        <div style="grid-column: span 2; padding: 10px; background: var(--bg-elevated); border-radius: 6px; margin-bottom: 10px;">
                            <i data-lucide="info" width="16" height="16" style="display: inline-block; vertical-align: middle; margin-right: 5px; color: var(--color-low);"></i>
                            Current open critical incidents, near SLA breaches, and unassigned tickets will be automatically attached to this handover report.
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Incoming Analyst / Shift Lead</label>
                            <input type="text" id="ho-incoming" class="form-control" placeholder="Name of person taking over...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Shift Details</label>
                            <input type="text" id="ho-shift" class="form-control" value="06:00 - 14:00 -> 14:00 - 22:00">
                        </div>
                        
                        <div class="form-group" style="grid-column: span 2;">
                            <label class="form-label">Monitoring Observations (Network, Environment, Security)</label>
                            <textarea id="ho-monitoring" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group" style="grid-column: span 2;">
                            <label class="form-label">Follow-up Actions Required</label>
                            <textarea id="ho-actions" class="form-control" rows="3" placeholder="Tasks that must be completed in the next shift..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" onclick="document.getElementById('handover-modal').classList.remove('active')">Cancel</button>
                        <button class="btn btn-primary" onclick="window.GCC.HandoverLogic.submit()">Submit Handover</button>
                    </div>
                </div>
            </div>
            
            <!-- View Handover Modal (Printable) -->
            <div id="view-handover-modal" class="modal-overlay">
                <div class="modal" style="max-width: 800px;" id="printable-handover">
                    <div class="modal-header hide-on-print">
                        <h2 class="modal-title">Handover Report</h2>
                        <div>
                            <button class="btn btn-ghost btn-sm" onclick="window.print()"><i data-lucide="printer"></i> Print</button>
                            <button class="modal-close" style="margin-left: 10px;" onclick="document.getElementById('view-handover-modal').classList.remove('active')"><i data-lucide="x"></i></button>
                        </div>
                    </div>
                    <div class="modal-body" id="vh-content">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>
            
            <style>
                @media print {
                    body * { visibility: hidden; }
                    #printable-handover, #printable-handover * { visibility: visible; }
                    #printable-handover { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
                    .hide-on-print { display: none !important; }
                    .status-badge { border: 1px solid #000; color: #000 !important; background: transparent !important; }
                }
            </style>
        `;
        
        return html;
    }

    window.GCC.HandoverLogic = {
        openCreateModal: () => {
            document.getElementById('handover-modal').classList.add('active');
        },
        
        submit: () => {
            const incoming = document.getElementById('ho-incoming').value;
            const shift = document.getElementById('ho-shift').value;
            const monitoring = document.getElementById('ho-monitoring').value;
            const actions = document.getElementById('ho-actions').value;
            
            if(!incoming) {
                alert("Please specify incoming analyst.");
                return;
            }
            
            const session = window.GCC.Store.getSession();
            const incidents = window.GCC.Store.get('incidents');
            
            // Auto-gather data
            const openCritical = incidents.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).map(i => i.id);
            const nearBreach = incidents.filter(i => !['resolved', 'closed'].includes(i.status) && !i.sla.breached && window.GCC.SLA.calculateState(i.createdAt, i.sla.resolutionTarget).status === 'critical').map(i => i.id);
            
            const newHo = {
                id: window.GCC.Utils.generateId('HND'),
                outgoingAnalyst: session.id,
                outgoingAnalystName: session.name,
                incomingAnalyst: "USR-NEXT", // mock
                incomingAnalystName: incoming,
                shiftDate: window.GCC.Utils.formatDate(new Date().toISOString(), false),
                shiftTime: shift,
                status: 'submitted',
                openCriticalIncidents: openCritical,
                approachingSLA: nearBreach,
                monitoringObservations: monitoring,
                followUpActions: actions,
                createdAt: new Date().toISOString()
            };
            
            window.GCC.Store.add('handovers', newHo);
            document.getElementById('handover-modal').classList.remove('active');
            window.GCC.Utils.createToast('Success', 'Handover submitted successfully.', 'success');
            window.GCC.Router.navigate(window.location.hash);
        },
        
        view: (id) => {
            const handover = window.GCC.Store.get('handovers').find(h => h.id === id);
            
            let html = `
                <div style="text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid var(--border-default);">
                    <h2>GCC Shift Handover Report</h2>
                    <p style="color: var(--text-secondary);">${handover.shiftDate} | ${handover.shiftTime}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div><strong>Outgoing:</strong> ${handover.outgoingAnalystName || handover.outgoingAnalyst}</div>
                    <div><strong>Incoming:</strong> ${handover.incomingAnalystName || handover.incomingAnalyst}</div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid var(--border-default); padding-bottom: 5px; margin-bottom: 10px;">Critical Incidents Attached</h3>
                    ${(handover.openCriticalIncidents || []).length > 0 
                        ? `<ul style="list-style: disc; padding-left: 20px;">${handover.openCriticalIncidents.map(id => `<li>${id}</li>`).join('')}</ul>`
                        : `<p style="color: var(--text-muted); font-style: italic;">None</p>`}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid var(--border-default); padding-bottom: 5px; margin-bottom: 10px;">Incidents Approaching SLA</h3>
                    ${(handover.approachingSLA || []).length > 0 
                        ? `<ul style="list-style: disc; padding-left: 20px;">${handover.approachingSLA.map(id => `<li>${id}</li>`).join('')}</ul>`
                        : `<p style="color: var(--text-muted); font-style: italic;">None</p>`}
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid var(--border-default); padding-bottom: 5px; margin-bottom: 10px;">Monitoring Observations</h3>
                    <p style="white-space: pre-wrap;">${handover.monitoringObservations || 'No specific observations.'}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="border-bottom: 1px solid var(--border-default); padding-bottom: 5px; margin-bottom: 10px;">Follow-up Actions Required</h3>
                    <p style="white-space: pre-wrap;">${handover.followUpActions || 'No follow-up actions required.'}</p>
                </div>
                
                <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                    <div style="border-top: 1px dashed var(--border-default); padding-top: 10px; text-align: center;">Outgoing Signature</div>
                    <div style="border-top: 1px dashed var(--border-default); padding-top: 10px; text-align: center;">Incoming Signature</div>
                </div>
            `;
            
            document.getElementById('vh-content').innerHTML = html;
            document.getElementById('view-handover-modal').classList.add('active');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/handovers', renderHandovers);
    });

})();
