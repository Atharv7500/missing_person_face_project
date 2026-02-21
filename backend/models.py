import uuid
import json
from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base

# Use portable types (String UUIDs + JSON) so models work with both SQLite and PostgreSQL

class User(Base):
    __tablename__ = "users"

    id: Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str]     = mapped_column(String(20), default="operator")
    clearance_level: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    persons = relationship("MissingPerson", back_populates="registered_by_user")


class MissingPerson(Base):
    __tablename__ = "missing_persons"

    id: Mapped[str]  = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id: Mapped[str]   = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str]      = mapped_column(Text, nullable=False)
    age: Mapped[str | None]     = mapped_column(String(20), nullable=True)
    contact: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str]       = mapped_column(String(20), default="normal")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None]= mapped_column(Float, nullable=True)
    photo_url: Mapped[str | None]  = mapped_column(Text, nullable=True)
    encoding: Mapped[str | None]   = mapped_column(Text, nullable=True)  # JSON string
    registered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    registered_by_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    registered_by_user = relationship("User", back_populates="persons")
    detections = relationship("Detection", back_populates="person")


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[str]   = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    person_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("missing_persons.id"), nullable=True)
    person_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    case_id: Mapped[str | None]     = mapped_column(String(20), nullable=True)
    location: Mapped[str | None]    = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None]  = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    camera_id: Mapped[str | None]   = mapped_column(String(30), nullable=True)
    timestamp: Mapped[datetime]     = mapped_column(DateTime, default=datetime.utcnow)
    snapshot_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    sms_sent: Mapped[bool]  = mapped_column(Boolean, default=False)
    status: Mapped[str]     = mapped_column(String(20), default="pending")

    person = relationship("MissingPerson", back_populates="detections")
