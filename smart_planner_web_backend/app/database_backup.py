# app/database.py
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine
from .config import settings


# Create async engine for FastAPI
async_engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}

if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite uses NullPool; pool sizing args are invalid.
    engine = create_async_engine(settings.DATABASE_URL, **async_engine_kwargs)
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        pool_size=20,
        max_overflow=10,
        **async_engine_kwargs,
    )

# Create sync engine for migrations
sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    echo=settings.DEBUG,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync session factory (for migrations)
SessionLocal = sessionmaker(
    sync_engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all models"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_sync_db():
    """Get sync session for migrations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """Initialize database (create tables)"""
    from .models import Base
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)