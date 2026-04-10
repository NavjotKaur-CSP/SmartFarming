# 🌾 Smart Farming Platform

A web-based intelligent system to assist farmers in making informed agricultural decisions using AI-powered insights, real-time data, and an intuitive dashboard.

---

## Features

- **User Authentication** — Secure register, login, logout with JWT
- **Dashboard** — Stats overview, yield trends, crop health charts, weather widget
- **Crop Management** — Add, edit, delete, and search crops
- **Crop Health Monitoring** — AI-powered analysis of crop conditions and symptoms
- **Yield Prediction** — AI predictions based on historical data, weather, and soil conditions
- **Weather & Soil Data** — Real-time weather updates and soil health information
- **Market Prices** — Current market prices and trends for crops
- **Alerts & Notifications** — Extreme weather alerts, crop risk advisories
- **Profile Management** — Update personal info and profile picture

---

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Shadcn/UI components
- Recharts (data visualizations)

### Backend
- FastAPI (Python)
- JWT authentication with bcrypt
- OpenAI GPT for AI features

---

## Getting Started

### Prerequisites
- Node.js >= 16
- Python >= 3.9
- yarn or npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add your environment variables
uvicorn server:app --reload
```

### Frontend Setup

```bash
cd frontend
yarn install
cp .env.example .env   # set REACT_APP_BACKEND_URL
yarn start
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend `.env`
```
SECRET_KEY=your_jwt_secret
OPENAI_API_KEY=your_openai_key
MONGO_URL=your_mongodb_connection_string
```

### Frontend `.env`
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## Project Structure

```
SmartFarming/
├── backend/
│   ├── server.py         # FastAPI app & all API routes
│   └── requirements.txt
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── context/      # Auth context
│       ├── pages/        # All page components
│       └── services/     # API service layer
└── README.md
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard with stats and charts |
| `/dashboard/crops` | Crop management (CRUD) |
| `/dashboard/health` | AI crop health analysis |
| `/dashboard/yield` | AI yield prediction |
| `/dashboard/weather` | Weather & soil data |
| `/dashboard/market` | Market prices |
| `/dashboard/alerts` | Alerts & notifications |
| `/dashboard/profile` | User profile settings |

---

## License

MIT
