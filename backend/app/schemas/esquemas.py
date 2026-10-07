"""
Esquemas Pydantic para Validación Robusta de Datos de Entrada y Salida.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TransactionInput(BaseModel):
    transaction_id: Optional[str] = Field(default=None, description="Identificador opcional de la transacción")
    amount: float = Field(..., gt=0, le=50000000, description="Monto monetario de la transacción en COP/USD")
    transaction_date: str = Field(default="2026-03-24", description="Fecha de la transacción (YYYY-MM-DD)")
    transaction_time: str = Field(default="14:30:00", description="Hora de la transacción (HH:MM:SS)")
    customer_age: int = Field(..., ge=18, le=105, description="Edad del titular de la cuenta")
    city: str = Field(..., min_length=2, description="Ciudad donde se realiza la compra")
    merchant_category: str = Field(..., min_length=2, description="Categoría comercial del comercio")
    payment_method: str = Field(..., min_length=2, description="Método de pago utilizado")
    recent_transactions: int = Field(default=0, ge=0, le=50, description="Transacciones en la última hora")
    device_type: str = Field(default="mobile_android", description="Tipo o huella del dispositivo")
    account_age_days: int = Field(..., ge=1, le=10000, description="Antigüedad de la cuenta bancaria en días")
    failed_attempts: int = Field(default=0, ge=0, le=20, description="Intentos de pago rechazados consecutivos previos")
    usual_city: str = Field(..., min_length=2, description="Ciudad de residencia habitual del cliente")
    distance_from_usual_location: float = Field(default=0.0, ge=0.0, le=25000.0, description="Distancia estimada en kilómetros")
    average_transaction_amount: float = Field(..., gt=0, le=50000000, description="Monto promedio histórico del cliente")
    transaction_frequency: float = Field(default=2.5, ge=0.1, le=50.0, description="Frecuencia típica diaria de transacciones")

class RiskFactor(BaseModel):
    variable: str
    label: str
    value: str
    impact: str  # ALTO, MEDIO, BAJO
    score: float
    is_risk: bool
    explanation: str

class PredictionResponse(BaseModel):
    prediction_id: str
    transaction_id: str
    fraud_probability: float
    percentage: float
    risk_level: str  # BAJO, MEDIO, ALTO
    recommendation: str
    factors: List[RiskFactor]
    model_used: str
    timestamp: str

class HistoryItemResponse(BaseModel):
    prediction_id: str
    transaction_id: str
    timestamp: str
    amount: float
    city: str
    merchant_category: str
    payment_method: Optional[str] = None
    fraud_probability: float
    percentage: float
    risk_level: str
    recommendation: str
    model_version: str
    input_data: Optional[Dict[str, Any]] = None
    risk_factors: Optional[List[Dict[str, Any]]] = None

class ModelMetric(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float

class ModelComparisonResponse(BaseModel):
    timestamp: str
    training_samples: int
    test_samples: int
    train_fraud_rate: float
    test_fraud_rate: float
    features_used: List[str]
    selected_model: str
    selection_reason: str
    models: List[ModelMetric]
