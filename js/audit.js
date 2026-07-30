/**
 * GCC Dashboard - Audit Log View
 */
window.GCC = window.GCC || {};

(function() {
    
    function renderAuditLog() {
        // Since we didn't strictly mock a dedicated auditLog array in mock-data, 
        // we'll synthesize one by extracting timeline events from all incidents for demonstration.
        // In a real app, Store.auditLog would exist as a separate collection.
        
        const incidents = window.GCC.Store.get('incidents');
        let auditEvents = [];
        
        incidents.forEach(inc => {
            if (inc.timeline) {
                inc.timeline.forEach(tl => {
                    auditEvents.push({
                        id: tl.id,
                        timestamp: tl.timestamp,
                        userId: tl.performedBy,
                        action: tl.action,
                        entityType: 'incident',
                        entityId: inc.id,
                        details: tl.details
                    });
                });
            }
        });
        
        // Sort descending
        auditEvents.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Audit Log</h1>
                    <p class="page-subtitle">Chronological record of system actions and workflow transitions</p>
                </div>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Entity Type</th>
                                <th>Entity ID</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${auditEvents.length === 0 ? `
                                <tr><td colspan="6"><div class="empty-state">
                                    <div class="empty-title">No audit records found</div>
                                </div></td></tr>
                            ` : auditEvents.map(e => `
                                <tr>
                                    <td style="font-family: var(--font-mono); font-size: 12px; color: var(--text-secondary);">
                                        ${window.GCC.Utils.formatDate(e.timestamp)}
                                    </td>
                                    <td><span style="font-weight: 500;">${e.userId}</span></td>
                                    <td><span class="status-badge info">${window.GCC.Utils.capitalize(e.action).replace('_', ' ')}</span></td>
                                    <td>${window.GCC.Utils.capitalize(e.entityType)}</td>
                                    <td style="font-family: var(--font-mono); font-size: 12px;">${e.entityId}</td>
                                    <td style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${window.GCC.Utils.escapeHtml(e.details)}">
                                        ${window.GCC.Utils.escapeHtml(e.details)}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return html;
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/audit', renderAuditLog);
    });

})();
