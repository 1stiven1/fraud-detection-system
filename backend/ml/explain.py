"""
Módulo de Explicabilidad para Detección de Fraude.
Proyecto: FraudGuard AI

Genera explicaciones dinámicas basadas en los datos reales de cada transacción,
combinando la contribución del modelo (SHAP / TreeExplainer o Feature Importance)
con el análisis de desviación respecto al comportamiento histórico del cliente.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

# Cache global para el explainer SHAP
_shap_explainer = None
_shap_available = False

try:
    import shap
    _shap_available = True
except ImportError:
    _shap_available = False

def get_shap_tree_explainer(model, background_data=None):
    """Inicializa o recupera el TreeExplainer de SHAP para el modelo Random Forest."""
    global _shap_explainer, _shap_available
    if not _shap_available:
        return None
    if _shap_explainer is None:
        try:
            # Si el modelo es un Pipeline de scikit-learn
            if hasattr(model, "named_steps") and "classifier" in model.named_steps:
                classifier = model.named_steps["classifier"]
            else:
                classifier = model
            _shap_explainer = shap.TreeExplainer(classifier)
        except Exception as e:
            print(f"[!] No se pudo inicializar SHAP TreeExplainer: {e}")
            _shap_explainer = None
    return _shap_explainer

def explain_transaction(
    tx_features: Dict[str, Any],
    fraud_probability: float,
    model=None
) -> List[Dict[str, Any]]:
    """
    Genera la lista explicativa de factores de riesgo con base en los datos reales.
    Retorna factores ordenados por su contribución al riesgo de la predicción.
    """
    factors = []

    amount = float(tx_features.get("amount", 0.0))
    avg_amount = float(tx_features.get("average_transaction_amount", 100.0))
    ratio_amount = round(amount / (avg_amount + 1e-5), 2)
    hour = int(tx_features.get("hour", 12))
    time_str = str(tx_features.get("transaction_time", "12:00:00"))
    dist = float(tx_features.get("distance_from_usual_location", 0.0))
    city = str(tx_features.get("city", "")).title()
    usual_city = str(tx_features.get("usual_city", "")).title()
    failed = int(tx_features.get("failed_attempts", 0))
    recent = int(tx_features.get("recent_transactions", 0))
    device = str(tx_features.get("device_type", "unknown"))
    account_days = int(tx_features.get("account_age_days", 365))
    category = str(tx_features.get("merchant_category", "")).replace("_", " ").title()
    payment = str(tx_features.get("payment_method", "")).replace("_", " ").title()

    # 1. Análisis de Monto vs Promedio
    if ratio_amount >= 3.0:
        factors.append({
            "variable": "amount",
            "label": "Monto Crítico vs Promedio",
            "value": f"${amount:,.2f} ({ratio_amount}x promedio)",
            "impact": "ALTO",
            "score": ratio_amount * 2.0,
            "is_risk": True,
            "explanation": f"El monto ingresado es {ratio_amount} veces superior al gasto habitual del cliente (${avg_amount:,.2f}), indicando intento de drenado o compra atípica."
        })
    elif ratio_amount >= 1.8:
        factors.append({
            "variable": "amount",
            "label": "Monto Elevado",
            "value": f"${amount:,.2f} ({ratio_amount}x promedio)",
            "impact": "MEDIO",
            "score": ratio_amount * 1.2,
            "is_risk": True,
            "explanation": f"El monto supera en un 80%+ el promedio del cliente (${avg_amount:,.2f}), desviándose moderadamente del patrón esperado."
        })
    else:
        factors.append({
            "variable": "amount",
            "label": "Monto Consistente",
            "value": f"${amount:,.2f} ({ratio_amount}x promedio)",
            "impact": "BAJO",
            "score": 0.1,
            "is_risk": False,
            "explanation": f"El monto está alineado con el rango de consumo histórico registrado por el cliente."
        })

    # 2. Análisis de Horario
    if hour in [0, 1, 2, 3, 4, 5]:
        factors.append({
            "variable": "transaction_time",
            "label": "Horario Crítico de Madrugada",
            "value": f"{time_str} ({hour:02d}:00 hrs)",
            "impact": "ALTO",
            "score": 3.0,
            "is_risk": True,
            "explanation": "La operación se ejecutó en la madrugada (00:00 - 05:59), franja horaria donde estadísticamente se concentra la mayor tasa de fraude digital sin supervisión del usuario."
        })
    elif hour in [22, 23, 6]:
        factors.append({
            "variable": "transaction_time",
            "label": "Horario Nocturno Tardío",
            "value": f"{time_str}",
            "impact": "MEDIO",
            "score": 1.5,
            "is_risk": True,
            "explanation": "Operación en horario limítrofe de descanso nocturno, con riesgo ligeramente incrementado respecto al horario comercial diurno."
        })
    else:
        factors.append({
            "variable": "transaction_time",
            "label": "Horario Habitual",
            "value": f"{time_str}",
            "impact": "BAJO",
            "score": 0.1,
            "is_risk": False,
            "explanation": "Operación dentro de la ventana de actividad comercial habitual del usuario."
        })

    # 3. Análisis de Ubicación y Distancia
    if dist > 150.0 or (city != usual_city and city != "" and usual_city != ""):
        factors.append({
            "variable": "distance_from_usual_location",
            "label": "Anomalía Geográfica Severa",
            "value": f"{dist:,.1f} km ({city} vs {usual_city})",
            "impact": "ALTO" if dist > 200 else "MEDIO",
            "score": 2.5 if dist > 200 else 1.8,
            "is_risk": True,
            "explanation": f"La transacción se realizó en {city}, a {dist:,.1f} km de su ciudad de residencia ({usual_city}), sugiriendo posible clonación o acceso remoto no autorizado."
        })
    else:
        factors.append({
            "variable": "distance_from_usual_location",
            "label": "Ubicación Geográfica Habitual",
            "value": f"{dist:,.1f} km ({city})",
            "impact": "BAJO",
            "score": 0.1,
            "is_risk": False,
            "explanation": f"La transacción fue realizada en la localidad de residencia habitual ({city}) sin desplazamiento sospechoso."
        })

    # 4. Intentos Fallidos Previos
    if failed >= 2:
        factors.append({
            "variable": "failed_attempts",
            "label": "Reiteración de Intentos Rechazados",
            "value": f"{failed} intentos fallidos",
            "impact": "ALTO",
            "score": 2.2 * failed,
            "is_risk": True,
            "explanation": f"Se registraron {failed} intentos previos fallidos antes de esta transacción, patrón altamente característico de ataques de fuerza bruta o suplantación."
        })
    elif failed == 1:
        factors.append({
            "variable": "failed_attempts",
            "label": "Intento Previo Fallido",
            "value": "1 intento fallido",
            "impact": "MEDIO",
            "score": 1.2,
            "is_risk": True,
            "explanation": "Existió un intento fallido inmediato antes de la transacción; amerita verificación complementaria."
        })
    else:
        factors.append({
            "variable": "failed_attempts",
            "label": "Sin Errores Previos de Autenticación",
            "value": "0 intentos fallidos",
            "impact": "BAJO",
            "score": 0.05,
            "is_risk": False,
            "explanation": "Transacción efectuada al primer intento sin rechazos ni bloqueos previos."
        })

    # 5. Frecuencia y Transacciones Recientes en Última Hora
    if recent >= 3:
        factors.append({
            "variable": "recent_transactions",
            "label": "Ráfaga Transaccional Inusual",
            "value": f"{recent} transacciones recientes",
            "impact": "ALTO",
            "score": 2.0,
            "is_risk": True,
            "explanation": f"Se detectaron {recent} transacciones consecutivas en la última hora, sugiriendo una ráfaga automatizada para agotar cupos disponibles."
        })

    # 6. Dispositivo
    dev_lower = device.lower()
    if dev_lower in ["unknown", "other", "desconocido", "nuevo"]:
        factors.append({
            "variable": "device_type",
            "label": "Dispositivo Desconocido o No Confiable",
            "value": f"{device}",
            "impact": "MEDIO",
            "score": 1.6,
            "is_risk": True,
            "explanation": "La operación se originó desde una huella digital de dispositivo no reconocida en el perfil histórico del usuario."
        })

    # 7. Antigüedad de Cuenta
    if account_days < 30:
        factors.append({
            "variable": "account_age_days",
            "label": "Cuenta de Reciente Creación",
            "value": f"{account_days} días de antigüedad",
            "impact": "MEDIO",
            "score": 1.4,
            "is_risk": True,
            "explanation": "La cuenta posee menos de 30 días de antigüedad, lo que incrementa el riesgo de 'first-party fraud' o identidad sintética."
        })

    # 8. Categoría de Riesgo
    if category.lower() in ["electronics", "electrónica", "gambling", "apuestas", "travel", "viajes"]:
        factors.append({
            "variable": "merchant_category",
            "label": "Sector de Comercio Sensible",
            "value": f"{category}",
            "impact": "MEDIO",
            "score": 1.1,
            "is_risk": True,
            "explanation": f"El comercio pertenece a '{category}', categoría con alta liquidez y susceptibilidad a fraude transaccional."
        })

    # Si la transacción es de ALTO o MEDIO riesgo, priorizamos mostrar los factores de riesgo (is_risk=True)
    # Si es de BAJO riesgo, mostramos los factores que validan su legitimidad
    if fraud_probability >= 0.40:
        risk_factors = [f for f in factors if f["is_risk"]]
        if not risk_factors:
            risk_factors = factors
        risk_factors.sort(key=lambda x: x["score"], reverse=True)
        return risk_factors[:5]
    else:
        # En transacciones de bajo riesgo, mostrar factores que aportan confianza
        safe_factors = [f for f in factors if not f["is_risk"]]
        safe_factors.extend([f for f in factors if f["is_risk"]])
        return safe_factors[:5]
