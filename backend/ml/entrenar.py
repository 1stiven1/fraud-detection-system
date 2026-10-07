"""
Módulo de Entrenamiento y Evaluación Comparativa (entrenar.py).
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score
)

from ml.ingenieria_caracteristicas import apply_feature_engineering

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

def build_preprocessor() -> ColumnTransformer:
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, NUMERIC_FEATURES),
            ("cat", categorical_transformer, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

def train_and_evaluate_models(
    data_path: str = "backend/data/processed/transacciones_procesadas.csv",
    artifacts_dir: str = "backend/artifacts"
) -> Dict[str, Any]:
    print(f"[*] Cargando dataset procesado para entrenamiento desde {data_path}...")
    df = pd.read_csv(data_path)

    df_feat = apply_feature_engineering(df)

    feature_cols = NUMERIC_FEATURES + CATEGORICAL_FEATURES
    X = df_feat[feature_cols]
    y = df_feat["is_fraud"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42, stratify=y
    )

    print(f"[*] Muestras de entrenamiento: {len(X_train):,} (Fraudes: {y_train.sum():,})")
    print(f"[*] Muestras de prueba:        {len(X_test):,} (Fraudes: {y_test.sum():,})")

    preprocessor = build_preprocessor()
    preprocessor.fit(X_train)

    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    cat_feature_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    all_feature_names = NUMERIC_FEATURES + cat_feature_names

    models_to_train = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=120,
            max_depth=14,
            min_samples_split=4,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )
    }

    results = []
    confusion_matrices = {}
    trained_pipelines = {}

    for model_name, clf in models_to_train.items():
        print(f"[*] Entrenando {model_name}...")
        pipe = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        pipe.fit(X_train, y_train)

        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc_auc = float(roc_auc_score(y_test, y_prob))

        cm = confusion_matrix(y_test, y_pred).tolist()
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        confusion_matrices[model_name] = {
            "matrix": cm,
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        }

        metric_row = {
            "model_name": model_name,
            "accuracy": round(acc * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "f1_score": round(f1 * 100, 2),
            "roc_auc": round(roc_auc * 100, 2),
            "raw_metrics": {
                "accuracy": acc,
                "precision": prec,
                "recall": rec,
                "f1_score": f1,
                "roc_auc": roc_auc
            }
        }
        results.append(metric_row)
        trained_pipelines[model_name] = pipe

    results_sorted = sorted(results, key=lambda x: (x["raw_metrics"]["f1_score"], x["raw_metrics"]["recall"]), reverse=True)
    best_result = results_sorted[0]
    best_model_name = best_result["model_name"]
    best_pipeline = trained_pipelines[best_model_name]

    other_model = results_sorted[1]
    selection_reason = (
        f"Se seleccionó técnicamente '{best_model_name}' como el modelo definitivo para producción. "
        f"En entornos transaccionales de detección de fraude, la prioridad estratégica es maximizar el Recall y F1-score "
        f"para interceptar la mayor cantidad de transacciones fraudulentas y minimizar el costo financiero de los falsos negativos. "
        f"{best_model_name} alcanzó un Recall del {best_result['recall']}% y F1-Score del {best_result['f1_score']}%, "
        f"superando a {other_model['model_name']} (Recall: {other_model['recall']}%, F1-Score: {other_model['f1_score']}%)."
    )

    rf_pipe = trained_pipelines["Random Forest"]
    rf_clf = rf_pipe.named_steps["classifier"]
    raw_importances = rf_clf.feature_importances_

    importance_list = []
    cat_prefix_sums = {cat: 0.0 for cat in CATEGORICAL_FEATURES}

    for fname, imp in zip(all_feature_names, raw_importances):
        is_cat = False
        for cat in CATEGORICAL_FEATURES:
            if fname.startswith(f"cat__{cat}_") or fname.startswith(f"{cat}_"):
                cat_prefix_sums[cat] += imp
                is_cat = True
                break
        if not is_cat and fname in NUMERIC_FEATURES:
            importance_list.append({"feature": fname, "importance": float(imp)})

    for cat, val in cat_prefix_sums.items():
        importance_list.append({"feature": cat, "importance": float(val)})

    total_imp = sum(x["importance"] for x in importance_list)
    for x in importance_list:
        x["percentage"] = round((x["importance"] / total_imp) * 100, 2)
        x["importance"] = round(x["importance"], 4)

    importance_list = sorted(importance_list, key=lambda x: x["percentage"], reverse=True)

    os.makedirs(f"{artifacts_dir}/models", exist_ok=True)
    os.makedirs(f"{artifacts_dir}/encoders", exist_ok=True)
    os.makedirs(f"{artifacts_dir}/metrics", exist_ok=True)

    joblib.dump(best_pipeline, f"{artifacts_dir}/models/modelo_fraude.joblib")
    joblib.dump(trained_pipelines["Logistic Regression"], f"{artifacts_dir}/models/modelo_logistico.joblib")
    joblib.dump(trained_pipelines["Random Forest"], f"{artifacts_dir}/models/modelo_random_forest.joblib")
    joblib.dump(preprocessor, f"{artifacts_dir}/encoders/preprocesador.joblib")

    comparison_payload = {
        "timestamp": datetime.utcnow().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "train_fraud_rate": round(float(y_train.mean()) * 100, 2),
        "test_fraud_rate": round(float(y_test.mean()) * 100, 2),
        "features_used": feature_cols,
        "selected_model": best_model_name,
        "selection_reason": selection_reason,
        "models": results
    }

    with open(f"{artifacts_dir}/metrics/comparacion_modelos.json", "w", encoding="utf-8") as f:
        json.dump(comparison_payload, f, indent=4, ensure_ascii=False)

    with open(f"{artifacts_dir}/metrics/importancia_variables.json", "w", encoding="utf-8") as f:
        json.dump({
            "model": "Random Forest",
            "features": importance_list,
            "raw_features": [{"name": fn, "importance": round(float(imp), 5)} for fn, imp in zip(all_feature_names, raw_importances)]
        }, f, indent=4, ensure_ascii=False)

    with open(f"{artifacts_dir}/metrics/matriz_confusion.json", "w", encoding="utf-8") as f:
        json.dump(confusion_matrices, f, indent=4, ensure_ascii=False)

    print(f"\n[OK] ENTRENAMIENTO COMPLETADO EXITOSAMENTE!")
    return comparison_payload

if __name__ == "__main__":
    train_and_evaluate_models()
