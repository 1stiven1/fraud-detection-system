"""
Punto de Entrada Principal de la API FraudGuard.
Desarrollado con FastAPI, persistencia PostgreSQL / SQLite y orquestación de Machine Learning.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.configuracion import settings
from app.base_datos import engine, Base
from app.models.modelos_db import PredictionRecord
from app.api.rutas import router
from ml.predecir import load_fraud_model

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[*] Precargando modelo de Machine Learning en memoria...")
    try:
        load_fraud_model(settings.MODEL_PATH)
        print("[OK] Modelo de producción cargado exitosamente.")
    except Exception as e:
        print(f"[!] Advertencia al cargar modelo: {e}")

    yield

    print("[*] Apagando servicio FraudGuard...")

app = FastAPI(
    title="FraudGuard - API de Detección de Fraude",
    description="Sistema web de Minería de Datos y Machine Learning para detección y prevención de fraude en transacciones digitales.",
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "service": "FraudGuard API",
        "status": "online",
        "docs_url": "/docs",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
