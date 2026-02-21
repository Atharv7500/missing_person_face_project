import asyncio
import logging
from sqlalchemy import select
from database import AsyncSessionLocal
from models import MissingPerson
import uuid
import random

logger = logging.getLogger(__name__)

async def fetch_external_databases():
    """
    Simulated background task that runs periodically to fetch data from
    external humanitarian databases like Google Person Finder or Interpol RSS.
    """
    logger.info("External DB Sync: Worker started.")
    
    while True:
        try:
            logger.info("External DB Sync: Fetching new humanitarian records...")
            # Simulate network request delay
            await asyncio.sleep(5)
            
            # Simulated dummy data from an external API
            mock_external_data = [
                {
                    "case_id": f"EXT-{random.randint(10000, 99999)}",
                    "name": "Jane Doe (External Database Match)",
                    "age": "20-30",
                    "priority": "high",
                    "latitude": 34.0522 + random.uniform(-1, 1),
                    "longitude": -118.2437 + random.uniform(-1, 1)
                }
            ]
            
            async with AsyncSessionLocal() as db:
                for ext in mock_external_data:
                    # Check if already exists
                    result = await db.execute(select(MissingPerson).where(MissingPerson.case_id == ext["case_id"]))
                    if not result.scalar_one_or_none():
                        new_person = MissingPerson(
                            case_id=ext["case_id"],
                            name=ext["name"],
                            age=ext["age"],
                            priority=ext["priority"],
                            latitude=ext["latitude"],
                            longitude=ext["longitude"],
                            contact="external_api@example.com"
                        )
                        db.add(new_person)
                        logger.info(f"External DB Sync: Imported new record {ext['case_id']}")
                await db.commit()
                
        except Exception as e:
            logger.error(f"External DB Sync Error: {e}")
            
        # Run every 24 hours (for demonstration, we use 1 hour)
        await asyncio.sleep(3600)
