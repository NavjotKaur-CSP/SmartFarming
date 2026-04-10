from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import sqlite3
import uuid
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import random

# ==================== Database Setup ====================

DB_PATH = os.environ.get("DB_PATH", "./farmer.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            farm_name TEXT,
            location TEXT,
            language TEXT DEFAULT 'en',
            role TEXT DEFAULT 'farmer',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS crops (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            variety TEXT,
            planted_date TEXT NOT NULL,
            expected_harvest_date TEXT,
            field_area REAL NOT NULL,
            location TEXT,
            notes TEXT,
            health_status TEXT DEFAULT 'healthy',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS predictions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            crop_id TEXT NOT NULL,
            prediction_text TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()

# ==================== JWT & Auth Helpers ====================

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "dev-secret-change-in-production")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        conn = get_db()
        user = conn.execute("SELECT * FROM users WHERE id = ?", (payload["sub"],)).fetchone()
        conn.close()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return dict(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== Pydantic Models ====================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    farm_name: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = None

class CropCreate(BaseModel):
    name: str
    variety: Optional[str] = None
    planted_date: datetime
    expected_harvest_date: Optional[datetime] = None
    field_area: float
    location: Optional[str] = None
    notes: Optional[str] = None

class CropUpdate(BaseModel):
    name: Optional[str] = None
    variety: Optional[str] = None
    expected_harvest_date: Optional[datetime] = None
    field_area: Optional[float] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    health_status: Optional[str] = None

class YieldPredictionRequest(BaseModel):
    crop_id: str

class CropHealthRequest(BaseModel):
    crop_id: str
    symptoms: Optional[str] = None

# ==================== App Setup ====================

app = FastAPI(title="Smart Farming Platform API")
api_router = APIRouter(prefix="/api")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== Auth Endpoints ====================

@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    conn = get_db()
    if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO users (id, email, password_hash, name, phone, farm_name, location, language, role, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        (user_id, email, hash_password(user_data.password), user_data.name, user_data.phone, user_data.farm_name, user_data.location, "en", "farmer", now)
    )
    conn.execute(
        "INSERT INTO alerts (id, user_id, title, message, alert_type, severity, is_read, created_at) VALUES (?,?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), user_id, "Welcome to Smart Farming Platform", "Start by adding your crops and monitoring their health!", "advisory", "info", 0, now)
    )
    conn.commit()
    conn.close()
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": user_data.name, "phone": user_data.phone, "farm_name": user_data.farm_name, "location": user_data.location, "language": "en", "role": "farmer", "access_token": access_token}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    email = user_data.email.lower()
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = dict(user)
    access_token = create_access_token(user["id"], email)
    refresh_token = create_refresh_token(user["id"])
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie("refresh_token", refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user["id"], "email": user["email"], "name": user["name"], "phone": user.get("phone"), "farm_name": user.get("farm_name"), "location": user.get("location"), "language": user.get("language", "en"), "role": user.get("role", "farmer"), "access_token": access_token}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    user.pop("password_hash", None)
    return user

@api_router.put("/auth/profile")
async def update_profile(user_update: UserUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if update_data:
        sets = ", ".join(f"{k} = ?" for k in update_data)
        conn = get_db()
        conn.execute(f"UPDATE users SET {sets} WHERE id = ?", (*update_data.values(), user["id"]))
        conn.commit()
        updated = dict(conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone())
        conn.close()
        updated.pop("password_hash", None)
        return updated
    user.pop("password_hash", None)
    return user

# ==================== Crop Endpoints ====================

@api_router.post("/crops")
async def create_crop(crop_data: CropCreate, request: Request):
    user = await get_current_user(request)
    crop_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    planted = crop_data.planted_date.isoformat()
    harvest = crop_data.expected_harvest_date.isoformat() if crop_data.expected_harvest_date else None
    conn = get_db()
    conn.execute(
        "INSERT INTO crops (id, user_id, name, variety, planted_date, expected_harvest_date, field_area, location, notes, health_status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        (crop_id, user["id"], crop_data.name, crop_data.variety, planted, harvest, crop_data.field_area, crop_data.location, crop_data.notes, "healthy", now)
    )
    conn.commit()
    crop = dict(conn.execute("SELECT * FROM crops WHERE id = ?", (crop_id,)).fetchone())
    conn.close()
    return crop

@api_router.get("/crops")
async def get_crops(request: Request):
    user = await get_current_user(request)
    conn = get_db()
    crops = [dict(r) for r in conn.execute("SELECT * FROM crops WHERE user_id = ?", (user["id"],)).fetchall()]
    conn.close()
    return crops

@api_router.get("/crops/{crop_id}")
async def get_crop(crop_id: str, request: Request):
    user = await get_current_user(request)
    conn = get_db()
    crop = conn.execute("SELECT * FROM crops WHERE id = ? AND user_id = ?", (crop_id, user["id"])).fetchone()
    conn.close()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return dict(crop)

@api_router.put("/crops/{crop_id}")
async def update_crop(crop_id: str, crop_update: CropUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {k: v for k, v in crop_update.dict().items() if v is not None}
    if update_data:
        sets = ", ".join(f"{k} = ?" for k in update_data)
        conn = get_db()
        result = conn.execute(f"UPDATE crops SET {sets} WHERE id = ? AND user_id = ?", (*update_data.values(), crop_id, user["id"]))
        conn.commit()
        if result.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Crop not found")
        crop = dict(conn.execute("SELECT * FROM crops WHERE id = ?", (crop_id,)).fetchone())
        conn.close()
        return crop
    return await get_crop(crop_id, request)

@api_router.delete("/crops/{crop_id}")
async def delete_crop(crop_id: str, request: Request):
    user = await get_current_user(request)
    conn = get_db()
    result = conn.execute("DELETE FROM crops WHERE id = ? AND user_id = ?", (crop_id, user["id"]))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Crop not found")
    return {"message": "Crop deleted successfully"}

# ==================== Weather & Soil (Mock) ====================

@api_router.get("/weather")
async def get_weather(request: Request):
    user = await get_current_user(request)
    return {
        "location": user.get("location", "Unknown"),
        "temperature": round(random.uniform(20, 35), 1),
        "humidity": random.randint(40, 80),
        "wind_speed": round(random.uniform(5, 25), 1),
        "precipitation_chance": random.randint(0, 100),
        "condition": random.choice(["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"]),
        "uv_index": random.randint(1, 11),
        "forecast": [
            {"day": "Today", "high": random.randint(28, 35), "low": random.randint(18, 25), "condition": "Sunny"},
            {"day": "Tomorrow", "high": random.randint(28, 35), "low": random.randint(18, 25), "condition": "Partly Cloudy"},
            {"day": "Day 3", "high": random.randint(28, 35), "low": random.randint(18, 25), "condition": "Cloudy"},
            {"day": "Day 4", "high": random.randint(28, 35), "low": random.randint(18, 25), "condition": "Light Rain"},
            {"day": "Day 5", "high": random.randint(28, 35), "low": random.randint(18, 25), "condition": "Sunny"},
        ],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/soil")
async def get_soil_data(request: Request):
    await get_current_user(request)
    return {
        "ph_level": round(random.uniform(5.5, 7.5), 1),
        "nitrogen": round(random.uniform(20, 80), 1),
        "phosphorus": round(random.uniform(15, 60), 1),
        "potassium": round(random.uniform(100, 300), 1),
        "organic_matter": round(random.uniform(2, 6), 1),
        "moisture": round(random.uniform(20, 60), 1),
        "soil_type": random.choice(["Loamy", "Sandy", "Clay", "Silt"]),
        "health_score": random.randint(60, 95),
        "recommendations": [
            "Consider adding organic compost to improve soil structure",
            "Monitor nitrogen levels closely for optimal crop growth",
            "Ensure proper drainage to prevent waterlogging"
        ],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== Market Prices (Mock) ====================

@api_router.get("/market-prices")
async def get_market_prices(request: Request):
    await get_current_user(request)
    return {
        "prices": [
            {"crop": "Wheat", "price": round(random.uniform(1800, 2200), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "Delhi Mandi"},
            {"crop": "Rice", "price": round(random.uniform(2500, 3200), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "Mumbai APMC"},
            {"crop": "Maize", "price": round(random.uniform(1500, 1900), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "Pune Market"},
            {"crop": "Cotton", "price": round(random.uniform(5500, 6500), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "Gujarat Mandi"},
            {"crop": "Soybean", "price": round(random.uniform(3800, 4500), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "MP Mandi"},
            {"crop": "Potato", "price": round(random.uniform(800, 1200), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "UP Mandi"},
            {"crop": "Tomato", "price": round(random.uniform(1500, 2500), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "Karnataka APMC"},
            {"crop": "Onion", "price": round(random.uniform(1000, 1800), 2), "unit": "per quintal", "change": round(random.uniform(-5, 5), 2), "market": "Nashik Mandi"},
        ],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== Alerts ====================

@api_router.get("/alerts")
async def get_alerts(request: Request):
    user = await get_current_user(request)
    conn = get_db()
    alerts = [dict(r) for r in conn.execute("SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", (user["id"],)).fetchall()]
    conn.close()
    for a in alerts:
        a["is_read"] = bool(a["is_read"])
    return alerts

@api_router.put("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, request: Request):
    user = await get_current_user(request)
    conn = get_db()
    result = conn.execute("UPDATE alerts SET is_read = 1 WHERE id = ? AND user_id = ?", (alert_id, user["id"]))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, request: Request):
    user = await get_current_user(request)
    conn = get_db()
    result = conn.execute("DELETE FROM alerts WHERE id = ? AND user_id = ?", (alert_id, user["id"]))
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"}

# ==================== AI Features ====================

@api_router.post("/ai/yield-prediction")
async def predict_yield(prediction_req: YieldPredictionRequest, request: Request):
    user = await get_current_user(request)
    conn = get_db()
    crop = conn.execute("SELECT * FROM crops WHERE id = ? AND user_id = ?", (prediction_req.crop_id, user["id"])).fetchone()
    conn.close()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    crop = dict(crop)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"yield-{prediction_req.crop_id}-{datetime.now().timestamp()}",
            system_message="You are an agricultural expert AI assistant. Provide yield predictions and farming advice based on crop data. Be concise and practical."
        ).with_model("openai", "gpt-4o")
        prompt = f"""Crop: {crop['name']}, Variety: {crop.get('variety','Standard')}, Area: {crop['field_area']} acres, Planted: {crop['planted_date']}, Health: {crop.get('health_status','Unknown')}, Location: {crop.get('location','Not specified')}
Provide: 1) Estimated yield (quintals) 2) Confidence level 3) Key factors 4) Top 3 recommendations"""
        response_text = await chat.send_message(UserMessage(text=prompt))
        conn = get_db()
        conn.execute("INSERT INTO predictions (id, user_id, crop_id, prediction_text, created_at) VALUES (?,?,?,?,?)",
                     (str(uuid.uuid4()), user["id"], prediction_req.crop_id, response_text, datetime.now(timezone.utc).isoformat()))
        conn.commit()
        conn.close()
        return {"crop_name": crop["name"], "field_area": crop["field_area"], "prediction": response_text, "generated_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"AI prediction error: {e}")
        estimated_yield = round(crop['field_area'] * random.uniform(15, 25), 1)
        return {"crop_name": crop["name"], "field_area": crop["field_area"], "prediction": f"Estimated yield: {estimated_yield} quintals\nConfidence: Medium\n\nRecommendations:\n1. Monitor soil moisture\n2. Apply balanced fertilizers\n3. Implement pest management", "generated_at": datetime.now(timezone.utc).isoformat(), "is_mock": True}

@api_router.post("/ai/crop-health")
async def analyze_crop_health(health_req: CropHealthRequest, request: Request):
    user = await get_current_user(request)
    conn = get_db()
    crop = conn.execute("SELECT * FROM crops WHERE id = ? AND user_id = ?", (health_req.crop_id, user["id"])).fetchone()
    conn.close()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    crop = dict(crop)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"health-{health_req.crop_id}-{datetime.now().timestamp()}",
            system_message="You are an agricultural expert AI specializing in crop health diagnosis."
        ).with_model("openai", "gpt-4o")
        prompt = f"""Crop: {crop['name']}, Health: {crop.get('health_status','Unknown')}, Symptoms: {health_req.symptoms or 'None'}
Provide: 1) Health assessment 2) Potential issues 3) Immediate actions 4) Preventive measures"""
        response_text = await chat.send_message(UserMessage(text=prompt))
        return {"crop_name": crop["name"], "analysis": response_text, "analyzed_at": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"AI health error: {e}")
        status = random.choice(["Excellent", "Good", "Fair"])
        return {"crop_name": crop["name"], "analysis": f"Health Assessment: {status}\n\nRecommendations:\n1. Continue regular watering\n2. Monitor for disease signs\n3. Apply foliar spray for nutrients", "analyzed_at": datetime.now(timezone.utc).isoformat(), "is_mock": True}

# ==================== Dashboard ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request):
    user = await get_current_user(request)
    conn = get_db()
    crops_count = conn.execute("SELECT COUNT(*) FROM crops WHERE user_id = ?", (user["id"],)).fetchone()[0]
    alerts_count = conn.execute("SELECT COUNT(*) FROM alerts WHERE user_id = ? AND is_read = 0", (user["id"],)).fetchone()[0]
    predictions_count = conn.execute("SELECT COUNT(*) FROM predictions WHERE user_id = ?", (user["id"],)).fetchone()[0]
    crops = [dict(r) for r in conn.execute("SELECT field_area, health_status FROM crops WHERE user_id = ?", (user["id"],)).fetchall()]
    conn.close()
    total_area = sum(c.get("field_area", 0) for c in crops)
    health_distribution = {"healthy": 0, "at_risk": 0, "critical": 0}
    for c in crops:
        s = c.get("health_status", "healthy")
        health_distribution[s] = health_distribution.get(s, 0) + 1
    return {
        "total_crops": crops_count,
        "total_field_area": round(total_area, 2),
        "unread_alerts": alerts_count,
        "predictions_made": predictions_count,
        "health_distribution": health_distribution,
        "recent_activity": [
            {"action": "Crop health analyzed", "time": "2 hours ago"},
            {"action": "Yield prediction generated", "time": "5 hours ago"},
            {"action": "New alert received", "time": "1 day ago"},
        ]
    }

# ==================== Root & Health ====================

@api_router.get("/")
async def root():
    return {"message": "Smart Farming Platform API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)

ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get("FRONTEND_URL", "http://localhost:3000").split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@smartfarm.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    conn = get_db()
    existing = conn.execute("SELECT id, password_hash FROM users WHERE email = ?", (admin_email,)).fetchone()
    if existing is None:
        conn.execute(
            "INSERT INTO users (id, email, password_hash, name, role, language, created_at) VALUES (?,?,?,?,?,?,?)",
            (str(uuid.uuid4()), admin_email, hash_password(admin_password), "Admin", "admin", "en", datetime.now(timezone.utc).isoformat())
        )
        conn.commit()
        logger.info(f"Admin user created: {admin_email}")
    conn.close()
