# 🌍 World Globe AI

An ultra-modern, interactive 3D spinning globe web application. Click any sovereign nation to view real-time demographic metadata and chat with an AI guide that dynamically remembers which country you're exploring!

---

## ✨ Features

- **🌐 Realistic 3D Globe**: Rendered using `react-globe.gl` and `Three.js` with smooth satellite textures, atmospheric cyan glow, and automatic rotation.
- **🗺️ Interactive Sovereign Borders**: Clickable GeoJSON borders mapped via `world-atlas` with neon hover and selection highlights.
- **🔍 Hotkey Search Bar**: Press `Ctrl+K` or `Cmd+K` anywhere to search nations instantly with flag thumbnails and ISO badges.
- **📊 Real-Time Demographic Data**: Displays official Capital, Region, Subregion, Formatted Population, Currency (name & symbol), and Flags.
- **🤖 Context-Aware AI Guide**: Powered by **Groq Llama 3.1** (`llama-3.1-8b-instant`). Automatically scopes AI responses to the selected nation without needing to re-type the country name.
- **🎮 Floating Controls HUD**: Play/Pause rotation, Zoom In/Out (+/-), Reset View camera, and a "Random Nation" shuffle button.
- **📱 Fully Responsive**: Translucency glassmorphism styling (`Outfit` font) that transforms into a bottom-sheet drawer on mobile screens (<768px).

---

## 🏗️ Architecture & Project Structure

```text
3D Globe/
├── frontend/                 # React + Vite Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── GlobeView.jsx         # 3D Globe & Camera HUD Controls
│   │   │   ├── SearchBar.jsx         # Hotkey-enabled Search & Dropdown
│   │   │   ├── CountryInfoPanel.jsx  # Glassmorphic Side Panel & Metrics Grid
│   │   │   └── AIChat.jsx            # Groq AI Chat Interface & Avatars
│   │   ├── App.jsx                   # Layout, State & Async Loader
│   │   └── index.css                 # Glassmorphism Design System & Theme
│   ├── .env.example                  # Environment Variables Template
│   └── package.json
│
├── backend/                  # Node.js + Express Proxy Server
│   ├── server.js                     # Secure Proxy to Groq API (Llama 3.1)
│   ├── .env.example                  # API Key Environment Template
│   └── package.json
│
└── README.md
```

---

## 🔒 Security & Secret Management

- **API Key Protection**: Your `GROQ_API_KEY` is securely stored on the Node.js backend server (`backend/.env`) and is **never exposed to the browser or frontend bundle**.
- **CORS Protection**: The Express server restricts incoming requests via dynamic origin validation (`ALLOWED_ORIGINS`).
- **Rate Limiting**: Built-in rate limiter (`express-rate-limit`) limits API abuse (20 requests/minute per IP).
- **Git Safeguards**: Strictly ignores `.env`, `.env.local`, and build artifacts in `.gitignore`.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20+ LTS installed.
- A free Groq API key from [Groq Console](https://console.groq.com/keys).

---

### Step 1: Clone & Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `/backend` (or copy from `.env.example`):

```properties
GROQ_API_KEY=gsk_your_actual_groq_key_here
PORT=5000
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the backend proxy server:

```bash
node server.js
```
*Output: `Backend server running on http://localhost:5000`*

---

### Step 2: Setup & Launch Frontend

Open a second terminal window:

```bash
cd frontend
npm install
```

Create a `.env` file inside `/frontend` (or copy from `.env.example`):

```properties
VITE_API_URL=http://localhost:5000
```

Start the Vite development server:

```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**! 🎉

---

## 🌐 Production Deployment

### 1. Backend (e.g. Render / Railway / Heroku)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Set Environment Variables:
  - `GROQ_API_KEY` = *your production Groq key*
  - `PORT` = `5000` (or host provided port)
  - `ALLOWED_ORIGINS` = `https://your-frontend-domain.vercel.app`

### 2. Frontend (e.g. Vercel / Netlify)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Set Environment Variables:
  - `VITE_API_URL` = `https://your-backend-domain.onrender.com`

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS (v4), Framer Motion, Lucide React |
| **3D Rendering** | `react-globe.gl`, Three.js, `d3-geo`, `topojson-client` |
| **Backend** | Node.js, Express, `groq-sdk`, `cors`, `express-rate-limit` |
| **AI Model** | Groq Llama 3.1 8B (`llama-3.1-8b-instant`) |
| **Data Sources** | `dr5hn/countries-states-cities-database`, `world-atlas`, FlagCDN |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
