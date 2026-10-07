"""
Generador de Dataset Sintético Realista para Detección de Fraude en Transacciones.
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_fraud_dataset(
    n_samples: int = 16000,
    random_seed: int = 42,
    output_raw_path: str = "backend/data/raw/transacciones_crudas.csv"
) -> pd.DataFrame:
    np.random.seed(random_seed)
    random.seed(random_seed)

    cities = ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta"]
    categories = [
        "retail", "electronics", "travel", "supermarket",
        "entertainment", "restaurants", "financial_services", "gambling"
    ]
    payment_methods = ["credit_card", "debit_card", "bank_transfer", "virtual_wallet", "crypto"]
    device_types = ["mobile_android", "mobile_ios", "web_chrome", "web_safari", "unknown"]

    n_customers = 2500
    customer_ids = [f"CUST_{i:05d}" for i in range(1, n_customers + 1)]
    customer_profiles = {}
    for cid in customer_ids:
        age = int(np.clip(np.random.normal(38, 12), 18, 75))
        usual_city = np.random.choice(cities, p=[0.35, 0.20, 0.12, 0.10, 0.08, 0.06, 0.05, 0.04])
        avg_amount = float(np.round(np.random.exponential(120) + 30, 2))
        pref_device = np.random.choice(device_types[:4], p=[0.45, 0.35, 0.12, 0.08])
        pref_payment = np.random.choice(payment_methods[:4], p=[0.40, 0.35, 0.15, 0.10])
        account_age = int(np.clip(np.random.exponential(450) + 30, 5, 2500))
        customer_profiles[cid] = {
            "age": age,
            "usual_city": usual_city,
            "avg_amount": avg_amount,
            "pref_device": pref_device,
            "pref_payment": pref_payment,
            "account_age": account_age
        }

    records = []
    base_date = datetime(2026, 1, 1)

    for i in range(n_samples):
        tx_id = f"TX_{i+1:07d}"
        cid = np.random.choice(customer_ids)
        profile = customer_profiles[cid]

        days_offset = random.randint(0, 60)
        hour_sample = int(np.clip(np.random.normal(14, 5), 0, 23))
        minute_sample = random.randint(0, 59)
        second_sample = random.randint(0, 59)
        tx_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
        tx_time = f"{hour_sample:02d}:{minute_sample:02d}:{second_sample:02d}"

        is_diff_city = np.random.rand() < 0.12
        if is_diff_city:
            city = random.choice([c for c in cities if c != profile["usual_city"]])
            distance = float(np.round(np.random.gamma(shape=4.0, scale=120.0), 2))
        else:
            city = profile["usual_city"]
            distance = float(np.round(np.random.exponential(scale=8.0), 2))

        is_diff_device = np.random.rand() < 0.15
        if is_diff_device:
            device = random.choice(device_types)
        else:
            device = profile["pref_device"]

        category = np.random.choice(categories, p=[0.25, 0.15, 0.08, 0.22, 0.10, 0.12, 0.06, 0.02])
        payment_method = profile["pref_payment"] if np.random.rand() > 0.18 else random.choice(payment_methods)

        amount_multiplier = np.random.lognormal(mean=0.0, sigma=0.6)
        amount = float(np.round(profile["avg_amount"] * amount_multiplier, 2))
        amount = max(5.0, amount)

        recent_txs = int(np.random.poisson(lam=1.2))
        tx_frequency = float(np.round(np.clip(np.random.normal(2.5, 1.2), 0.5, 12.0), 2))
        failed_attempts = int(np.random.choice([0, 1, 2, 3, 4], p=[0.82, 0.11, 0.04, 0.02, 0.01]))

        risk_score = -4.5
        ratio_amount = amount / (profile["avg_amount"] + 1e-5)
        if ratio_amount > 4.0:
            risk_score += 2.2
        elif ratio_amount > 2.5:
            risk_score += 1.3
        elif ratio_amount > 1.8:
            risk_score += 0.6

        if hour_sample in [0, 1, 2, 3, 4, 5]:
            risk_score += 1.4

        if is_diff_city and distance > 250:
            risk_score += 1.8
        elif distance > 100:
            risk_score += 0.9

        if failed_attempts >= 3:
            risk_score += 2.5
        elif failed_attempts >= 1:
            risk_score += 1.0 * failed_attempts

        if recent_txs >= 4:
            risk_score += 1.7
        elif recent_txs >= 2:
            risk_score += 0.7

        if profile["account_age"] < 30:
            risk_score += 1.1

        if device == "unknown":
            risk_score += 1.2
        elif is_diff_device:
            risk_score += 0.8

        if category in ["electronics", "gambling", "travel"]:
            risk_score += 0.7
        if payment_method == "crypto":
            risk_score += 1.1

        noise = np.random.normal(0, 0.85)
        latent_prob = 1.0 / (1.0 + np.exp(-(risk_score + noise)))
        is_fraud = 1 if np.random.rand() < latent_prob else 0

        record = {
            "transaction_id": tx_id,
            "customer_id": cid,
            "amount": amount,
            "transaction_date": tx_date,
            "transaction_time": tx_time,
            "customer_age": profile["age"],
            "city": city,
            "merchant_category": category,
            "payment_method": payment_method,
            "recent_transactions": recent_txs,
            "device_type": device,
            "account_age_days": profile["account_age"],
            "failed_attempts": failed_attempts,
            "usual_city": profile["usual_city"],
            "distance_from_usual_location": distance,
            "average_transaction_amount": profile["avg_amount"],
            "transaction_frequency": tx_frequency,
            "is_fraud": is_fraud
        }
        records.append(record)

    df = pd.DataFrame(records)

    # Inyección de anomalías
    null_idx_device = np.random.choice(df.index, size=int(len(df) * 0.012), replace=False)
    df.loc[null_idx_device, "device_type"] = None
    null_idx_city = np.random.choice(df.index, size=int(len(df) * 0.008), replace=False)
    df.loc[null_idx_city, "city"] = None

    dup_rows = df.iloc[:30].copy()
    df = pd.concat([df, dup_rows], ignore_index=True)

    err_idx = np.random.choice(df.index, size=6, replace=False)
    df.loc[err_idx[:3], "amount"] = -50.0
    df.loc[err_idx[3:], "amount"] = 0.0

    text_idx = np.random.choice(df.index, size=20, replace=False)
    df.loc[text_idx, "merchant_category"] = df.loc[text_idx, "merchant_category"].str.upper()

    os.makedirs(os.path.dirname(output_raw_path), exist_ok=True)
    df.to_csv(output_raw_path, index=False)
    print(f"[OK] Dataset RAW generado exitosamente en {output_raw_path}")
    return df

if __name__ == "__main__":
    generate_fraud_dataset()
