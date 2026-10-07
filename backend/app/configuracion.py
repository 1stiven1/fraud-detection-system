"""
Configuración Centralizada de FraudGuard AI.
"""

import os
from pydantic import BaseModel

class ConfigSettings(BaseModel):
    PROJECT_NAME: str = "FraudGuard AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Umbrales de riesgo centralizados
    RISK_LOW_THRESHOLD: float = 0.40     # 0% - 39.9% -> BAJO
    RISK_HIGH_THRESHOLD: float = 0.70    # 40% - 69.9% -> MEDIO, >= 70% -> ALTO

    # Recomendaciones operativas
    REC_BAJO: str = "Operación normal. No se requiere acción adicional."
    REC_MEDIO: str = "Solicitar validación adicional antes de completar la operación."
    REC_ALTO: str = "Bloquear temporalmente y solicitar validación de identidad"

    # Configuración de la base de datos PostgreSQL con fallback a SQLite
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:12345@localhost:5432/fraudguard_db"
    )

    RAW_DATA_PATH: str = os.path.join(BASE_DIR, "data", "raw", "transacciones_crudas.csv")
    PROCESSED_DATA_PATH: str = os.path.join(BASE_DIR, "data", "processed", "transacciones_procesadas.csv")
    ARTIFACTS_DIR: str = os.path.join(BASE_DIR, "artifacts")
    MODEL_PATH: str = os.path.join(BASE_DIR, "artifacts", "models", "modelo_fraude.joblib")

settings = ConfigSettings()
