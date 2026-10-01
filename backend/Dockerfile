FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema si fueran necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Generar datos, limpiar, EDA y entrenar modelo al construir la imagen si no existen
RUN python -c "from ml.generate_data import generate_fraud_dataset; from ml.preprocessing import run_data_cleaning_pipeline; from ml.eda import compute_eda_and_findings; from ml.train import train_and_evaluate_models; generate_fraud_dataset(); run_data_cleaning_pipeline(); compute_eda_and_findings(); train_and_evaluate_models()"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
