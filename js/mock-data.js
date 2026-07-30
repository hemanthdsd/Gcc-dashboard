/**
 * GCC Dashboard Mock Data Generator
 * Seeds the application with realistic initial data
 */
window.GCC = window.GCC || {};

window.GCC.MockData = (function() {
    const NOW = new Date('2026-07-30T14:30:00Z').getTime(); // Anchor point for demo
    
    const customers = [
        { id: "CUST-001", name: "FinTrust Banking", tier: "Platinum", slaProfile: "critical" },
        { id: "CUST-002", name: "HealthCore Systems", tier: "Platinum", slaProfile: "critical" },
        { id: "CUST-003", name: "Nova Telecom", tier: "Gold", slaProfile: "high" },
        { id: "CUST-004", name: "RetailCloud Europe", tier: "Silver", slaProfile: "medium" },
        { id: "CUST-005", name: "Global Media Svcs", tier: "Gold", slaProfile: "high" }
    ];
    
    const sites = [
        { id: "SITE-LON-01", name: "London DC1", location: "London, UK" },
        { id: "SITE-FRA-02", name: "Frankfurt DC2", location: "Frankfurt, DE" },
        { id: "SITE-AMS-03", name: "Amsterdam DC3", location: "Amsterdam, NL" }
    ];
    
    const severities = ["critical", "high", "medium", "low"];
    const alertTypes = ["server_unreachable", "high_cpu", "high_memory", "disk_warning", "network_fail", "temp_warning", "power_warning"];
    
    // Helper to get random item
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // Helper to get random date in past N hours
    const randomDate = (hoursAgo) => new Date(NOW - Math.random() * hoursAgo * 3600000).toISOString();

    function generateAssets() {
        const assets = [];
        for (let i = 1; i <= 50; i++) {
            const customer = random(customers);
            const site = random(sites);
            const type = random(["server", "switch", "router", "firewall", "storage"]);
            assets.push({
                id: `AST-${i.toString().padStart(3, '0')}`,
                customerId: customer.id,
                siteId: site.id,
                type: type,
                hostname: `${customer.name.substring(0,2).toUpperCase()}-${type.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*99)}`,
                status: random(["online", "online", "online", "warning", "critical"])
            });
        }
        return assets;
    }

    function generateAlerts(assets) {
        const alerts = [];
        for (let i = 1; i <= 100; i++) {
            const asset = random(assets);
            const sev = random(severities);
            const status = random(["new", "new", "acknowledged", "investigating", "resolved"]);
            
            alerts.push({
                id: `ALR-${i.toString().padStart(4, '0')}`,
                customerId: asset.customerId,
                siteId: asset.siteId,
                assetId: asset.id,
                type: random(alertTypes),
                severity: sev,
                message: `Threshold exceeded for ${asset.hostname}`,
                detectedAt: randomDate(24),
                status: status,
                isDuplicate: false
            });
        }
        // Sort newest first
        return alerts.sort((a,b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    }

    function generateIncidents(assets) {
        const incidents = [];
        for (let i = 1; i <= 40; i++) {
            const asset = random(assets);
            const sev = random(severities);
            const isResolved = Math.random() > 0.7;
            const status = isResolved ? "resolved" : random(["new", "investigating", "assigned", "awaiting_customer"]);
            
            const createdAt = randomDate(48);
            
            // Mock SLA target (2 hours from creation for demo purposes)
            const createdMs = new Date(createdAt).getTime();
            const slaLimit = sev === 'critical' ? 2 : (sev === 'high' ? 4 : 8); // hours
            const resolutionTarget = new Date(createdMs + (slaLimit * 3600000)).toISOString();
            
            incidents.push({
                id: `INC-${i.toString().padStart(4, '0')}`,
                title: `${random(alertTypes).replace('_', ' ').toUpperCase()} on ${asset.hostname}`,
                customerId: asset.customerId,
                siteId: asset.siteId,
                affectedAssetId: asset.id,
                severity: sev,
                status: status,
                assignedAnalyst: Math.random() > 0.3 ? "USR-001" : null,
                createdAt: createdAt,
                lastUpdated: createdAt,
                sla: {
                    resolutionTarget: resolutionTarget,
                    breached: !isResolved && (new Date(resolutionTarget).getTime() < NOW)
                }
            });
        }
        return incidents.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    function generateRequests(customers) {
        const reqs = [];
        for (let i = 1; i <= 25; i++) {
            reqs.push({
                id: `REQ-${i.toString().padStart(4, '0')}`,
                customerId: random(customers).id,
                type: random(["physical_device_reboot", "cable_inspection", "vendor_access"]),
                status: random(["new", "in_progress", "completed"]),
                createdAt: randomDate(72)
            });
        }
        return reqs;
    }

    return {
        generate: function(emptyState) {
            console.log("Generating fresh mock data...");
            const state = { ...emptyState };
            
            state.customers = customers;
            state.sites = sites;
            state.assets = generateAssets();
            state.alerts = generateAlerts(state.assets);
            state.incidents = generateIncidents(state.assets);
            state.requests = generateRequests(state.customers);
            
            // Seed a critical active incident for the demo scenario
            state.incidents[0] = {
                id: "INC-9999",
                title: "FinTrust DB Server Unreachable",
                customerId: "CUST-001",
                siteId: "SITE-LON-01",
                affectedAssetId: state.assets[0].id,
                severity: "critical",
                status: "investigating",
                assignedAnalyst: "USR-001",
                createdAt: new Date(NOW - 45 * 60000).toISOString(), // 45 mins ago
                lastUpdated: new Date(NOW - 5 * 60000).toISOString(),
                sla: {
                    resolutionTarget: new Date(NOW + 75 * 60000).toISOString(), // 1h 15m remaining
                    breached: false
                }
            };
            
            return state;
        }
    };
})();
