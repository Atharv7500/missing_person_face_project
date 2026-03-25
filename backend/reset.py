import asyncio
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from database import AsyncSessionLocal
from models import User
from sqlalchemy import select
from auth import hash_password

async def reset():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == "admin"))
        user = result.scalar_one_or_none()
        if user:
            user.password_hash = await hash_password("admin123")
            await db.commit()
            print("SUCCESS: Admin password reset to admin123")
        else:
            print("No admin user found.")

if __name__ == "__main__":
    asyncio.run(reset())
