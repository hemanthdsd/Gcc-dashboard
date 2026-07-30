# GCC Incident Monitoring & SLA Dashboard

A premium, frontend-only Global Command Centre dashboard showcasing data-centre monitoring, alert triage, incident coordination, SLA tracking, customer support, escalation management, documentation, and shift handovers.

## Features
- **Zero-setup deployment**: Runs entirely in the browser using `file://` protocol.
- **Mock Data Engine**: Auto-generates realistic data for customers, sites, assets, alerts, and incidents on first load.
- **SLA Engine**: Real-time SLA countdown timers with status thresholds.
- **Dark/Light Theme**: Built-in theme switcher saved to localStorage.
- **Dashboard**: Live operational summary cards and Chart.js metrics.
- *(More features to come in subsequent phases...)*

## How to Run
Simply double-click `index.html` in your file explorer. 
- No server required.
- No build tools required.
- No database required.

## Demo Accounts
Password for all accounts is: `demo123`
- `analyst@gcc-demo.com` (Analyst view)
- `shiftlead@gcc-demo.com` (Shift Lead view)
- `admin@gcc-demo.com` (Admin view)

## Tech Stack
- HTML5
- CSS3 (Vanilla, CSS Variables)
- Vanilla JavaScript (ES6 syntax without modules for `file://` compatibility)
- LocalStorage for persistence
- Chart.js (via CDN)
- Lucide Icons (via CDN)
