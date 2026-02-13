import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

async def check_schema():
    DATABASE_URL = "sqlite+aiosqlite:///./smart_planner.db"
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.connect() as conn:
        # Try to execute the query directly
        result = await conn.execute(__import__('sqlalchemy').text("SELECT due_date FROM tasks LIMIT 1"))
        print(f"Query result: {result.fetchone()}")

asyncio.run(check_schema())
