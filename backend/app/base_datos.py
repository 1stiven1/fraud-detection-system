"""
Módulo de Base de Datos y Sesiones SQLAlchemy.
Persistencia relacional en PostgreSQL / SQLite.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.configuracion import settings

# Para SQLite necesitamos check_same_thread=False
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Generador de dependencias para sesiones de base de datos."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
