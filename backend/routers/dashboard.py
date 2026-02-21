import time
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import MissingPerson, Detection, User
from schemas import DashboardStats, SystemHealth
from auth import get_current_user
from storage import AZURE_AVAILABLE
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    total_registered = (await db.execute(func.count(MissingPerson.id))).scalar() or 0
    active_matches   = (await db.execute(
        select(func.count(Detection.id)).where(Detection.status == "pending")
    )).scalar() or 0
    alerts_dispatched = (await db.execute(
        select(func.count(Detection.id)).where(Detection.sms_sent == True)
    )).scalar() or 0
    yesterday = datetime.utcnow() - timedelta(days=1)
    daily_new = (await db.execute(
        select(func.count(MissingPerson.id)).where(MissingPerson.registered_at >= yesterday)
    )).scalar() or 0

    return DashboardStats(
        total_registered=total_registered,
        active_matches=active_matches,
        alerts_dispatched=alerts_dispatched,
        daily_new_records=daily_new,
    )

@router.get("/health", response_model=SystemHealth)
async def get_health(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    t0 = time.monotonic()
    try:
        await db.execute(select(func.count(User.id)))
        db_ok = True
    except Exception:
        db_ok = False
    latency = round((time.monotonic() - t0) * 1000, 1)

    return SystemHealth(
        db_connected=db_ok,
        storage_connected=AZURE_AVAILABLE,
        api_latency_ms=latency,
        storage_used_pct=42,   # real impl: query Azure metrics
    )
