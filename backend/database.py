import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import get_settings

settings = get_settings()

DB_URL = settings.DATABASE_URL
if not DB_URL or not DB_URL.startswith("postgresql"):
    raise ValueError("A PostgreSQL DATABASE_URL is required (e.g., postgresql+asyncpg://user:pass@host/db)")

# Ensure we use asyncpg driver
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    DB_URL,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    """Create all tables and run basic migrations."""
    async with engine.begin() as conn:
        # Create extension if not exists
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.run_sync(Base.metadata.create_all)
