import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import Detection, User
from schemas import DetectionOut
from auth import get_current_user

router = APIRouter(prefix="/detections", tags=["detections"])

@router.get("", response_model=list[DetectionOut])
async def list_detections(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).order_by(Detection.timestamp.desc()).limit(limit)
    )
    return result.scalars().all()

@router.get("/recent", response_model=list[DetectionOut])
async def recent_detections(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).order_by(Detection.timestamp.desc()).limit(10)
    )
    return result.scalars().all()

@router.patch("/{det_id}/status")
async def update_status(
    det_id: uuid.UUID,
    status: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Detection).where(Detection.id == det_id))
    det = result.scalar_one_or_none()
    if not det:
        raise HTTPException(status_code=404, detail="Detection not found")
    det.status = status
    await db.commit()
    return {"message": "Status updated"}
