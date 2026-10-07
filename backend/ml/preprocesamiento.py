"""
Módulo de Limpieza y Calidad de Datos (preprocesamiento.py).
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any

def detect_outliers_iqr(df: pd.DataFrame, column: str) -> int:
    """Calcula número de valores atípicos usando el rango intercuartílico (IQR)."""
    if column not in df.columns or not np.issubdtype(df[column].dtype, np.number):
        return 0
    clean_series = df[column].dropna()
    q25, q75 = np.percentile(clean_series, 25), np.percentile(clean_series, 75)
    iqr = q75 - q25
    cut_off = iqr * 1.5
    lower, upper = q25 - cut_off, q75 + cut_off
    outliers = clean_series[(clean_series < lower) | (clean_series > upper)]
    return int(len(outliers))

def run_data_cleaning_pipeline(
    raw_path: str = "backend/data/raw/transacciones_crudas.csv",
    processed_path: str = "backend/data/processed/transacciones_procesadas.csv",
    metrics_path: str = "backend/artifacts/metrics/calidad_datos.json"
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    print(f"[*] Iniciando pipeline de limpieza de datos desde: {raw_path}")
    df_raw = pd.read_csv(raw_path)

    n_records_before = len(df_raw)
    n_cols_before = len(df_raw.columns)
    nulls_by_col_before = {col: int(df_raw[col].isnull().sum()) for col in df_raw.columns if df_raw[col].isnull().sum() > 0}
    total_nulls_before = int(df_raw.isnull().sum().sum())
    duplicates_before = int(df_raw.duplicated().sum())
    outliers_amount_before = detect_outliers_iqr(df_raw, "amount")
    outliers_distance_before = detect_outliers_iqr(df_raw, "distance_from_usual_location")
    invalid_amounts_before = int((df_raw["amount"] <= 0).sum())

    before_metrics = {
        "records": n_records_before,
        "columns": n_cols_before,
        "total_nulls": total_nulls_before,
        "nulls_by_column": nulls_by_col_before,
        "duplicate_rows": duplicates_before,
        "invalid_negative_amounts": invalid_amounts_before,
        "outliers_detected": {
            "amount": outliers_amount_before,
            "distance": outliers_distance_before
        }
    }

    transformations_applied = []
    df_clean = df_raw.copy()

    if duplicates_before > 0:
        df_clean = df_clean.drop_duplicates().reset_index(drop=True)
        transformations_applied.append(f"Eliminación de {duplicates_before} filas duplicadas exactas.")

    if invalid_amounts_before > 0:
        df_clean = df_clean[df_clean["amount"] > 0].reset_index(drop=True)
        transformations_applied.append(f"Filtrado de {invalid_amounts_before} transacciones con montos nulos o negativos.")

    text_cols = ["merchant_category", "payment_method", "device_type", "city", "usual_city"]
    for col in text_cols:
        if col in df_clean.columns:
            df_clean[col] = df_clean[col].astype(str).str.strip().str.lower()
            df_clean.loc[df_clean[col].isin(["nan", "none", ""]), col] = np.nan
    transformations_applied.append("Normalización sintáctica a minúsculas y recorte de espacios en variables de texto.")

    if "city" in df_clean.columns and df_clean["city"].isnull().sum() > 0:
        null_city_cnt = int(df_clean["city"].isnull().sum())
        df_clean["city"] = df_clean["city"].fillna(df_clean["usual_city"])
        transformations_applied.append(f"Imputación de {null_city_cnt} ciudades nulas usando la ciudad habitual del cliente.")

    if "device_type" in df_clean.columns and df_clean["device_type"].isnull().sum() > 0:
        null_dev_cnt = int(df_clean["device_type"].isnull().sum())
        df_clean["device_type"] = df_clean["device_type"].fillna("unknown")
        transformations_applied.append(f"Imputación de {null_dev_cnt} tipos de dispositivo nulos con categoría 'unknown'.")

    df_clean["transaction_date"] = pd.to_datetime(df_clean["transaction_date"], errors="coerce")
    df_clean = df_clean.dropna(subset=["transaction_date"]).reset_index(drop=True)
    df_clean["transaction_date"] = df_clean["transaction_date"].dt.strftime("%Y-%m-%d")
    transformations_applied.append("Validación y parseo ISO-8601 de campos de fecha y hora.")

    p999_amount = float(df_clean["amount"].quantile(0.999))
    capped_outliers = int((df_clean["amount"] > p999_amount).sum())
    df_clean["amount"] = np.where(df_clean["amount"] > p999_amount, p999_amount, df_clean["amount"])
    if capped_outliers > 0:
        transformations_applied.append(f"Winsorización/Capping superior en percentil 99.9 ($ {p999_amount:,.2f}) a {capped_outliers} transacciones con montos desproporcionados.")

    n_records_after = len(df_clean)
    n_cols_after = len(df_clean.columns)
    total_nulls_after = int(df_clean.isnull().sum().sum())
    duplicates_after = int(df_clean.duplicated().sum())

    after_metrics = {
        "records": n_records_after,
        "columns": n_cols_after,
        "total_nulls": total_nulls_after,
        "nulls_by_column": {col: int(df_clean[col].isnull().sum()) for col in df_clean.columns if df_clean[col].isnull().sum() > 0},
        "duplicate_rows": duplicates_after,
        "invalid_negative_amounts": int((df_clean["amount"] <= 0).sum()),
        "outliers_detected": {
            "amount": detect_outliers_iqr(df_clean, "amount"),
            "distance": detect_outliers_iqr(df_clean, "distance_from_usual_location")
        }
    }

    quality_report = {
        "status": "success",
        "before": before_metrics,
        "after": after_metrics,
        "transformations_applied": transformations_applied,
        "summary": {
            "records_removed": n_records_before - n_records_after,
            "nulls_resolved": total_nulls_before - total_nulls_after,
            "duplicates_removed": duplicates_before - duplicates_after,
            "data_health_score": round(((n_records_after / n_records_before) * 100), 2)
        }
    }

    os.makedirs(os.path.dirname(processed_path), exist_ok=True)
    df_clean.to_csv(processed_path, index=False)

    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(quality_report, f, indent=4, ensure_ascii=False)

    print(f"[OK] Dataset PROCESADO guardado exitosamente en {processed_path}")
    return df_clean, quality_report

if __name__ == "__main__":
    run_data_cleaning_pipeline()
