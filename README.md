# FraudGuard — Sistema Web de Detección de Fraude en Transacciones Digitales

**FraudGuard** es un sistema web completo de Minería de Datos y Machine Learning en tiempo real diseñado para detectar, clasificar y explicar transacciones fraudulentas en pasarelas de pago digitales.

El proyecto es **REAL y FUNCIONAL**, sin resultados simulados ni datos hardcodeados. Todas las predicciones, gráficos, métricas, matrices de confusión e inferencias proceden del procesamiento empírico de un dataset de más de 16,000 transacciones y la ejecución de modelos serializados con `scikit-learn`.

---

## 🛠️ Stack Tecnológico

### Backend
- **Lenguaje:** Python 3.11+ (Compatible con 3.13)
- **Framework REST:** FastAPI & Uvicorn
- **Machine Learning & Datos:** pandas, numpy, scikit-learn, joblib
- **Análisis & Visualización:** matplotlib, seaborn, plotly, nbformat
- **Explicabilidad:** SHAP (TreeExplainer) + Motor de Desviación del Perfil Histórico
- **Persistencia:** SQLite (`fraud_guard.db`) vía SQLAlchemy ORM (preparado para migración a PostgreSQL)

### Frontend
- **Framework:** React 19 + TypeScript
- **Tooling:** Vite
- **Estilos:** Tailwind CSS v4
- **Gráficos:** Recharts
- **Íconos:** Lucide Icons
- **Cliente HTTP:** Axios

---

## 📁 Estructura del Proyecto

```
c:\Users\perez\OneDrive\Documents\ProyectoMineria/
├── backend/
│   ├── app/
│   │   ├── api/          # Enrutador REST FastAPI (/api/health, /api/predict, etc.)
│   │   ├── models/       # Modelo ORM PredictionRecord para SQLite
│   │   ├── schemas/      # Esquemas Pydantic v2 para validación estricta
│   │   ├── services/     # Servicio de riesgo (risk_service) e inferencia (prediction_service)
│   │   ├── config.py     # Umbrales de riesgo y configuración centralizada
│   │   ├── database.py   # Conexión SQLAlchemy y motor SQLite
│   │   └── main.py       # Punto de entrada principal FastAPI
│   ├── data/
│   │   ├── raw/          # transactions_raw.csv (16,030 registros brutos)
│   │   └── processed/    # transactions_processed.csv (15,995 depurados)
│   ├── ml/
│   │   ├── generar_datos.py        # Generador estocástico con patrones estadísticos (Semilla 42)
│   │   ├── preprocesamiento.py     # Pipeline de limpieza y calidad (Antes vs Después)
│   │   ├── ingenieria_caracteristicas.py # Transformaciones y variables derivadas
│   │   ├── entrenar.py             # Entrenamiento y evaluación 70/30 estratificados
│   │   ├── predecir.py             # Inferencia viva utilizando pipeline serializado
│   │   ├── analisis_exploratorio.py # Extracción automática de 5 hallazgos demostrados
│   │   └── explicacion.py          # Explicabilidad dinámica en tiempo real
│   ├── artifacts/                 # Modelos serializados (.joblib) y JSONs de métricas
│   ├── notebooks/
│   │   ├── analisis_fraude.ipynb   # Notebook académico completo (16 secciones)
│   │   └── generar_notebook.py
│   ├── test_api.py       # Suite de pruebas de integración de endpoints
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Sidebar, Header, RiskBadge
│   │   ├── pages/        # Dashboard, Analyze, History, Models, DataQuality, Exploration, Features
│   │   ├── services/     # Cliente Axios (api.ts)
│   │   ├── types/        # Definiciones TypeScript de entidades y respuestas
│   │   ├── App.tsx       # Enrutamiento SPA
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docs/
│   ├── metodologia.md     # Marco metodológico CRISP-DM
│   ├── hallazgos.md       # 5 Hallazgos estadísticos con evidencia cuantitativa
│   └── informe_tecnico.md # Informe técnico académico de 16 secciones
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## ⚡ Guía de Inicio Rápido (Ejecución Local)

### Opción 1: Ejecución Manual con Terminales (Recomendada)

#### Terminal 1: Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt

# Generar datos, limpiar, ejecutar EDA y entrenar los modelos (se ejecuta en ~5 seg)
python -c "from ml.generate_data import generate_fraud_dataset; from ml.preprocessing import run_data_cleaning_pipeline; from ml.eda import compute_eda_and_findings; from ml.train import train_and_evaluate_models; generate_fraud_dataset(); run_data_cleaning_pipeline(); compute_eda_and_findings(); train_and_evaluate_models()"

# Iniciar el servidor API
python -m app.main
```
> El servidor quedará escuchando en `http://localhost:8000`  
> Documentación interactiva Swagger disponible en `http://localhost:8000/docs`

