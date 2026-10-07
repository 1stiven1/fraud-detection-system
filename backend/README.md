# FraudGuard — Backend (FastAPI & Machine Learning)

Microservicio backend desarrollado en Python 3.11+ para la detección de fraude en transacciones digitales.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Ejecutar pipeline de generación de datos, limpieza, EDA y entrenamiento
python -c "from ml.generate_data import generate_fraud_dataset; from ml.preprocessing import run_data_cleaning_pipeline; from ml.eda import compute_eda_and_findings; from ml.train import train_and_evaluate_models; generate_fraud_dataset(); run_data_cleaning_pipeline(); compute_eda_and_findings(); train_and_evaluate_models()"

# 3. Iniciar API REST
python -m app.main
```

## 📡 Endpoints REST Principales

- `GET /api/health` — Verificación de salud y estado del modelo cargado.
- `GET /api/dashboard` — Resumen de métricas y distribuciones para el dashboard.
- `POST /api/predict` — Inferencia en tiempo real, clasificación de riesgo y explicabilidad.
- `GET /api/history` — Historial de predicciones almacenadas en SQLite con filtros y búsqueda.
- `GET /api/models` — Comparación de métricas de desempeño entre modelos.
- `GET /api/data-quality` — Reporte cuantitativo antes/después del preprocesamiento.
- `GET /api/eda` — Distribuciones y 5 hallazgos estadísticos demostrados.
- `GET /api/feature-importance` — Ranking de importancia de atributos.
- `POST /api/train` — Endpoint para re-entrenar y actualizar los modelos en caliente.
