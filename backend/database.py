import os
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
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def is_sqlite() -> bool:
    return "sqlite" in DB_URL
