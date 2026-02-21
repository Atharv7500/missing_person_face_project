import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database import init_db, AsyncSessionLocal
from models import User
from auth import hash_password
from sqlalchemy import select
from tasks import fetch_external_databases
import asyncio

from routers import auth, persons, detections, dashboard

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Init DB tables
    await init_db()
    # Seed default admin
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                password_hash=hash_password("admin123"),
                role="admin",
                clearance_level=5,
            )
            db.add(admin)
            await db.commit()
            
    # Start external DB background worker
    asyncio.create_task(fetch_external_databases())
    
    yield

app = FastAPI(
    title="Bureau of Identification API",
    description="Missing Person Face Recognition System",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve local uploads if Azure not configured
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth.router)
app.include_router(persons.router)
app.include_router(detections.router)
app.include_router(dashboard.router)

@app.get("/", tags=["root"])
async def root():
    return {"service": "Bureau of Identification API", "version": "2.0.0", "status": "online"}
