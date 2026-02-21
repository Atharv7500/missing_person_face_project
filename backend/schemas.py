from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ── Auth ──────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: str
    username: str
    role: str
    clearance_level: int
    created_at: datetime
    class Config: from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "operator"
    clearance_level: int = 1

# ── Missing Persons ───────────────────────────
class PersonCreate(BaseModel):
    name: str
    age: Optional[str] = None
    contact: Optional[str] = None
    priority: str = "normal"

class PersonOut(BaseModel):
    id: str
    case_id: str
    name: str
    age: Optional[str] = None
    contact: Optional[str] = None
    priority: str
    photo_url: Optional[str] = None
    registered_at: datetime
    class Config: from_attributes = True

# ── Detections ────────────────────────────────
class DetectionOut(BaseModel):
    id: str
    person_name: Optional[str] = None
    case_id: Optional[str] = None
    location: Optional[str] = None
    camera_id: Optional[str] = None
    timestamp: datetime
    snapshot_url: Optional[str] = None
    confidence: Optional[float] = None
    sms_sent: bool
    status: str
    class Config: from_attributes = True

# ── Dashboard Stats ───────────────────────────
class DashboardStats(BaseModel):
    total_registered: int
    active_matches: int
    alerts_dispatched: int
    daily_new_records: int

# ── System Health ─────────────────────────────
class SystemHealth(BaseModel):
    db_connected: bool
    storage_connected: bool
    api_latency_ms: float
    storage_used_pct: int
