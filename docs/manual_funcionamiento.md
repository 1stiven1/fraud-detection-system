# MANUAL COMPLETO DE FUNCIONAMIENTO Y ARQUITECTURA
## Sistema de Detección de Fraude en Transacciones Digitales — FraudGuard

---

## 1. INTRODUCCIÓN Y PROPÓSITO DEL SISTEMA

**FraudGuard** es un sistema web académico y empresarial de Minería de Datos y Machine Learning desarrollado para la detección, clasificación y explicabilidad de transacciones electrónicas sospechosas en tiempo real.

### El Problema Financiero
En una pasarela de pagos digitales, las compras no autorizadas (fraudes) generan contracargos bancarios (*chargebacks*), pérdidas económicas directas y sanciones regulatorias. Sin embargo, utilizar reglas estáticas rígidas bloquea compras de clientes legítimos (falsos positivos). 

### La Solución de FraudGuard
FraudGuard reemplaza las reglas fijas con un **modelo de aprendizaje automático supervisado (Random Forest)** respaldado por un pipeline completo de minería de datos que:
1. Evalúa transacciones en **sub-segundos (< 10 ms)**.
2. Devuelve una **probabilidad continua de fraude (0% a 100%)**.
3. Clasifica la operación en niveles de riesgo **BAJO**, **MEDIO** o **ALTO**.
4. Entrega una **recomendación operativa inmediata** para la pasarela de pagos.
5. Genera una **explicación pericial dinámica** indicando los factores exactos del cliente que causaron la alerta.
6. Registra auditablemente la operación en una base de datos relacional **SQLite**.

---

## 2. ARQUITECTURA GENERAL DEL SISTEMA (END-TO-END)

El sistema utiliza una arquitectura desacoplada en tres capas principales:

```
[ FRONTEND (React 19 + Vite + Tailwind CSS + Recharts) ]
                         │
                         │ HTTP REST (JSON) / (Axios Client)
                         ▼
[ BACKEND API (FastAPI - Python 3.13) ]
     ├── 1. Validación Pydantic (TransactionInput)
     ├── 2. Feature Engineering (Cálculo de variables derivadas)
     ├── 3. Pipeline ML Scikit-Learn (ColumnTransformer + Random Forest)
     ├── 4. Servicio de Riesgo (risk_service.py - Asignación de nivel y recomendación)
     ├── 5. Motor de Explicabilidad (explicacion.py - Factores factuales)
     └── 6. Persistencia ORM (SQLAlchemy -> predictions)
                         │
                         ▼
             [ BASE DE DATOS (SQLite - fraud_guard.db) ]
```

---

## 3. CICLO DE VIDA Y FLUJO DE DATOS (DATA LIFECYCLE)

### 3.1 Generación del Dataset Sintético Realista (`backend/ml/generar_datos.py`)
- Se parten de **16,030 registros brutos** generados bajo la semilla pseudoaleatoria `42` para garantizar reproducibilidad.
- Incluye 18 atributos con patrones estadísticos reales de gasto, comportamiento temporal, geoespacial y anomalías de seguridad.
- Tasa empírica de fraude base: **8.20%**.
- Se inyectaron intencionalmente 30 filas duplicadas, 5 montos negativos/nulos y 321 valores faltantes para auditar la etapa de limpieza.

### 3.2 Limpieza y Calidad de Datos (`backend/ml/preprocesamiento.py`)
El pipeline procesa el dataset bruto generando métricas cuantitativas **ANTES vs DESPUÉS**:

| Métrica | Antes (RAW) | Después (PROCESSED) | Solución Técnica |
| :--- | :--- | :--- | :--- |
| **Registros Totales** | 16,030 | **15,995** | Deduplicación exacta y eliminación de montos $\le 0$ |
| **Duplicados** | 30 | **0** | Purgado de reintentos idénticos de red |
| **Valores Nulos** | 321 | **0** | Imputación (`city` $\to$ `usual_city`, `device_type` $\to$ `'unknown'`) |
| **Montos Inválidos** | 5 | **0** | Filtrado de datos corruptos |
| **Outliers Extremos** | Sesgo severo | **Percentil 99.9** | Winsorización/Capping superior en $2,450.00 |

**Salud del Dataset:** **99.78%**.

---

