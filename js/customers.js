/**
 * GCC Dashboard - Customers View
 */
window.GCC = window.GCC || {};

(function() {
    
    function renderCustomers() {
        const customers = window.GCC.Store.get('customers');
        const assets = window.GCC.Store.get('assets');
        const incidents = window.GCC.Store.get('incidents');
        
        // Enrich
        const enriched = customers.map(c => {
            const custAssets = assets.filter(a => a.customerId === c.id);
            const custInc = incidents.filter(i => i.customerId === c.id && !['resolved', 'closed'].includes(i.status));
            return {
                ...c,
                assetCount: custAssets.length,
                incidentCount: custInc.length
            };
        });
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Customers Directory</h1>
                    <p class="page-subtitle">View customer profiles, SLAs, and active issues</p>
                </div>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>ID</th>
                                <th>Tier</th>
                                <th>SLA Profile</th>
                                <th>Assets</th>
                                <th>Active Incidents</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${enriched.map(c => `
                                <tr>
                                    <td style="font-weight: 500;">${c.name}</td>
                                    <td style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">${c.id}</td>
                                    <td>
                                        <span style="color: ${c.tier === 'Platinum' ? '#94A3B8' : (c.tier === 'Gold' ? '#F59E0B' : '#64748B')}; font-weight: 600;">
                                            ${c.tier}
                                        </span>
                                    </td>
                                    <td>${window.GCC.Utils.capitalize(c.slaProfile)}</td>
                                    <td>${c.assetCount}</td>
                                    <td>
                                        ${c.incidentCount > 0 
                                            ? `<span class="status-badge critical">${c.incidentCount}</span>`
                                            : `<span class="status-badge healthy">0</span>`}
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
        window.GCC.Router.register('/customers', renderCustomers);
    });

})();
