import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import MissingPerson
from schemas import PersonOut
from auth import get_current_user, require_admin, User
from storage import upload_photo, delete_blob
import random

try:
    import face_recognition
    import numpy as np
    FR_AVAILABLE = True
except ImportError:
    FR_AVAILABLE = False

router = APIRouter(prefix="/persons", tags=["persons"])

def _generate_case_id() -> str:
    return f"ID-{random.randint(1000, 9999)}"

async def _unique_case_id(db: AsyncSession) -> str:
    for _ in range(20):
        cid = _generate_case_id()
        result = await db.execute(select(MissingPerson).where(MissingPerson.case_id == cid))
        if not result.scalar_one_or_none():
            return cid
    raise HTTPException(status_code=500, detail="Could not generate unique case ID")

def _encode_image_bytes(image_bytes: bytes) -> Optional[str]:
    if not FR_AVAILABLE:
        return None
    try:
        import io, json
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)
        encs = face_recognition.face_encodings(img_array)
        if encs:
            return json.dumps({"values": encs[0].tolist()})
        return None
    except Exception:
        return None

import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

@router.get("", response_model=list[PersonOut])
async def list_persons(
    lat: Optional[float] = None, 
    lon: Optional[float] = None,
    db: AsyncSession = Depends(get_db), 
    _: User = Depends(get_current_user)
):
    result = await db.execute(select(MissingPerson).order_by(MissingPerson.registered_at.desc()))
    persons = result.scalars().all()
    
    if lat is not None and lon is not None:
        # In-memory Haversine distance sorting for MVP
        def get_dist(p):
            if p.latitude is None or p.longitude is None:
                return float('inf')
            return haversine(lat, lon, p.latitude, p.longitude)
        persons = sorted(persons, key=get_dist)
        
    return persons

@router.post("", response_model=PersonOut)
async def register_person(
    name: str = Form(...),
    age: Optional[str] = Form(None),
    contact: Optional[str] = Form(None),
    priority: str = Form("normal"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    photo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case_id = await _unique_case_id(db)
    photo_url = None
    encoding = None

    if photo:
        image_bytes = await photo.read()
        ext = (photo.filename or "photo.jpg").rsplit(".", 1)[-1].lower()
        filename = f"{case_id}.{ext}"
        photo_url = await upload_photo(image_bytes, filename, photo.content_type or "image/jpeg")
        encoding = _encode_image_bytes(image_bytes)

    person = MissingPerson(
        case_id=case_id,
        name=name,
        age=age,
        contact=contact,
        priority=priority,
        latitude=latitude,
        longitude=longitude,
        photo_url=photo_url,
        encoding=encoding,
        registered_by_id=current_user.id,
    )
    db.add(person)
    await db.commit()
    await db.refresh(person)
    return person

@router.delete("/{person_id}", dependencies=[Depends(require_admin)])
async def delete_person(person_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MissingPerson).where(MissingPerson.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    if person.photo_url:
        delete_blob(person.photo_url)
    await db.delete(person)
    await db.commit()
    return {"message": "Person deleted"}

@router.patch("/{person_id}/priority", response_model=PersonOut)
async def update_priority(
    person_id: str,
    priority: str = Form(...),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(MissingPerson).where(MissingPerson.id == person_id))
    person = result.scalar_one_or_none()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    person.priority = priority
    await db.commit()
    await db.refresh(person)
    return person
