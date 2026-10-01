"""
Módulo de Inferencia y Predicción de Fraude.
Proyecto: FraudGuard AI

Carga el pipeline serializado en backend/artifacts/models/fraud_model.joblib,
aplica las transformaciones en memoria y calcula la probabilidad de fraude en tiempo real.
"""

import os
import joblib
import pandas as pd
from typing import Dict, Any, Tuple
from ml.feature_engineering import engineer_single_transaction

_cached_model = None

NUMERIC_FEATURES = [
    "amount",
    "customer_age",
    "recent_transactions",
    "account_age_days",
    "failed_attempts",
    "distance_from_usual_location",
    "average_transaction_amount",
    "transaction_frequency",
    "monto_vs_promedio",
    "transacciones_ultima_hora",
    "hora_inusual",
    "distancia_anomala",
    "ciudad_diferente",
    "dispositivo_nuevo",
    "intentos_fallidos_elevados"
]

CATEGORICAL_FEATURES = [
    "merchant_category",
    "payment_method",
    "device_type",
    "city"
]

def resolve_model_path(model_path: str = None) -> str:
    """Resuelve la ruta absoluta del modelo sin importar el directorio de ejecución actual."""
    if model_path and os.path.exists(model_path):
        return os.path.abspath(model_path)
    possible_paths = [
        model_path,
        os.path.join(os.path.dirname(__file__), "..", "artifacts", "models", "fraud_model.joblib"),
        os.path.join(os.getcwd(), "artifacts", "models", "fraud_model.joblib"),
        os.path.join(os.getcwd(), "backend", "artifacts", "models", "fraud_model.joblib")
    ]
    for p in possible_paths:
        if p and os.path.exists(p):
            return os.path.abspath(p)
    # Ruta por defecto
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "artifacts", "models", "fraud_model.joblib"))

def load_fraud_model(model_path: str = None):
    """Carga y cachea el modelo de producción entrenado."""
    global _cached_model
    target_path = resolve_model_path(model_path)
    if _cached_model is None:
        if not os.path.exists(target_path):
            raise FileNotFoundError(
                f"El modelo no se encuentra en {target_path}. "
                "Debe ejecutar el pipeline de entrenamiento primero (python -m ml.train)."
            )
        _cached_model = joblib.load(target_path)
    return _cached_model

def predict_transaction(tx_data: Dict[str, Any], model_path: str = None) -> Tuple[float, Dict[str, Any]]:
    """
    Recibe una transacción, calcula features derivadas, ejecuta el pipeline de scikit-learn
    y retorna la probabilidad de fraude junto con las features calculadas.
    """
    model = load_fraud_model(model_path)

    # 1. Feature Engineering en tiempo real
    engineered = engineer_single_transaction(tx_data)

    # 2. Construir DataFrame con las columnas esperadas por el ColumnTransformer
    feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    row_dict = {}

    for col in NUMERIC_FEATURES:
        row_dict[col] = [float(engineered.get(col, 0.0))]

    for col in CATEGORICAL_FEATURES:
        val = str(engineered.get(col, "")).strip().lower()
        row_dict[col] = [val]

    df_row = pd.DataFrame(row_dict)[feature_cols]

    # 3. Predicción con predict_proba
    probs = model.predict_proba(df_row)[0]
    fraud_prob = float(probs[1])

    return fraud_prob, engineered
