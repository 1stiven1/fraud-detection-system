"""
Modelos ORM de Base de Datos SQLAlchemy en Español.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.base_datos import Base

class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    prediction_id = Column(String(50), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    transaction_id = Column(String(50), index=True, nullable=False)
    amount = Column(Float, nullable=False)
    city = Column(String(100), nullable=False)
    merchant_category = Column(String(100), nullable=False)
    payment_method = Column(String(100), nullable=True)
    fraud_probability = Column(Float, nullable=False)
    risk_level = Column(String(20), index=True, nullable=False)  # BAJO, MEDIO, ALTO
    recommendation = Column(Text, nullable=False)
    model_version = Column(String(50), default="Random Forest v1.0")
    
    # Contexto completo de entrada y factores explicativos para auditoría
    input_data = Column(JSON, nullable=True)
    risk_factors = Column(JSON, nullable=True)
