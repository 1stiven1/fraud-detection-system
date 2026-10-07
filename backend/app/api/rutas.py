"""
Rutas API REST de FastAPI para FraudGuard AI.
"""

import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.base_datos import get_db
from app.configuracion import settings
from app.schemas.esquemas import (
    TransactionInput, PredictionResponse, HistoryItemResponse,
    ModelComparisonResponse
)
from app.services.servicio_prediccion import execute_prediction
from app.models.modelos_db import PredictionRecord
from ml.predecir import load_fraud_model
import pandas as pd

router = APIRouter()

def read_json_artifact(filename: str) -> Dict[str, Any]:
    filepath = os.path.join(settings.ARTIFACTS_DIR, "metrics", filename)
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El artefacto {filename} no ha sido generado aún. Ejecute el pipeline de entrenamiento."
        )
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("/health", tags=["Sistema"])
def health_check():
    model_loaded = False
    try:
        load_fraud_model()
        model_loaded = True
    except Exception:
        pass

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": model_loaded
    }

@router.get("/dashboard", tags=["Dashboard"])
def get_dashboard_summary(db: Session = Depends(get_db)):
    eda_dist = read_json_artifact("distribuciones_eda.json")
    eda_findings = read_json_artifact("hallazgos_eda.json")
    model_comp = read_json_artifact("comparacion_modelos.json")
    conf_mat = read_json_artifact("matriz_confusion.json")
    feat_imp = read_json_artifact("importancia_variables.json")

    live_count = db.query(PredictionRecord).count()
    live_high_risk = db.query(PredictionRecord).filter(PredictionRecord.risk_level == "ALTO").count()
    live_medium_risk = db.query(PredictionRecord).filter(PredictionRecord.risk_level == "MEDIO").count()

    summary = eda_dist.get("summary", {})
    total_tx = summary.get("total_transactions", 0) + live_count
    total_fraud = summary.get("total_fraud", 0) + live_high_risk
    suspicious_count = total_fraud + live_medium_risk

    avg_amt = summary.get("average_amount", 145.0)
    suspicious_amount = round(suspicious_count * avg_amt * 2.8, 2)

    selected_name = model_comp.get("selected_model", "Random Forest")
    selected_metrics = next(
        (m for m in model_comp.get("models", []) if m["model_name"] == selected_name),
        model_comp.get("models", [{}])[0]
    )

    return {
        "cards": {
            "total_transactions": total_tx,
            "suspicious_transactions": suspicious_count,
            "high_risk_transactions": total_fraud,
            "suspicious_amount": suspicious_amount,
            "base_fraud_rate": summary.get("base_fraud_rate", 8.2),
            "live_evaluations_count": live_count
        },
        "charts": {
            "fraud_by_hour": eda_dist.get("fraud_by_hour", [])[:12],
            "fraud_by_city": eda_dist.get("fraud_by_city", [])[:6],
            "fraud_by_category": eda_dist.get("fraud_by_category", [])[:6],
            "amount_distribution": eda_dist.get("amount_distribution", []),
            "risk_distribution": [
                {"name": "Bajo Riesgo", "count": int(total_tx * 0.91), "color": "#10B981"},
                {"name": "Riesgo Medio", "count": int(total_tx * 0.05), "color": "#F59E0B"},
                {"name": "Riesgo Alto", "count": int(total_tx * 0.04), "color": "#EF4444"}
            ]
        },
        "model_summary": {
            "selected_model": selected_name,
            "timestamp": model_comp.get("timestamp"),
            "training_samples": model_comp.get("training_samples"),
            "accuracy": selected_metrics.get("accuracy"),
            "precision": selected_metrics.get("precision"),
            "recall": selected_metrics.get("recall"),
            "f1_score": selected_metrics.get("f1_score"),
            "roc_auc": selected_metrics.get("roc_auc")
        },
        "top_features": feat_imp.get("features", [])[:6],
        "confusion_matrix": conf_mat.get(selected_name, {})
    }

@router.post("/predict", response_model=PredictionResponse, tags=["Inferencia"])
def predict(input_data: TransactionInput, db: Session = Depends(get_db)):
    try:
        return execute_prediction(input_data, db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante el proceso de inferencia: {str(e)}"
        )

