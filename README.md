# ⚡ AI Quota Tracker

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-4.0-brightgreen.svg)

**AI Quota Tracker** is a sleek, privacy-first, client-side dashboard designed to help you manage and track the usage quotas, reset cycles, and statuses of all your AI agent accounts (like ChatGPT, Claude, OpenAI Codex, etc.) in one unified interface.

### 🚀 Live Demo
You can try out the dashboard directly in your browser without downloading anything:
👉 **[Live Demo on GitHub Pages](https://fedetaiola.github.io/ai-quota-tracker)**

*(Note: The demo is fully functional. Any data you enter is saved securely in your own browser's local storage).*

---

## ✨ Key Features

- **🛡️ 100% Privacy-First & Local**: No databases, no servers, no tracking. All data is saved securely in your browser's `localStorage`.
- **⚙️ Dynamic Custom Services**: Create and track any custom AI service. Customize icons, gradient colors, and specify custom "Free" or "Pro" reset cycle days.
- **📊 Granular Quota Tracking**: Visual progress bars and countdowns let you know exactly when your limits will reset. Inline sliders allow you to quickly adjust your remaining quota.
- **🌗 Auto Day/Night Theme**: The UI automatically switches to a sleek dark mode at night and a clean light mode during the day based on your system time.
- **💾 Import/Export Backups**: Easily export your tracked accounts and custom services to a JSON file to transfer them across devices.
- **📱 Fully Responsive**: Designed to look beautiful and work flawlessly on desktops, tablets, and smartphones.

---

## 🛠️ Installation & Usage

Since this project runs entirely client-side, setup is instant:

1. **Clone or Download** this repository to your local machine.
2. Open the `index.html` file in any modern web browser (Chrome, Firefox, Safari, Edge).
3. Click the **⚙️ Settings** icon to configure your custom AI services.
4. Click **+ Aggiungi Account** to start tracking your quotas!

## 🏗️ Architecture

The project is built to be fast, lightweight, and maintainable:
- **`index.html`**: The semantic HTML5 structure.
- **`css/style.css`**: Pure CSS3 with Flexbox, CSS Grid, and CSS Variables for theming. No heavy frameworks.
- **`js/app.js`**: Vanilla JavaScript for DOM manipulation, dynamic rendering, and local state management.

---

## 👨‍💻 Credits

Designed and developed by **Federico Taiola** with the assistance of Antigravity AI.
