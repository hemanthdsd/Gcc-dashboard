/**
 * GCC Dashboard - Customer Requests View & Logic
 */
window.GCC = window.GCC || {};

(function() {
    
    function renderRequests() {
        const requests = window.GCC.Store.get('requests');
        const customers = window.GCC.Store.get('customers');
        const session = window.GCC.Store.getSession();
        
        // Enrich
        const enriched = requests.map(r => {
            const customer = customers.find(c => c.id === r.customerId) || {};
            return {
                ...r,
                customerName: customer.name || 'Unknown'
            };
        });

        const filter = document.getElementById('req-filter')?.value || 'active';
        let filtered = enriched;
        
        if (filter === 'active') {
            filtered = filtered.filter(r => !['completed', 'cancelled'].includes(r.status));
        }
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Customer Requests</h1>
                    <p class="page-subtitle">Track and fulfill manual requests from data centre customers</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-primary" onclick="window.GCC.Utils.createToast('Create', 'Form opens here')">
                        <i data-lucide="plus"></i> New Request
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="padding: var(--space-3) var(--space-5);">
                    <div style="display: flex; gap: var(--space-3);">
                        <select id="req-filter" class="form-control" style="width: 150px; padding: 4px 8px;" onchange="window.GCC.Router.navigate(window.location.hash)">
                            <option value="active" ${filter === 'active' ? 'selected' : ''}>Active Requests</option>
                            <option value="all" ${filter === 'all' ? 'selected' : ''}>All Requests</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="6"><div class="empty-state">
                                    <i data-lucide="check-circle" class="empty-icon" style="color: var(--color-healthy); opacity: 1;"></i>
                                    <div class="empty-title">All customer requests fulfilled</div>
                                </div></td></tr>
                            ` : filtered.map(r => `
                                <tr>
                                    <td style="font-family: var(--font-mono); font-size: var(--text-xs);">${r.id}</td>
                                    <td>${r.customerName}</td>
                                    <td>${window.GCC.Utils.capitalize(r.type)}</td>
                                    <td><span class="status-badge ${r.status === 'new' ? 'warning' : (r.status === 'completed' ? 'success' : 'info')}">${window.GCC.Utils.capitalize(r.status)}</span></td>
                                    <td>${window.GCC.Utils.timeAgo(r.createdAt)}</td>
                                    <td>
                                        ${r.status !== 'completed' ? `
                                        <button class="btn btn-ghost btn-sm" onclick="window.GCC.ReqLogic.complete('${r.id}')" style="color: var(--color-healthy);">
                                            <i data-lucide="check"></i> Complete
                                        </button>
                                        ` : `
                                        <span style="color: var(--text-muted); font-size: 12px;">Completed</span>
                                        `}
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

    // Logic namespace
    window.GCC.ReqLogic = {
        complete: (id) => {
            if(confirm(`Mark request ${id} as completed?`)) {
                window.GCC.Store.update('requests', id, { 
                    status: 'completed',
                    completedAt: new Date().toISOString()
                });
                window.GCC.Utils.createToast('Success', `Request ${id} completed.`, 'success');
                window.GCC.Router.navigate(window.location.hash);
            }
        }
    };

    // Register route
    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/requests', renderRequests);
    });

})();
