/**
 * GCC Dashboard - Assets View
 */
window.GCC = window.GCC || {};

(function() {
    
    let activeAssetId = null;

    function renderAssets() {
        const assets = window.GCC.Store.get('assets');
        const customers = window.GCC.Store.get('customers');
        const sites = window.GCC.Store.get('sites');
        
        // Enrich
        const enriched = assets.map(a => {
            const cust = customers.find(c => c.id === a.customerId) || {};
            const site = sites.find(s => s.id === a.siteId) || {};
            return {
                ...a,
                customerName: cust.name || 'Unknown',
                siteName: site.name || 'Unknown'
            };
        });
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Asset Register</h1>
                    <p class="page-subtitle">Hardware inventory and status</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="padding: var(--space-3) var(--space-5);">
                    <div style="display: flex; gap: var(--space-3); width: 100%;">
                        <div class="header-search" style="flex: 1;">
                            <i data-lucide="search" class="search-icon"></i>
                            <input type="text" id="asset-search" placeholder="Search by hostname, ID, or IP..." onkeyup="window.GCC.AssetLogic.filter()">
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Hostname</th>
                                <th>ID</th>
                                <th>Type</th>
                                <th>Customer</th>
                                <th>Site</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="asset-tbody">
                            ${renderAssetRows(enriched)}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Asset Slide Panel -->
            <div id="asset-panel-overlay" class="slide-panel-overlay" onclick="window.GCC.AssetLogic.closePanel()"></div>
            <div id="asset-panel" class="slide-panel">
                <div class="modal-header">
                    <h2 class="modal-title" id="ast-title">Asset Details</h2>
                    <button class="modal-close" onclick="window.GCC.AssetLogic.closePanel()"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" id="ast-body">
                    <!-- Populated by JS -->
                </div>
            </div>
        `;
        
        // Save enriched for filtering
        window.GCC.AssetLogic.data = enriched;
        
        return html;
    }
    
    function renderAssetRows(assets) {
        if(assets.length === 0) {
            return `<tr><td colspan="7"><div class="empty-state"><div class="empty-title">No assets found</div></div></td></tr>`;
        }
        return assets.map(a => `
            <tr>
                <td style="font-weight: 500;">${a.hostname}</td>
                <td style="font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">${a.id}</td>
                <td>${window.GCC.Utils.capitalize(a.type)}</td>
                <td>${a.customerName}</td>
                <td>${a.siteName}</td>
                <td><span class="status-badge ${a.status === 'online' ? 'success' : (a.status === 'critical' ? 'critical' : 'warning')}">${window.GCC.Utils.capitalize(a.status)}</span></td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="window.GCC.AssetLogic.openPanel('${a.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    window.GCC.AssetLogic = {
        data: [],
        
        filter: () => {
            const query = document.getElementById('asset-search').value.toLowerCase();
            const filtered = window.GCC.AssetLogic.data.filter(a => 
                a.hostname.toLowerCase().includes(query) || 
                a.id.toLowerCase().includes(query) ||
                a.customerName.toLowerCase().includes(query)
            );
            document.getElementById('asset-tbody').innerHTML = renderAssetRows(filtered);
            lucide.createIcons();
        },
        
        openPanel: (id) => {
            const asset = window.GCC.AssetLogic.data.find(a => a.id === id);
            activeAssetId = id;
            
            document.getElementById('ast-title').innerHTML = `Asset: ${asset.hostname}`;
            
            document.getElementById('ast-body').innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><div style="color: var(--text-secondary); font-size: 12px;">ID</div><div>${asset.id}</div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Status</div><div><span class="status-badge ${asset.status === 'online' ? 'success' : 'critical'}">${window.GCC.Utils.capitalize(asset.status)}</span></div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Type</div><div>${window.GCC.Utils.capitalize(asset.type)}</div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Customer</div><div>${asset.customerName}</div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Site</div><div>${asset.siteName}</div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Data Hall / Rack</div><div>DH-A / ${asset.id.split('-')[1] || 'R-1'}</div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Manufacturer</div><div>Dell EMC</div></div>
                    <div><div style="color: var(--text-secondary); font-size: 12px;">Serial Number</div><div>SN-${Math.floor(Math.random()*1000000)}</div></div>
                </div>
                
                <h3 style="border-bottom: 1px solid var(--border-default); padding-bottom: 5px; margin-bottom: 10px; margin-top: 20px;">Recent Incidents</h3>
                <div style="color: var(--text-muted); font-size: 13px;">No recent incidents found for this asset.</div>
            `;
            
            document.getElementById('asset-panel-overlay').classList.add('active');
            document.getElementById('asset-panel').classList.add('active');
        },
        
        closePanel: () => {
            document.getElementById('asset-panel-overlay').classList.remove('active');
            document.getElementById('asset-panel').classList.remove('active');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/assets', renderAssets);
    });

})();
