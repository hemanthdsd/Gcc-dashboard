<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.svg" width="80" alt="GCC Logo">
  
  # Global Command Centre (GCC) Dashboard
  
  **A premium, enterprise-grade Incident Monitoring & SLA tracking application.**
  
  [![Live Demo](https://img.shields.io/badge/Live_Demo-View_Project-2ea44f?style=for-the-badge&logo=github)](https://hemanthdsd.github.io/Gcc-dashboard/login.html)
  [![Tech Stack](https://img.shields.io/badge/Stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla_JS-blue?style=for-the-badge)]()
  [![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)]()
</div>

<br />

## 📖 About The Project

The **GCC Dashboard** is a highly realistic simulation of a modern Data-Centre Command Centre. It is designed to handle high-stakes operational workflows including alert triage, incident management, strict SLA (Service Level Agreement) enforcement, and shift handovers. 

**What makes this project special?** It was built entirely from scratch with **zero build tools, zero dependencies (no NPM), and no backend server**. It uses raw HTML, CSS, and Vanilla JavaScript with `localStorage` to simulate a fully interactive, persistent database environment that runs instantly in any browser.

---

## ✨ Key Features

- 🚨 **Live Alert Simulator**: A built-in engine that randomly generates realistic infrastructure alerts (CPU spikes, thermal warnings, network drops) every 10–25 seconds.
- ⏱️ **Real-Time SLA Engine**: Precision timers that track incident resolution deadlines, visually degrading from green (healthy) to red (critical) as time expires.
- 🎫 **Incident Lifecycle Management**: Full CRUD capabilities to triage alerts, create incidents, assign analysts, log notes, and trace chronologically via an automated audit timeline.
- 🤝 **Escalations & Customer Comms**: Dedicated workflows to notify stakeholders or escalate issues to L2/L3 support teams.
- 📊 **Dynamic Data Visualization**: Beautiful, interactive charts powered by Chart.js mapping severity distributions and operational statuses.
- 🌗 **Premium Theming**: High-contrast, enterprise Dark Mode (Carbon Black) by default, with a seamless toggle to Light Mode (Alabaster Grey).
- 📋 **Automated Shift Handovers**: One-click generation of shift handover reports that automatically pull in current critical incidents and SLA warnings.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **HTML5 & CSS3** | Semantic structure and custom CSS variables for complex theming (No Tailwind/Bootstrap). |
| **Vanilla JavaScript** | Complex DOM manipulation, state management, and custom SPA routing without a framework. |
| **LocalStorage** | Persistent, in-browser data storage simulating a NoSQL database structure. |
| **Chart.js (CDN)** | Rendering high-performance, responsive canvas charts. |
| **Lucide (CDN)** | Crisp, modern vector iconography. |

---

## 🚀 How to Run Locally

Because this project uses zero build tools, running it is incredibly simple:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hemanthdsd/Gcc-dashboard.git
   ```
2. **Open the App:**
   Simply navigate to the folder and double-click `index.html` to open it in your browser. (No `npm install` or local servers required!)

---

## 🔑 Demo Access

If you are running the project locally or via the [Live Demo](https://hemanthdsd.github.io/Gcc-dashboard/login.html), you can use the following mock credentials to log in:

- **Email:** `analyst@gcc-demo.com`
- **Password:** `demo123`

---

## 📸 Screenshots

*(You can add screenshots of your dashboard here by dropping image files into the repo and linking them!)*

<br />

<div align="center">
  <sub>Built with ❤️ for Operations & Incident Management.</sub>
</div>
