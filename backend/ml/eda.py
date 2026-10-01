"""
Módulo de Análisis Exploratorio de Datos (EDA) y Detección de Hallazgos Estadísticos.
Proyecto: FraudGuard AI

Calcula distribuciones agregadas y genera hallazgos empíricos estadísticamente fundamentados.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List

def compute_eda_and_findings(
    processed_path: str = "backend/data/processed/transactions_processed.csv",
    output_distributions_path: str = "backend/artifacts/metrics/eda_distributions.json",
    output_findings_path: str = "backend/artifacts/metrics/eda_findings.json"
) -> Dict[str, Any]:
    print(f"[*] Analizando distribuciones y extrayendo hallazgos desde {processed_path}...")
    df = pd.read_csv(processed_path)

    # Asegurar hora
    def extract_h(t):
        try:
            return int(str(t).split(":")[0])
        except Exception:
            return 12

    if "hour" not in df.columns:
        df["hour"] = df["transaction_time"].apply(extract_h)

    total_tx = len(df)
    total_fraud = int(df["is_fraud"].sum())
    base_fraud_rate = float(round((total_fraud / total_tx) * 100, 2))

    # 1. DISTRIBUCIONES CLAVE

    # A. Fraude vs No Fraude
    fraud_distribution = [
        {"name": "No Fraude (Legítimas)", "count": total_tx - total_fraud, "percentage": round(100 - base_fraud_rate, 2)},
        {"name": "Fraude Confirmado", "count": total_fraud, "percentage": base_fraud_rate}
    ]

    # B. Fraudes por Hora
    hour_grouped = df.groupby("hour")["is_fraud"].agg(["count", "sum"]).reset_index()
    fraud_by_hour = []
    for _, row in hour_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        fraud_by_hour.append({
            "hour": int(row["hour"]),
            "hour_label": f"{int(row['hour']):02d}:00",
            "total_transactions": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })

    # C. Fraudes por Ciudad
    city_grouped = df.groupby("city")["is_fraud"].agg(["count", "sum"]).reset_index()
    fraud_by_city = []
    for _, row in city_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        fraud_by_city.append({
            "city": str(row["city"]).title(),
            "total_transactions": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })
    fraud_by_city.sort(key=lambda x: x["fraud_rate"], reverse=True)

    # D. Fraudes por Categoría
    cat_grouped = df.groupby("merchant_category")["is_fraud"].agg(["count", "sum"]).reset_index()
    fraud_by_category = []
    for _, row in cat_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        fraud_by_category.append({
            "category": str(row["merchant_category"]).replace("_", " ").title(),
            "total_transactions": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })
    fraud_by_category.sort(key=lambda x: x["fraud_rate"], reverse=True)

    # E. Fraudes por Método de Pago
    pay_grouped = df.groupby("payment_method")["is_fraud"].agg(["count", "sum"]).reset_index()
    fraud_by_payment = []
    for _, row in pay_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        fraud_by_payment.append({
            "payment_method": str(row["payment_method"]).replace("_", " ").title(),
            "total_transactions": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })
    fraud_by_payment.sort(key=lambda x: x["fraud_rate"], reverse=True)

    # F. Fraudes por Tipo de Dispositivo
    dev_grouped = df.groupby("device_type")["is_fraud"].agg(["count", "sum"]).reset_index()
    fraud_by_device = []
    for _, row in dev_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        fraud_by_device.append({
            "device_type": str(row["device_type"]).replace("_", " ").title(),
            "total_transactions": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })
    fraud_by_device.sort(key=lambda x: x["fraud_rate"], reverse=True)

    # G. Distribución de montos (rangos)
    bins = [0, 50, 150, 300, 600, 1500, float("inf")]
    labels = ["$0 - $50", "$50 - $150", "$150 - $300", "$300 - $600", "$600 - $1,500", "> $1,500"]
    df["amount_bin"] = pd.cut(df["amount"], bins=bins, labels=labels, right=False)
    amt_grouped = df.groupby("amount_bin", observed=False)["is_fraud"].agg(["count", "sum"]).reset_index()
    amount_distribution = []
    for _, row in amt_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        amount_distribution.append({
            "range": str(row["amount_bin"]),
            "count": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })

    # H. Relación Distancia vs Fraude (rangos)
    dist_bins = [0, 20, 50, 150, 300, float("inf")]
    dist_labels = ["0 - 20 km", "20 - 50 km", "50 - 150 km", "150 - 300 km", "> 300 km"]
    df["dist_bin"] = pd.cut(df["distance_from_usual_location"], bins=dist_bins, labels=dist_labels, right=False)
    dist_grouped = df.groupby("dist_bin", observed=False)["is_fraud"].agg(["count", "sum"]).reset_index()
    distance_distribution = []
    for _, row in dist_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        distance_distribution.append({
            "range": str(row["dist_bin"]),
            "count": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })

    # I. Intentos fallidos vs Fraude
    fail_grouped = df.groupby("failed_attempts")["is_fraud"].agg(["count", "sum"]).reset_index()
    failed_distribution = []
    for _, row in fail_grouped.iterrows():
        cnt = int(row["count"])
        frd = int(row["sum"])
        rate = round((frd / cnt * 100), 2) if cnt > 0 else 0
        failed_distribution.append({
            "attempts": int(row["failed_attempts"]),
            "count": cnt,
            "fraud_count": frd,
            "fraud_rate": rate
        })

    distributions_payload = {
        "summary": {
            "total_transactions": total_tx,
            "total_fraud": total_fraud,
            "total_legitimate": total_tx - total_fraud,
            "base_fraud_rate": base_fraud_rate,
            "average_amount": round(float(df["amount"].mean()), 2),
            "median_amount": round(float(df["amount"].median()), 2),
            "max_amount": round(float(df["amount"].max()), 2)
        },
        "fraud_distribution": fraud_distribution,
        "fraud_by_hour": fraud_by_hour,
        "fraud_by_city": fraud_by_city,
        "fraud_by_category": fraud_by_category,
        "fraud_by_payment": fraud_by_payment,
        "fraud_by_device": fraud_by_device,
        "amount_distribution": amount_distribution,
        "distance_distribution": distance_distribution,
        "failed_attempts_distribution": failed_distribution
    }

    # 2. HALLAZGOS ESTADÍSTICOS AUTOMÁTICOS (MÍNIMO 5)
    findings = []

    # Hallazgo 1: Horario nocturno / inusual
    night_mask = df["hour"].isin([0, 1, 2, 3, 4, 5])
    night_cnt = int(night_mask.sum())
    night_fraud = int(df.loc[night_mask, "is_fraud"].sum())
    night_rate = round((night_fraud / night_cnt * 100), 2) if night_cnt > 0 else 0.0

    day_cnt = int((~night_mask).sum())
    day_fraud = int(df.loc[~night_mask, "is_fraud"].sum())
    day_rate = round((day_fraud / day_cnt * 100), 2) if day_cnt > 0 else 0.0

    diff_night = round(night_rate - day_rate, 2)
    ratio_night = round(night_rate / (day_rate + 1e-4), 2)

    findings.append({
        "id": 1,
        "title": "Vulnerabilidad Temporal: Disparo del Fraude en Madrugadas",
        "description": "Las transacciones ejecutadas en horario nocturno (00:00 a 05:59) experimentan un incremento drástico en la tasa de fraude en comparación con el horario diurno.",
        "evidence": {
            "fraud_rate_unusual_hour": night_rate,
            "fraud_rate_normal_hour": day_rate,
            "difference_points": diff_night,
            "risk_multiplier": f"{ratio_night}x",
            "sample_size_night": night_cnt,
            "sample_size_day": day_cnt
        },
        "interpretation": f"La tasa de fraude en la madrugada ({night_rate}%) es {ratio_night} veces superior a la diurna ({day_rate}%). Los actores maliciosos aprovechan las horas de menor supervisión del usuario y menor monitoreo personal para ejecutar cargos antes de que el titular despierte o note la alerta bancaria."
    })

    # Hallazgo 2: Disparidad de Monto vs Promedio Histórico
    avg_col = df["average_transaction_amount"]
    ratio_monto = df["amount"] / (avg_col + 1e-5)
    high_ratio_mask = ratio_monto > 3.0
    hr_cnt = int(high_ratio_mask.sum())
    hr_fraud = int(df.loc[high_ratio_mask, "is_fraud"].sum())
    hr_rate = round((hr_fraud / hr_cnt * 100), 2) if hr_cnt > 0 else 0.0

    norm_ratio_cnt = int((~high_ratio_mask).sum())
    norm_ratio_fraud = int(df.loc[~high_ratio_mask, "is_fraud"].sum())
    norm_ratio_rate = round((norm_ratio_fraud / norm_ratio_cnt * 100), 2) if norm_ratio_cnt > 0 else 0.0

    ratio_amt_mult = round(hr_rate / (norm_ratio_rate + 1e-4), 2)
    findings.append({
        "id": 2,
        "title": "Monto Anómalo: Multiplicador Crítico sobre el Gasto Histórico",
        "description": "Las operaciones cuyo importe supera 3 veces el promedio habitual del cliente presentan la mayor correlación con incidentes de fraude.",
        "evidence": {
            "fraud_rate_above_3x_avg": hr_rate,
            "fraud_rate_normal_avg": norm_ratio_rate,
            "difference_points": round(hr_rate - norm_ratio_rate, 2),
            "risk_multiplier": f"{ratio_amt_mult}x",
            "high_ratio_transactions": hr_cnt
        },
        "interpretation": f"Cuando el monto transado excede 3x el promedio histórico del cliente, la probabilidad de fraude salta al {hr_rate}%, frente a un mero {norm_ratio_rate}% en compras acordes a su perfil. Los defraudadores buscan monetizar o extraer el máximo saldo posible antes del bloqueo de la tarjeta."
    })

    # Hallazgo 3: Múltiples Intentos Rechazados Previos
    multi_fail_mask = df["failed_attempts"] >= 2
    mf_cnt = int(multi_fail_mask.sum())
    mf_fraud = int(df.loc[multi_fail_mask, "is_fraud"].sum())
    mf_rate = round((mf_fraud / mf_cnt * 100), 2) if mf_cnt > 0 else 0.0

    zero_fail_mask = df["failed_attempts"] == 0
    zf_cnt = int(zero_fail_mask.sum())
    zf_fraud = int(df.loc[zero_fail_mask, "is_fraud"].sum())
    zf_rate = round((zf_fraud / zf_cnt * 100), 2) if zf_cnt > 0 else 0.0

    fail_mult = round(mf_rate / (zf_rate + 1e-4), 2)
    findings.append({
        "id": 3,
        "title": "Ataques de Fuerza Bruta: Impacto de Intentos Fallidos Consecutivos",
        "description": "Dos o más intentos fallidos previos representan un indicador contundente de prueba de credenciales o ataque automatizado.",
        "evidence": {
            "fraud_rate_failed_attempts_gte_2": mf_rate,
            "fraud_rate_zero_failures": zf_rate,
            "difference_points": round(mf_rate - zf_rate, 2),
            "risk_multiplier": f"{fail_mult}x",
            "volume_reiterated_failures": mf_cnt
        },
        "interpretation": f"Las transacciones precedidas de 2 o más intentos fallidos registran una tasa de fraude del {mf_rate}%, en contraste con el {zf_rate}% en operaciones sin fallas previas. Esto evidencia ataques de credential stuffing, prueba de CVV o intentos iterativos de bypass de pasarelas."
    })

    # Hallazgo 4: Anomalía Geoespacial y Distancia de Ubicación
    dist_high_mask = df["distance_from_usual_location"] > 100.0
    dh_cnt = int(dist_high_mask.sum())
    dh_fraud = int(df.loc[dist_high_mask, "is_fraud"].sum())
    dh_rate = round((dh_fraud / dh_cnt * 100), 2) if dh_cnt > 0 else 0.0

    dist_low_mask = df["distance_from_usual_location"] <= 50.0
    dl_cnt = int(dist_low_mask.sum())
    dl_fraud = int(df.loc[dist_low_mask, "is_fraud"].sum())
    dl_rate = round((dl_fraud / dl_cnt * 100), 2) if dl_cnt > 0 else 0.0

    dist_mult = round(dh_rate / (dl_rate + 1e-4), 2)
    findings.append({
        "id": 4,
        "title": "Ruptura de Patrón Geográfico: Distancia Mayor a 100 km",
        "description": "Las transacciones ejecutadas a más de 100 km de la ubicación habitual del cliente presentan un riesgo significativamente mayor de fraude.",
        "evidence": {
            "fraud_rate_dist_gt_100km": dh_rate,
            "fraud_rate_dist_lte_50km": dl_rate,
            "difference_points": round(dh_rate - dl_rate, 2),
            "risk_multiplier": f"{dist_mult}x",
            "anomalous_distance_tx_count": dh_cnt
        },
        "interpretation": f"Las operaciones a más de 100 km registran una tasa de fraude de {dh_rate}%, frente al {dl_rate}% en radios locales. El fraude transfronterizo o el uso de credenciales robadas en otras regiones geográficas es un vector predominante de fraude digital."
    })

    # Hallazgo 5: Riesgo por Categorías de Alta Liquidez (Electrónica y Gambling)
    high_risk_cats = ["electronics", "gambling", "travel"]
    cat_mask = df["merchant_category"].isin(high_risk_cats)
    hrc_cnt = int(cat_mask.sum())
    hrc_fraud = int(df.loc[cat_mask, "is_fraud"].sum())
    hrc_rate = round((hrc_fraud / hrc_cnt * 100), 2) if hrc_cnt > 0 else 0.0

    low_risk_cats = ["supermarket", "restaurants", "retail"]
    lrc_mask = df["merchant_category"].isin(low_risk_cats)
    lrc_cnt = int(lrc_mask.sum())
    lrc_fraud = int(df.loc[lrc_mask, "is_fraud"].sum())
    lrc_rate = round((lrc_fraud / lrc_cnt * 100), 2) if lrc_cnt > 0 else 0.0

    cat_mult = round(hrc_rate / (lrc_rate + 1e-4), 2)
    findings.append({
        "id": 5,
        "title": "Segmentación Sectorial: Categorías de Comercio de Alta Reventa",
        "description": "Comercios de electrónica, viajes y apuestas concentran proporcionalmente más transacciones fraudulentas que bienes cotidianos.",
        "evidence": {
            "fraud_rate_high_risk_sectors": hrc_rate,
            "fraud_rate_everyday_sectors": lrc_rate,
            "difference_points": round(hrc_rate - lrc_rate, 2),
            "risk_multiplier": f"{cat_mult}x",
            "volume_high_risk_sectors": hrc_cnt
        },
        "interpretation": f"Las categorías de alta liquidez como Electrónica y Apuestas exhiben una tasa de fraude del {hrc_rate}%, comparado con el {lrc_rate}% en compras de supermercado y restaurantes. Los atacantes seleccionan bienes fácilmente convertibles en efectivo o reventa rápida en mercados secundarios."
    })

    # Guardar ambos archivos
    os.makedirs(os.path.dirname(output_distributions_path), exist_ok=True)
    with open(output_distributions_path, "w", encoding="utf-8") as f:
        json.dump(distributions_payload, f, indent=4, ensure_ascii=False)

    os.makedirs(os.path.dirname(output_findings_path), exist_ok=True)
    with open(output_findings_path, "w", encoding="utf-8") as f:
        json.dump({"findings": findings, "base_fraud_rate": base_fraud_rate}, f, indent=4, ensure_ascii=False)

    print(f"[OK] Distribuciones guardadas en {output_distributions_path}")
    print(f"[OK] {len(findings)} Hallazgos estadísticos guardados en {output_findings_path}")

    return distributions_payload

if __name__ == "__main__":
    compute_eda_and_findings()
