"""
Punto de Entrada Principal de la API FraudGuard AI.
Desarrollado con FastAPI, persistencia SQLite y orquestación de Machine Learning.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.models.db_models import PredictionRecord
from app.api.routes import router
from ml.predict import load_fraud_model

# Asegurar creación de tablas en la base de datos SQLite
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Precarga del modelo en memoria para inferencia de baja latencia
    print("[*] Precargando modelo de Machine Learning en memoria...")
    try:
        load_fraud_model(settings.MODEL_PATH)
        print("[OK] Modelo de producción cargado exitosamente.")
    except Exception as e:
        print(f"[!] Advertencia al cargar modelo: {e}")

    yield

    print("[*] Apagando servicio FraudGuard AI...")

app = FastAPI(
    title="FraudGuard AI - API de Detección de Fraude",
    description="Sistema web de Minería de Datos y Machine Learning para detección y prevención de fraude en transacciones digitales.",
    version=settings.VERSION,
    lifespan=lifespan
)

# Configuración de CORS para desarrollo local y producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen en desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro del enrutador bajo /api
app.include_router(router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "service": "FraudGuard AI API",
        "status": "online",
        "docs_url": "/docs",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