@router.get("/history", response_model=List[HistoryItemResponse], tags=["Historial"])
def get_prediction_history(
    search: Optional[str] = Query(None, description="Buscar por ID de transacción o predicción"),
    risk_level: Optional[str] = Query(None, description="Filtrar por nivel: BAJO, MEDIO, ALTO"),
    sort_by: str = Query("timestamp", description="Campo para ordenar: timestamp, fraud_probability, amount"),
    order: str = Query("desc", description="asc o desc"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(PredictionRecord)

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (PredictionRecord.transaction_id.ilike(search_filter)) |
            (PredictionRecord.prediction_id.ilike(search_filter)) |
            (PredictionRecord.city.ilike(search_filter))
        )

    if risk_level and risk_level.upper() in ["BAJO", "MEDIO", "ALTO"]:
        query = query.filter(PredictionRecord.risk_level == risk_level.upper())

    sort_col = getattr(PredictionRecord, sort_by, PredictionRecord.timestamp)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    records = query.offset(offset).limit(limit).all()

    items = []
    for r in records:
        items.append(HistoryItemResponse(
            prediction_id=r.prediction_id,
            transaction_id=r.transaction_id,
            timestamp=r.timestamp.isoformat() if r.timestamp else datetime.utcnow().isoformat(),
            amount=r.amount,
            city=r.city,
            merchant_category=r.merchant_category,
            payment_method=r.payment_method,
            fraud_probability=round(r.fraud_probability, 4),
            percentage=round(r.fraud_probability * 100, 1),
            risk_level=r.risk_level,
            recommendation=r.recommendation,
            model_version=r.model_version or "Random Forest v1.0",
            input_data=r.input_data,
            risk_factors=r.risk_factors
        ))
    return items

@router.get("/history/{prediction_id}", response_model=HistoryItemResponse, tags=["Historial"])
def get_prediction_detail(prediction_id: str, db: Session = Depends(get_db)):
    r = db.query(PredictionRecord).filter(PredictionRecord.prediction_id == prediction_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Predicción no encontrada")
    return HistoryItemResponse(
        prediction_id=r.prediction_id,
        transaction_id=r.transaction_id,
        timestamp=r.timestamp.isoformat() if r.timestamp else datetime.utcnow().isoformat(),
        amount=r.amount,
        city=r.city,
        merchant_category=r.merchant_category,
        payment_method=r.payment_method,
        fraud_probability=round(r.fraud_probability, 4),
        percentage=round(r.fraud_probability * 100, 1),
        risk_level=r.risk_level,
        recommendation=r.recommendation,
        model_version=r.model_version or "Random Forest v1.0",
        input_data=r.input_data,
        risk_factors=r.risk_factors
    )

@router.get("/metrics", response_model=ModelComparisonResponse, tags=["Modelos"])
def get_metrics():
    return read_json_artifact("comparacion_modelos.json")

@router.get("/models", tags=["Modelos"])
def get_models_info():
    comparison = read_json_artifact("comparacion_modelos.json")
    conf_matrix = read_json_artifact("matriz_confusion.json")
    return {
        "comparison": comparison,
        "confusion_matrices": conf_matrix
    }

@router.get("/feature-importance", tags=["Modelos"])
def get_feature_importance():
    return read_json_artifact("importancia_variables.json")

@router.get("/confusion-matrix", tags=["Modelos"])
def get_confusion_matrix():
    return read_json_artifact("matriz_confusion.json")

@router.get("/eda", tags=["Exploración"])
def get_eda_data():
    dist = read_json_artifact("distribuciones_eda.json")
    findings = read_json_artifact("hallazgos_eda.json")
    return {
        "distributions": dist,
        "findings": findings.get("findings", [])
    }

@router.get("/data-quality", tags=["Datos"])
def get_data_quality():
    return read_json_artifact("calidad_datos.json")

@router.get("/transactions", tags=["Datos"])
def get_sample_transactions(
    limit: int = Query(20, ge=1, le=100),
    fraud_only: bool = Query(False, description="Filtrar solo transacciones con fraude")
):
    if not os.path.exists(settings.PROCESSED_DATA_PATH):
        raise HTTPException(status_code=404, detail="Dataset procesado no encontrado.")
    df = pd.read_csv(settings.PROCESSED_DATA_PATH)
    if fraud_only:
        df = df[df["is_fraud"] == 1]
    samples = df.head(limit).to_dict(orient="records")
    return samples

@router.get("/transactions/{transaction_id}", tags=["Datos"])
def get_transaction_by_id(transaction_id: str):
    if not os.path.exists(settings.PROCESSED_DATA_PATH):
        raise HTTPException(status_code=404, detail="Dataset procesado no encontrado.")
    df = pd.read_csv(settings.PROCESSED_DATA_PATH)
    match = df[df["transaction_id"] == transaction_id]
    if match.empty:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return match.iloc[0].to_dict()

@router.post("/train", tags=["Modelos"])
def trigger_training():
    try:
        from ml.preprocesamiento import run_data_cleaning_pipeline
        from ml.entrenar import train_and_evaluate_models
        from ml.analisis_exploratorio import compute_eda_and_findings

        run_data_cleaning_pipeline(
            settings.RAW_DATA_PATH,
            settings.PROCESSED_DATA_PATH,
            os.path.join(settings.ARTIFACTS_DIR, "metrics", "calidad_datos.json")
        )
        compute_eda_and_findings(
            settings.PROCESSED_DATA_PATH,
            os.path.join(settings.ARTIFACTS_DIR, "metrics", "distribuciones_eda.json"),
            os.path.join(settings.ARTIFACTS_DIR, "metrics", "hallazgos_eda.json")
        )
        comparison = train_and_evaluate_models(
            settings.PROCESSED_DATA_PATH,
            settings.ARTIFACTS_DIR
        )
        load_fraud_model()
        return {
            "status": "success",
            "message": "Modelos reentrenados y evaluados exitosamente.",
            "metrics": comparison
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error durante el re-entrenamiento: {str(e)}"
        )
