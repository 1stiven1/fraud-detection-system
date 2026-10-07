"""
Servicio Centralizado de Evaluación de Riesgo y Asignación de Recomendaciones.
"""

from typing import Dict, Any
from app.configuracion import settings

def evaluate_risk(probability: float) -> Dict[str, Any]:
    """
    Recibe la probabilidad continua [0.0 - 1.0], calcula el porcentaje,
    asigna el nivel de riesgo correspondiente según los umbrales y
    retorna la recomendación de negocio.
    """
    prob_clean = max(0.0, min(1.0, float(probability)))
    percentage = round(prob_clean * 100, 1)

    if prob_clean < settings.RISK_LOW_THRESHOLD:
        level = "BAJO"
        recommendation = settings.REC_BAJO
    elif prob_clean < settings.RISK_HIGH_THRESHOLD:
        level = "MEDIO"
        recommendation = settings.REC_MEDIO
    else:
        level = "ALTO"
        recommendation = settings.REC_ALTO

    return {
        "probability": round(prob_clean, 4),
        "percentage": percentage,
        "level": level,
        "recommendation": recommendation
    }
