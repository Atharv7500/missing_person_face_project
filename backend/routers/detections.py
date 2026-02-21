import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models import Detection, User
from schemas import DetectionOut
from auth import get_current_user
from utils import send_sms_alert
from models import MissingPerson
from storage import upload_photo
import json
import random
import os

try:
    import face_recognition
    import numpy as np
    FR_AVAILABLE = True
except ImportError:
    FR_AVAILABLE = False

router = APIRouter(prefix="/detections", tags=["detections"])

@router.get("", response_model=list[DetectionOut])
async def list_detections(
    lat: float | None = None,
    lon: float | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Detection).order_by(Detection.timestamp.desc()).limit(limit)
    )
    detections = result.scalars().all()
    
    if lat is not None and lon is not None:
        import math
        def haversine(lat1, lon1, lat2, lon2):
            return 2 * 6371 * math.atan2(math.sqrt(math.sin(math.radians(lat2 - lat1)/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(math.radians(lon2 - lon1)/2)**2), math.sqrt(1 - (math.sin(math.radians(lat2 - lat1)/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(math.radians(lon2 - lon1)/2)**2)))
        
        def get_dist(d):
            if d.latitude is None or d.longitude is None: return float('inf')
            try: return haversine(lat, lon, d.latitude, d.longitude)
            except: return float('inf')
            
        detections = sorted(detections, key=get_dist)
        
    return detections

@router.post("", response_model=DetectionOut)
async def create_detection(
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    photo: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user)
):
    snapshot_url = None
    if photo:
        image_bytes = await photo.read()
        ext = (photo.filename or "snapshot.jpg").rsplit(".", 1)[-1].lower()
        filename = f"scan-{uuid.uuid4().hex[:8]}.{ext}"
        snapshot_url = await upload_photo(image_bytes, filename, photo.content_type or "image/jpeg")

    # MOCK MATCHING for MVP
    matched_person = None
    confidence = random.uniform(0.6, 0.98) if random.random() > 0.5 else None
    
    if confidence:
        result = await db.execute(select(MissingPerson).order_by(func.random()).limit(1))
        matched_person = result.scalar_one_or_none()
        
    det = Detection(
        latitude=latitude,
        longitude=longitude,
        snapshot_url=snapshot_url,
        confidence=confidence,
        status="pending" if confidence and confidence > 0.7 else "dismissed",
        person_id=matched_person.id if matched_person else None,
        person_name=matched_person.name if matched_person else None,
        case_id=matched_person.case_id if matched_person else None,
        location=f"Lat {latitude:.2f}, Lon {longitude:.2f}" if latitude else "Unknown Scanned Location",
        camera_id="MANUAL-SCAN",
        sms_sent=False
    )
    db.add(det)
    await db.commit()
    await db.refresh(det)
    return det

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
    
    # Continuous Learning and Alerts when VERIFIED
    if status == "verified" and det.case_id:
        person_res = await db.execute(select(MissingPerson).where(MissingPerson.case_id == det.case_id))
        person = person_res.scalar_one_or_none()
        
        if person:
            # 1. Dispatch SMS
            if not det.sms_sent and person.contact:
                msg = f"ALERT: Missing person {person.name} (Case ID: {person.case_id}) has been VERIFIED at {det.location or 'an unknown location'}."
                success = send_sms_alert(person.contact, msg)
                if success:
                    det.sms_sent = True

            # 2. Continuous Learning: Average new encoding
            if FR_AVAILABLE and det.snapshot_url and person.encoding:
                import io
                from PIL import Image
                import httpx
                
                try:
                    # Get new image bytes
                    img_bytes = None
                    if det.snapshot_url.startswith("/uploads/"):
                        path = "." + det.snapshot_url
                        if os.path.exists(path):
                            with open(path, "rb") as f:
                                img_bytes = f.read()
                    elif det.snapshot_url.startswith("http"):
                        async with httpx.AsyncClient() as client:
                            resp = await client.get(det.snapshot_url)
                            img_bytes = resp.content

                    if img_bytes:
                        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
                        encs = face_recognition.face_encodings(np.array(img))
                        if encs:
                            new_enc = encs[0]
                            old_data = json.loads(person.encoding)
                            old_enc = np.array(old_data["values"])
                            # Average the old and new encodings (0.7 weight to old, 0.3 to new) to slowly adapt
                            merged_enc = (old_enc * 0.7) + (new_enc * 0.3)
                            person.encoding = json.dumps({"values": merged_enc.tolist()})

                except Exception as e:
                    print(f"Error in continuous learning: {e}")
                
    await db.commit()
    return {"message": "Status updated"}
