/**
 * GCC Dashboard - Reports View
 */
window.GCC = window.GCC || {};

(function() {
    
    function renderReports() {
        const type = document.getElementById('report-type')?.value || 'incidents';
        
        let thead = '';
        let tbody = '';
        
        if (type === 'incidents') {
            const incidents = window.GCC.Store.get('incidents');
            thead = `<tr><th>ID</th><th>Severity</th><th>Title</th><th>Status</th><th>Created At</th></tr>`;
            tbody = incidents.map(i => `
                <tr>
                    <td style="font-family: var(--font-mono); font-size: 12px;">${i.id}</td>
                    <td><span class="status-badge ${i.severity}">${i.severity}</span></td>
                    <td>${i.title}</td>
                    <td>${i.status}</td>
                    <td>${window.GCC.Utils.formatDate(i.createdAt)}</td>
                </tr>
            `).join('');
        } else if (type === 'sla') {
            const incidents = window.GCC.Store.get('incidents');
            thead = `<tr><th>ID</th><th>Severity</th><th>Target SLA</th><th>Status</th><th>Breached?</th></tr>`;
            tbody = incidents.map(i => `
                <tr>
                    <td style="font-family: var(--font-mono); font-size: 12px;">${i.id}</td>
                    <td>${i.severity}</td>
                    <td>${window.GCC.Utils.formatDate(i.sla.resolutionTarget)}</td>
                    <td>${i.status}</td>
                    <td>${i.sla.breached ? '<span style="color:var(--color-critical);font-weight:bold;">Yes</span>' : 'No'}</td>
                </tr>
            `).join('');
        }
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Reporting Engine</h1>
                    <p class="page-subtitle">Generate, view, and export operational reports</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-secondary" onclick="window.GCC.ReportLogic.exportCSV()">
                        <i data-lucide="download"></i> Export CSV
                    </button>
                    <button class="btn btn-primary" onclick="window.print()">
                        <i data-lucide="printer"></i> Print Report
                    </button>
                </div>
            </div>

            <div class="card" style="margin-bottom: var(--space-6);">
                <div class="card-body" style="display: flex; gap: var(--space-4); align-items: flex-end;">
                    <div class="form-group" style="margin-bottom: 0; flex: 1;">
                        <label class="form-label">Report Type</label>
                        <select id="report-type" class="form-control" onchange="window.GCC.Router.navigate(window.location.hash)">
                            <option value="incidents" ${type === 'incidents' ? 'selected' : ''}>All Incidents</option>
                            <option value="sla" ${type === 'sla' ? 'selected' : ''}>SLA Compliance</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0; flex: 1;">
                        <label class="form-label">Date Range</label>
                        <select class="form-control">
                            <option>Last 24 Hours</option>
                            <option selected>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <button class="btn btn-secondary" style="height: 38px;">Apply Filters</button>
                </div>
            </div>

            <div class="card" id="printable-report">
                <div class="card-header hide-on-print">
                    <h3 class="card-title">Report Results</h3>
                </div>
                
                <!-- Print Header (only visible when printing) -->
                <div class="print-header" style="display: none; text-align: center; margin-bottom: 20px; padding: 20px;">
                    <h2>GCC Report: ${type === 'incidents' ? 'All Incidents' : 'SLA Compliance'}</h2>
                    <p>Generated: ${window.GCC.Utils.formatDate(new Date().toISOString())}</p>
                </div>

                <div class="table-container">
                    <table class="data-table" id="report-table">
                        <thead>
                            ${thead}
                        </thead>
                        <tbody>
                            ${tbody}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>
                @media print {
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report { position: absolute; left: 0; top: 0; width: 100%; border: none; box-shadow: none; }
                    .hide-on-print { display: none !important; }
                    .print-header { display: block !important; }
                    .data-table th, .data-table td { color: #000; border-bottom: 1px solid #ccc; }
                    .status-badge { border: 1px solid #000; color: #000 !important; background: transparent !important; }
                }
            </style>
        `;
        
        return html;
    }

    window.GCC.ReportLogic = {
        exportCSV: () => {
            const table = document.getElementById('report-table');
            if (!table) return;
            
            let csv = [];
            const rows = table.querySelectorAll('tr');
            
            for (let i = 0; i < rows.length; i++) {
                let row = [], cols = rows[i].querySelectorAll('td, th');
                for (let j = 0; j < cols.length; j++) {
                    let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ');
                    data = data.replace(/"/g, '""');
                    row.push('"' + data + '"');
                }
                csv.push(row.join(','));
            }
            
            const csvFile = new Blob([csv.join('\n')], {type: 'text/csv'});
            const downloadLink = document.createElement('a');
            downloadLink.download = 'gcc_report_' + Date.now() + '.csv';
            downloadLink.href = window.URL.createObjectURL(csvFile);
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            window.GCC.Utils.createToast('Export Complete', 'CSV file downloaded.', 'success');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/reports', renderReports);
    });

})();