#### Terminal 2: Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
> La aplicación web abrirá en `http://localhost:5173`

---

### Opción 2: Ejecución con Docker Compose

```bash
docker-compose up --build
```
> Frontend disponible en `http://localhost:3000`  
> Backend API disponible en `http://localhost:8000`

---

## 📊 Resumen del Pipeline de Machine Learning

1. **Dataset Sintético Realista:** Generado con 16,030 registros bajo la semilla `42`. Representa patrones estadísticos de fraude (~8.2% tasa base) con ruido estocástico real e inyección de anomalías de calidad para ser depuradas.
2. **Calidad de Datos:** Eliminación de duplicados (30 filas), filtrado de montos imposibles ($\le 0$), imputación semántica de ciudades nulas y tipos de dispositivo, y capping superior en percentil 99.9. Salud final del dataset: **99.78%**.
3. **Ingeniería de Características:** Creación de 6 variables derivadas (`monto_vs_promedio`, `hora_inusual`, `distancia_anomala`, `ciudad_diferente`, `intentos_fallidos_elevados`, `dispositivo_nuevo`).
4. **División 70/30 Estratificada:** Entrenamiento con 11,196 muestras y prueba con 4,799 muestras no vistas. `ColumnTransformer` ajustado **únicamente** sobre el train set (protección contra data leakage).
5. **Evaluación Comparativa de Modelos:**
   - **Logistic Regression:** Accuracy 74.54% | Precision 19.74% | Recall 68.53% | F1-Score 30.65%
   - **Random Forest (Seleccionado):** Accuracy **87.23%** | Precision **29.38%** | Recall **39.59%** | F1-Score **33.73%**
6. **Sistema de Riesgo:**
   - **0% - 39.9% $\to$ BAJO:** Operación normal.
   - **40.0% - 69.9% $\to$ MEDIO:** Solicitar validación adicional.
   - **70.0% - 100% $\to$ ALTO:** Bloquear temporalmente y solicitar validación de identidad.
7. **Explicabilidad:** Motor dinámico en tiempo real que desglosa los factores causantes de la alerta indicando variable, valor transado, nivel de impacto y explicación contextualizada.

---

## 🔍 Demostración para Sustentación Académica

Para realizar una prueba en vivo durante la sustentación:
1. Navegue a la pestaña **"Analizar Transacción"**.
2. Haga clic en **"Preset Alto Riesgo"** (Carga un caso con horario de madrugada a las 03:42:00, monto 26.6x superior al promedio, 4 intentos fallidos previos y distancia de 820 km).
3. Presione **"ANALIZAR TRANSACCIÓN EN TIEMPO REAL"**.
4. Observe la probabilidad (~81.8%), la insignia de **RIESGO ALTO**, la recomendación de bloqueo y el desglose pericial de los 5 factores de riesgo explicados.
5. Ingrese una transacción nueva con cualquier combinación arbitraria de datos. El sistema validará los campos con Pydantic, construirá las variables derivadas y retornará la respuesta inmediata.

---

## 📄 Documentos Académicos Incluidos

- `docs/metodologia.md`: Marco metodológico completo bajo el estándar CRISP-DM.
- `docs/hallazgos.md`: Descripción detallada de los 5 hallazgos estadísticos demostrados con evidencia numérica real.
- `docs/informe_tecnico.md`: Informe técnico definitivo de 16 secciones listo para la entrega académica.
- `backend/notebooks/analisis_fraude.ipynb`: Notebook Jupyter completamente ejecutable de principio a fin.
