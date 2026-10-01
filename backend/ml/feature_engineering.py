"""
Módulo de Ingeniería de Características (Feature Engineering).
Proyecto: FraudGuard AI

Genera variables derivadas con alto poder discriminante para la detección de fraude,
tanto en lotes (batch DataFrames) como para transacciones individuales en inferencia viva.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Union

def extract_hour(time_val: Any) -> int:
    """Extrae la hora como entero de formatos HH:MM:SS o HH:MM."""
    if pd.isnull(time_val):
        return 12
    if isinstance(time_val, (int, float)):
        return int(time_val) % 24
    s = str(time_val).strip()
    try:
        parts = s.split(":")
        return int(parts[0])
    except Exception:
        return 12

def apply_feature_engineering(df_in: pd.DataFrame) -> pd.DataFrame:
    """
    Aplica transformaciones de ingeniería de características a un DataFrame.
    Crea al menos 6 variables derivadas clave para la detección de fraude.
    """
    df = df_in.copy()

    # 1. Extracción de la hora
    if "hour" not in df.columns:
        df["hour"] = df["transaction_time"].apply(extract_hour)

    # 2. Variable derivada 1: hora_inusual (Transacciones entre 00:00 y 05:59)
    df["hora_inusual"] = df["hour"].apply(lambda h: 1 if h in [0, 1, 2, 3, 4, 5] else 0)

    # 3. Variable derivada 2: monto_vs_promedio (Ratio entre monto y promedio histórico)
    avg_amt = df["average_transaction_amount"].fillna(df["amount"].median())
    avg_amt = np.where(avg_amt <= 0, 1.0, avg_amt)
    df["monto_vs_promedio"] = np.round(df["amount"] / (avg_amt + 1e-5), 3)

    # 4. Variable derivada 3: transacciones_ultima_hora (Recent transactions)
    if "recent_transactions" in df.columns:
        df["transacciones_ultima_hora"] = df["recent_transactions"].fillna(0).astype(int)
    else:
        df["transacciones_ultima_hora"] = 0

    # 5. Variable derivada 4: distancia_anomala (> 100 km respecto a ubicación habitual)
    dist = df["distance_from_usual_location"].fillna(0.0)
    df["distancia_anomala"] = (dist > 100.0).astype(int)

    # 6. Variable derivada 5: ciudad_diferente (Transacción fuera de su ciudad habitual)
    city_str = df["city"].astype(str).str.strip().str.lower()
    usual_city_str = df["usual_city"].astype(str).str.strip().str.lower()
    df["ciudad_diferente"] = (city_str != usual_city_str).astype(int)

    # 7. Variable derivada 6: dispositivo_nuevo_desconocido
    dev_str = df["device_type"].astype(str).str.strip().str.lower()
    df["dispositivo_nuevo"] = dev_str.apply(lambda d: 1 if d in ["unknown", "other", "nuevo"] else 0)

    # 8. Variable derivada 7: ratio de intentos fallidos
    df["intentos_fallidos_elevados"] = (df["failed_attempts"].fillna(0) >= 2).astype(int)

    return df

def engineer_single_transaction(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calcula variables derivadas en tiempo real para una única transacción
    proveniente del formulario web.
    """
    res = dict(data)
    hour = extract_hour(res.get("transaction_time", "12:00:00"))
    res["hour"] = hour
    res["hora_inusual"] = 1 if hour in [0, 1, 2, 3, 4, 5] else 0

    avg_amt = float(res.get("average_transaction_amount", 100.0))
    if avg_amt <= 0:
        avg_amt = 1.0
    amt = float(res.get("amount", 0.0))
    res["monto_vs_promedio"] = round(amt / (avg_amt + 1e-5), 3)

    recent = int(res.get("recent_transactions", 0))
    res["transacciones_ultima_hora"] = recent

    dist = float(res.get("distance_from_usual_location", 0.0))
    res["distancia_anomala"] = 1 if dist > 100.0 else 0

    city = str(res.get("city", "")).strip().lower()
    usual_city = str(res.get("usual_city", "")).strip().lower()
    res["ciudad_diferente"] = 1 if (city != usual_city and city != "" and usual_city != "") else 0

    dev = str(res.get("device_type", "")).strip().lower()
    res["dispositivo_nuevo"] = 1 if dev in ["unknown", "other", "nuevo"] else 0

    failed = int(res.get("failed_attempts", 0))
    res["intentos_fallidos_elevados"] = 1 if failed >= 2 else 0

    return res
