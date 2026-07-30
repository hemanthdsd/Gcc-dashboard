/**
 * GCC Dashboard - Settings View
 */
window.GCC = window.GCC || {};

(function() {
    
    function renderSettings() {
        const settings = window.GCC.Store.get('settings');
        
        const html = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Settings & Preferences</h1>
                    <p class="page-subtitle">Configure application behaviour, appearance, and simulator controls</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
                
                <!-- Appearance -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Appearance</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div>
                                <div style="font-weight: 500;">Theme</div>
                                <div style="color: var(--text-secondary); font-size: 13px;">Toggle between Dark and Light mode</div>
                            </div>
                            <button class="btn btn-secondary" onclick="document.getElementById('theme-toggle').click()">
                                Toggle Theme
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Simulation -->
                <div class="card">
                    <div class="card-header" style="border-left: 3px solid var(--accent-primary);">
                        <h3 class="card-title">Live Alert Simulator</h3>
                    </div>
                    <div class="card-body">
                        <div style="background: var(--bg-elevated); padding: 15px; border-radius: 6px; margin-bottom: 20px; font-size: 13px;">
                            <strong>Demo Mode:</strong> Enable this to randomly generate infrastructure alerts every 30-90 seconds. 
                            These alerts will appear as toast notifications and update the dashboard counts automatically.
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 500;">Alert Generation Engine</div>
                                <div style="color: var(--text-secondary); font-size: 13px;">Status: <span id="sim-status" style="font-weight: bold; color: ${settings.simulatorEnabled ? 'var(--color-healthy)' : 'var(--text-muted)'}">${settings.simulatorEnabled ? 'Running' : 'Stopped'}</span></div>
                            </div>
                            <button id="sim-toggle-btn" class="btn ${settings.simulatorEnabled ? 'btn-danger' : 'btn-primary'}" onclick="window.GCC.SettingsLogic.toggleSimulator()">
                                ${settings.simulatorEnabled ? '<i data-lucide="square"></i> Stop Engine' : '<i data-lucide="play"></i> Start Engine'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Danger Zone -->
                <div class="card" style="grid-column: span 2; border: 1px solid var(--color-critical);">
                    <div class="card-header" style="background: var(--color-critical-bg); border-bottom: 1px solid var(--border-default);">
                        <h3 class="card-title" style="color: var(--color-critical);">Danger Zone</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 500;">Factory Reset</div>
                                <div style="color: var(--text-secondary); font-size: 13px;">Wipe all data and restore original seed data</div>
                            </div>
                            <button class="btn btn-danger" onclick="window.GCC.SettingsLogic.factoryReset()">
                                <i data-lucide="alert-triangle"></i> Reset Database
                            </button>
                        </div>
                    </div>
                </div>
                
            </div>
        `;
        
        return html;
    }

    window.GCC.SettingsLogic = {
        toggleSimulator: () => {
            const settings = window.GCC.Store.get('settings');
            const newState = !settings.simulatorEnabled;
            
            window.GCC.Store.set('settings', { ...settings, simulatorEnabled: newState });
            
            // Re-render settings view
            if (window.location.hash.includes('/settings')) {
                window.GCC.Router.navigate(window.location.hash);
            }
            
            if (newState) {
                window.GCC.Utils.createToast('Simulator Started', 'Random alerts will now be generated.', 'success');
                if (window.GCC.Simulator) window.GCC.Simulator.start();
            } else {
                window.GCC.Utils.createToast('Simulator Stopped', 'Alert generation paused.', 'info');
                if (window.GCC.Simulator) window.GCC.Simulator.stop();
            }
        },
        
        factoryReset: () => {
            if(confirm("Are you sure? This will wipe all changes and restore original demo data. This action cannot be undone.")) {
                window.GCC.Store.reset();
            }
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        window.GCC.Router.register('/settings', renderSettings);
    });

})();
