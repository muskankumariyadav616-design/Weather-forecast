<div align="center">

#  Weather App

Real-time weather for Indian cities — built with Node.js + OpenWeatherMap

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![OpenWeatherMap](https://img.shields.io/badge/OpenWeatherMap-API-orange?style=for-the-badge&logo=openweathermap&logoColor=white)
![HTML5](https://img.shields.io/badge/Frontend-HTML%2FCSS%2FJS-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-5de4c7?style=for-the-badge)

<br/>

> A full-stack weather dashboard that shows live temperature, humidity, wind, AQI, sunrise/sunset, and a short forecast — with no React build step required.

<br/>

---

</div>

## ✨ Features

| Feature | Details |
|---|---|
| 🌡 Temperature | Current + feels-like in °C |
| 💧 Humidity & Wind | Percentage + m/s speed |
| 👁 Visibility | In kilometres |
| 🌫 Air Quality Index | 1–5 scale with colour-coded bar (Good → Very Poor) |
| 🌅 Sunrise & Sunset | Accurate local IST times |
| ⏱️ Forecast | Next 5 entries from 3-hour rolling forecast |
| 🎨 Animated UI | Glowing gradient blob background, smooth card transitions |
| 📱 Responsive | Works on mobile and desktop |
| ⚡️ No build step | Frontend is a single index.html — just open it |

---

## 🗂 Project Structure

weather-app/
├── backend/
│   ├── server.js        ← Express API server (proxies OpenWeatherMap)
│   ├── .env             ← API key & port config (never commit this!)
│   ├── .gitignore       ← Excludes .env and node_modules
│   └── package.json     ← Dependencies
└── frontend/
    └── index.html       ← Complete UI — open directly in any browser

    
     
  ## · Set up your API key

Create a file called .env inside the backend/ folder:

API_KEY=your_openweathermap_key_here
PORT=5000

> 🔑 Get a free key at [openweathermap.org/api_keys](https://home.openweathermap.org/api_keys)
> ⏳ New keys can take up to 2 hours to activate

## · Start the server

npm start
# ✅ Server running on http://localhost:5000

## · Open the app

Double-click `frontend/index.html` in your file explorer — no server needed for the frontend.

---

## 🌐 API Reference

Endpoint: GET /weather?city={cityName}

The backend automatically appends ,IN to restrict results to India.

Example:
http://localhost:5000/weather?city=Mumbai

Response:
{
  "location": "Mumbai, IN",
  "temp": 32,
  "feels_like": 38,
  "humidity": 78,
  "wind": 4.5,
  "visibility": "6.0",
  "condition": "haze",
  "icon": "50d",
  "aqi": 3,
  "aqi_label": "Moderate",
  "sunrise": "06:04 AM",
  "sunset": "07:18 PM",
  "forecast": [
    { "time": "2026-05-02 12:00:00", "temp": 34, "condition": "few clouds", "icon": "02d" },
    ...
  ]
}

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | Node.js + Express | HTTP server & API proxy |
| HTTP Client | Axios | Calling OpenWeatherMap APIs |
| Config | dotenv | Loading environment variables |
| CORS | cors | Allowing frontend ↔️ backend communication |
| Data Source | OpenWeatherMap | Weather, AQI & Forecast APIs |
| Frontend | Vanilla HTML/CSS/JS | Zero-dependency UI |
| Fonts | Google Fonts (Syne) | Display typography |
| Animation | CSS keyframes | Background blobs & transitions |

---

## 🚨 Troubleshooting

| Problem | Fix |
|---|---|
| Cannot find module error | You're not in the backend/ folder — run cd backend first |
| Every city returns "not found" | API key is wrong or not yet activated (wait up to 2 hours) |
| Blank page / fetch failed | Backend isn't running — run npm start in a terminal |
| Port 5000 already in use | Change PORT=5001 in .env and update API_BASE in index.html |
| CORS error in browser console | Make sure the backend is running and cors() is active in server.js |

---

## 🔒 Security
- Never commit `.env` — it's already excluded by .gitignore
- Never hardcode your API key in server.js or index.html
- If your key was accidentally exposed, regenerate it immediately at [openweathermap.org/api_keys](https://home.openweathermap.org/api_keys)
- For production deployment, set environment variables via your hosting platform (Railway, Render, etc.) instead of .env files

---

## 📋 Checklist Before First Run

- [ ] node -v and npm -v both print version numbers
- [ ] npm install completed without red errors
- [ ] .env has a valid API key
- [ ] Terminal shows ✅ Server running on http://localhost:5000
- [ ] http://localhost:5000/weather?city=Delhi returns JSON
- [ ] index.html opens and shows weather data

---

## 📄 License

MIT — feel free to use, modify, and share.

---

<div align="center">

</div>
