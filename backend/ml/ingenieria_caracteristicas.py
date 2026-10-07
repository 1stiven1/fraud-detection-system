"""
Módulo de Ingeniería de Características (ingenieria_caracteristicas.py).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any

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
    """
    df = df_in.copy()

    if "hour" not in df.columns:
        df["hour"] = df["transaction_time"].apply(extract_hour)

    df["hora_inusual"] = df["hour"].apply(lambda h: 1 if h in [0, 1, 2, 3, 4, 5] else 0)

    avg_amt = df["average_transaction_amount"].fillna(df["amount"].median())
    avg_amt = np.where(avg_amt <= 0, 1.0, avg_amt)
    df["monto_vs_promedio"] = np.round(df["amount"] / (avg_amt + 1e-5), 3)

    if "recent_transactions" in df.columns:
        df["transacciones_ultima_hora"] = df["recent_transactions"].fillna(0).astype(int)
    else:
        df["transacciones_ultima_hora"] = 0

    dist = df["distance_from_usual_location"].fillna(0.0)
    df["distancia_anomala"] = (dist > 100.0).astype(int)

    city_str = df["city"].astype(str).str.strip().str.lower()
    usual_city_str = df["usual_city"].astype(str).str.strip().str.lower()
    df["ciudad_diferente"] = (city_str != usual_city_str).astype(int)

    dev_str = df["device_type"].astype(str).str.strip().str.lower()
    df["dispositivo_nuevo"] = dev_str.apply(lambda d: 1 if d in ["unknown", "other", "nuevo"] else 0)

    df["intentos_fallidos_elevados"] = (df["failed_attempts"].fillna(0) >= 2).astype(int)

    return df

def engineer_single_transaction(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calcula variables derivadas en tiempo real para una única transacción.
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
