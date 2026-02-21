import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import get_settings

settings = get_settings()

# Use SQLite by default if no PostgreSQL URL is set
_url = settings.DATABASE_URL
if _url.startswith("postgresql"):
    # asyncpg driver for PostgreSQL
    DB_URL = _url
else:
    # aiosqlite driver for SQLite (local dev, no setup needed)
    sqlite_path = os.path.join(os.path.dirname(__file__), "bureau.db")
    DB_URL = f"sqlite+aiosqlite:///{sqlite_path}"

engine = create_async_engine(
    DB_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in DB_URL else {},
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
        await conn.run_sync(Base.metadata.create_all)
        
        # Simple migrations for existing local SQLite databases
        if is_sqlite():
            tables = ["missing_persons", "detections"]
            columns = ["latitude", "longitude"]
            for t in tables:
                for c in columns:
                    try:
                        await conn.execute(text(f"ALTER TABLE {t} ADD COLUMN {c} FLOAT;"))
                    except Exception:
                        pass # Column already exists

def is_sqlite() -> bool:
    return "sqlite" in DB_URL