### 3.3 Ingeniería de Características (`backend/ml/ingenieria_caracteristicas.py`)
Para mejorar la separabilidad de las clases sin caer en overfitting, se construyen 6 variables derivadas clave:

1. `monto_vs_promedio`: Ratio matemático $\frac{\text{amount}}{\text{average\_transaction\_amount} + \epsilon}$. (Predictor #1 en el ranking de importancia).
2. `hora_inusual`: Marca binaria que indica si la compra ocurrió en horario nocturno (00:00 a 05:59 hrs).
3. `distancia_anomala`: 1 si la distancia al domicilio habitual excede los 100 km.
4. `ciudad_diferente`: 1 si la ciudad de la compra difiere de la ciudad de residencia del cliente.
5. `intentos_fallidos_elevados`: 1 si existen 2 o más intentos de pago rechazados previamente.
6. `dispositivo_nuevo`: 1 si el dispositivo es desconocido o no registrado previamente.

---

### 3.4 Análisis Exploratorio (EDA) y Hallazgos Estadísticos (`backend/ml/analisis_exploratorio.py`)
El sistema extrae automáticamente 5 hallazgos estadísticos sustentados en los datos procesados:

1. **Horario de Madrugada:** Operaciones entre 00:00 y 05:59 hrs tienen una tasa de fraude de **18.74%**, frente al **6.22%** diurno (**3.01x** más riesgo).
2. **Disparidad de Monto:** Transacciones con `monto_vs_promedio > 3.0` registran **24.81%** de fraude, frente al **5.14%** en montos normales (**4.83x** más riesgo).
3. **Intentos Rechazados:** Transacciones con $\ge 2$ fallos previos registran **28.45%** de fraude (**5.35x** más riesgo).
4. **Desplazamiento Geográfico:** Operaciones a más de 100 km exhiben una tasa del **19.12%** (**2.99x** más riesgo).
5. **Comercios Líquidos:** Electrónica, Apuestas y Viajes concentran **13.65%** de fraude, más del doble que supermercados (**5.80%**).

---

## 4. MODELADO DE MACHINE LEARNING Y EVALUACIÓN

### 4.1 Partición Estratificada y Prevención de Data Leakage (`backend/ml/entrenar.py`)
- **División:** 70% entrenamiento (11,196 muestras) y 30% prueba (4,799 muestras), preservando la proporción de fraude mediante `stratify=y`.
- **ColumnTransformer:** El escalador de variables numéricas (`StandardScaler`) y la codificación categórica (`OneHotEncoder`) se ajustan **únicamente sobre el conjunto de entrenamiento**, evitando que información del test set contamine el estimador.

### 4.2 Comparación Cuantitativa de Modelos

| Modelo | Accuracy | Precision (Fraude) | Recall (Fraude)* | F1-Score* | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 74.54% | 19.74% | **68.53%** | 30.65% | **78.61%** |
| **Random Forest** | **87.23%** | **29.38%** | 39.59% | **33.73%** | 76.96% |

### 4.3 Justificación Técnica de Selección
Se selecciona **Random Forest** como el modelo definitivo de producción debido a que:
1. Alcanza la mayor media armónica (**F1-Score de 33.73%**).
2. Mantiene una tasa controlada de falsos positivos en comparación con la regresión lineal balanceada, impidiendo la saturación operativa de alertas falsas en el banco.
3. Modela automáticamente interacciones complejas no lineales entre las variables derivadas.

---

## 5. SISTEMA DE EVALUACIÓN DE RIESGO Y RECOMENDACIONES

El servicio `backend/app/services/risk_service.py` aplica umbrales centralizados para transformar la probabilidad matemática en una acción operativa:

```
[ Probabilidad de Fraude (predict_proba) ]
                 │
                 ├── 0.0%  a 39.9%  ──>  BAJO   ──>  "Operación normal. No se requiere acción adicional."
                 ├── 40.0% a 69.9%  ──>  MEDIO  ──>  "Solicitar validación adicional antes de completar la operación."
                 └── 70.0% a 100.0% ──>  ALTO   ──>  "Bloquear temporalmente y solicitar validación de identidad"
```

---

## 6. MOTOR DE EXPLICABILIDAD DINÁMICA EN TIEMPO REAL

Cuando una transacción es analizada, el módulo `backend/ml/explicacion.py` contrasta los atributos ingresados contra la línea base del cliente y los pesos del ensamble.

Para cada factor clave se genera un objeto explicativo real con:
- **Variable y Etiqueta Comercial** (ej. *"Monto Crítico vs Promedio"*).
- **Valor Transado Real** (ej. *"$3,200.00 (26.67x promedio)"*).
- **Impacto Asignado:** `ALTO`, `MEDIO` o `BAJO`.
- **Explicación Factual Fuerte:** Ej. *"La operación se ejecutó en la madrugada (03:45 hrs), franja horaria donde se concentra la mayor tasa de fraude sin supervisión del usuario."*

---

## 7. MÓDULOS DE LA INTERFAZ WEB (FRONTEND REACT)

La interfaz se divide en 7 páginas navegables mediante la barra lateral:

### 1. `/dashboard` (Dashboard Principal)
- **Cards Superiores:** Muestran el total de transacciones analizadas, transacciones sospechosas, operaciones de alto riesgo y monto monetario en riesgo.
- **Gráficos Interactivos:** Fraude por hora, fraude por ciudad, fraude por categoría, distribución de montos y dona de niveles de riesgo.
- **Sección de Modelo Activo:** Resumen con métricas reales (Accuracy, Precision, Recall, F1, ROC-AUC) y la matriz de confusión visual.

### 2. `/analyze` (Analizar Transacción en Tiempo Real)
- Formulario completo con las 15 variables operativas.
- **Botones de Presets de Demostración:** Permite cargar con 1 clic un caso de **"Alto Riesgo"** (Madrugada, $3,450, 4 reintentos, 820 km) o **"Bajo Riesgo"** (Supermercado, $42.50, 0 reintentos, ciudad habitual).
- **Resultado Inmediato:** Medidor de probabilidad, badge de riesgo, recomendación operativa y lista detallada de los 5 factores explicativos.

### 3. `/history` (Historial de Auditoría)
- Consulta la tabla de predicciones guardadas en **SQLite**.
- Permite **Búsqueda por ID o Ciudad**, **Filtrado por Nivel de Riesgo** (BAJO, MEDIO, ALTO) y **Ordenamiento**.
- Botón **"Ver Detalle"** que abre un modal con el desglose pericial completo de la transacción y sus factores.

### 4. `/models` (Modelos y Evaluación)
- Tabla comparativa de métricas entre Logistic Regression y Random Forest.
- Gráfico de barras comparativo.
- Justificación técnica redactada a partir de los datos reales.
- Matrices de confusión duales.

### 5. `/data-quality` (Calidad de Datos)
- Tarjetas de comparación **ANTES vs DESPUÉS**.
- Índice de Salud del Dataset (99.78%).
- Lista de las transformaciones aplicadas en el pipeline.

### 6. `/exploration` (Exploración EDA y Hallazgos)
- Presentación de los **5 Hallazgos Estadísticos Demostrados** con evidencia cuantitativa e interpretación de negocio.
- Gráficos exploratorios de distribución multivariable.

### 7. `/features` (Importancia de Variables)
- Ranking gráfico horizontal de la contribución de los atributos (Gini Impurity).
- Tabla conceptual explicando el impacto de cada variable en el negocio.

---

## 8. GUÍA DE DEMOSTRACIÓN RÁPIDA (PASO A PASO)

Para realizar una demostración académica impecable durante la sustentación:

1. **Iniciar el Backend:**
   ```powershell
   cd backend
   python -m app.main
   ```
2. **Iniciar el Frontend:**
   ```powershell
   cd frontend
   npm.cmd run dev
   ```
3. **Abrir el navegador en `http://localhost:5173`**.
4. Ir a la pestaña **"Analizar Transacción"**.
5. Hacer clic en **"Preset Alto Riesgo"** y presionar **"ANALIZAR TRANSACCIÓN EN TIEMPO REAL"**.
6. Mostrar a los evaluadores la probabilidad (~81.8%), el badge **RIESGO ALTO**, la recomendación de bloqueo y los 5 factores explicativos generados dinámicamente.
7. Modificar manualmente cualquier valor del formulario (ejemplo: cambiar el monto o la hora) para demostrar que el sistema procesa datos totalmente nuevos en tiempo real.
8. Ir a la pestaña **"Historial de Auditoría"** para evidenciar que la transacción fue almacenada automáticamente en la base de datos **SQLite**.
