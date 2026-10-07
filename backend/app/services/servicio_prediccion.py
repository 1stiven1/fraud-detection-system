"""
Servicio Integrado de Predicción, Inferencia, Explicabilidad y Persistencia.
"""

import uuid
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.schemas.esquemas import TransactionInput, PredictionResponse, RiskFactor
from app.services.servicio_riesgo import evaluate_risk
from app.models.modelos_db import PredictionRecord
from ml.predecir import predict_transaction, load_fraud_model
from ml.explicacion import explain_transaction

def execute_prediction(input_data: TransactionInput, db: Session) -> PredictionResponse:
    raw_dict = input_data.model_dump()
    tx_id = raw_dict.get("transaction_id")
    if not tx_id or tx_id.strip() == "":
        tx_id = f"TX_MANUAL_{uuid.uuid4().hex[:8].upper()}"
    raw_dict["transaction_id"] = tx_id

    pred_id = f"PRED_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.utcnow().isoformat()

    prob, engineered_features = predict_transaction(raw_dict)
    risk_info = evaluate_risk(prob)

    model = load_fraud_model()
    raw_factors = explain_transaction(engineered_features, prob, model)

    factors_models = [
        RiskFactor(
            variable=f["variable"],
            label=f["label"],
            value=f["value"],
            impact=f["impact"],
            score=f["score"],
            is_risk=f["is_risk"],
            explanation=f["explanation"]
        )
        for f in raw_factors
    ]

    db_record = PredictionRecord(
        prediction_id=pred_id,
        timestamp=datetime.utcnow(),
        transaction_id=tx_id,
        amount=float(input_data.amount),
        city=str(input_data.city),
        merchant_category=str(input_data.merchant_category),
        payment_method=str(input_data.payment_method),
        fraud_probability=float(prob),
        risk_level=risk_info["level"],
        recommendation=risk_info["recommendation"],
        model_version="Random Forest v1.0 (Stratified 70/30)",
        input_data=raw_dict,
        risk_factors=[f.model_dump() for f in factors_models]
    )

    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return PredictionResponse(
        prediction_id=pred_id,
        transaction_id=tx_id,
        fraud_probability=risk_info["probability"],
        percentage=risk_info["percentage"],
        risk_level=risk_info["level"],
        recommendation=risk_info["recommendation"],
        factors=factors_models,
        model_used="Random Forest Classifier (Ensemble)",
        timestamp=now_iso
    )
