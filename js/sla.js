/**
 * GCC Dashboard SLA Engine
 * Handles SLA configuration, timer logic, and visual representation
 */
window.GCC = window.GCC || {};

window.GCC.SLA = (function() {
    
    // Targets in minutes
    const SLA_TARGETS = {
        critical: { acknowledge: 10, update: 15, resolution: 120 },
        high:     { acknowledge: 20, update: 30, resolution: 240 },
        medium:   { acknowledge: 60, resolution: 480 },
        low:      { acknowledge: 240, resolution: 1440 }
    };
    
    function getStatusForRatio(ratio) {
        if (ratio < 0.70) return 'healthy';
        if (ratio < 0.90) return 'warning';
        if (ratio <= 1.00) return 'critical';
        return 'breached';
    }

    return {
        // Calculate remaining time and status
        calculateState: (createdAt, targetAt) => {
            const now = Date.now();
            const created = new Date(createdAt).getTime();
            const target = new Date(targetAt).getTime();
            
            const totalDuration = target - created;
            const elapsed = now - created;
            const remaining = target - now;
            
            let ratio = elapsed / totalDuration;
            if (ratio < 0) ratio = 0;
            
            const status = getStatusForRatio(ratio);
            const isBreached = remaining < 0;
            
            // Format remaining string (e.g. "01:15:30" or "-00:05:00")
            const absRemainingMs = Math.abs(remaining);
            const h = Math.floor(absRemainingMs / 3600000);
            const m = Math.floor((absRemainingMs % 3600000) / 60000);
            const s = Math.floor((absRemainingMs % 60000) / 1000);
            
            const pad = num => num.toString().padStart(2, '0');
            const timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;
            const displayStr = isBreached ? `-${timeStr}` : timeStr;
            
            return {
                remainingMs: remaining,
                percentElapsed: Math.min(100, Math.max(0, ratio * 100)),
                status,
                isBreached,
                displayStr
            };
        },
        
        // Render an HTML block for a timer
        renderTimerHtml: (createdAt, targetAt) => {
            const state = window.GCC.SLA.calculateState(createdAt, targetAt);
            return `
                <div class="sla-container">
                    <div class="sla-timer ${state.status}">
                        <i data-lucide="clock" width="16" height="16"></i>
                        <span>${state.displayStr}</span>
                    </div>
                    <div class="sla-bar-container">
                        <div class="sla-bar ${state.status}" style="width: ${state.percentElapsed}%"></div>
                    </div>
                </div>
            `;
        }
    };
})();
