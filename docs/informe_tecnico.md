# INFORME TÉCNICO DE MINERÍA DE DATOS
## Sistema Inteligente de Detección de Fraude en Transacciones Digitales — FraudGuard AI

---

### 1. Introducción
El auge vertiginoso del comercio electrónico y los ecosistemas de pago digital ha transformado radicalmente la economía mundial. No obstante, este crecimiento ha estado acompañado de un incremento alarmante en técnicas sofisticadas de fraude financiero, suplantación de identidad y ataques automatizados contra pasarelas de pago.

El presente informe documenta el desarrollo y despliegue del sistema **FraudGuard AI**, una plataforma integral de minería de datos y aprendizaje automático orientada a la interceptación en tiempo real de transacciones sospechosas, dotada de explicabilidad algorítmica y recomendaciones operativas transparentes.

---

### 2. Planteamiento del Problema
Una empresa procesadora de pagos digitales experimentó un incremento anómalo en reclamaciones por compras no reconocidas por parte de sus tarjetahabientes. El análisis preliminar identificó las siguientes problemáticas:
- **Pérdidas Financieras Directas:** Costos asociados a contracargos (*chargebacks*), tasas de penalización impuestas por franquicias bancarias y reembolsos forzados.
- **Fricción Operativa y Falsas Alarmas:** Reglas estáticas tradicionales basadas en umbrales fijos bloqueaban transacciones legítimas de usuarios de alto poder adquisitivo, causando frustración y deserción de clientes.
- **Falta de Explicabilidad:** Los operadores humanos carecían de visibilidad sobre los motivos que llevaban a marcar una transacción como riesgosa, entorpeciendo la auditoría y la atención al cliente.

---

### 3. Objetivos del Proyecto
#### Objetivo General
Construir un sistema web funcional de minería de datos capaz de procesar más de 10,000 transacciones, aplicar transformaciones reproducibles, entrenar y evaluar modelos competitivos de Machine Learning, clasificar el nivel de riesgo en tiempo real y justificar transparentemente las predicciones.

#### Objetivos Específicos
1. Consolidar un dataset sintético realista con más de 15,000 registros, 18 variables representativas y una tasa de fraude empírica controlada entre 3% y 10%.
2. Implementar un pipeline reproducible de limpieza y aseguramiento de calidad de datos, registrando métricas cuantitativas antes y después del procesamiento.
3. Derivar al menos 3 características de alto poder discriminante mediante ingeniería de atributos.
4. Entrenar y comparar dos modelos algorítmicos (**Regresión Logística** y **Random Forest**) bajo partición estratificada 70/30, priorizando Recall y F1-Score en la clase minoritaria.
5. Desarrollar una API REST en **FastAPI** y una interfaz moderna en **React + TypeScript + Vite + Tailwind CSS** conectadas de extremo a extremo sin datos simulados.
6. Incorporar un motor de explicabilidad dinámica que justifique cada predicción con base en las desviaciones del perfil histórico del usuario y los pesos del modelo.

---

### 4. Dataset Transaccional
Para salvaguardar la privacidad bancaria y garantizar reproducibilidad total, se generó un dataset de **16,030 registros brutos** bajo la semilla pseudoaleatoria `42`.

#### Atributos Incluidos
- **Identificadores:** `transaction_id`, `customer_id`.
- **Variables Monetarias:** `amount` (monto), `average_transaction_amount` (gasto promedio histórico).
- **Variables Temporales:** `transaction_date`, `transaction_time`, `account_age_days` (antigüedad de cuenta).
- **Variables Geoespaciales:** `city`, `usual_city`, `distance_from_usual_location` (distancia en km).
- **Variables Conductuales y de Seguridad:** `failed_attempts` (intentos fallidos), `recent_transactions` (operaciones última hora), `transaction_frequency`, `device_type`, `payment_method`, `merchant_category`.
- **Variable Objetivo:** `is_fraud` (0 = Legítima, 1 = Fraude). Tasa de fraude base: **8.20%**.

---

### 5. Metodología
Se implementó el marco metodológico estándar **CRISP-DM** (*Cross-Industry Standard Process for Data Mining*), cubriendo de manera estricta las fases de:
1. Comprensión del Negocio
2. Comprensión de los Datos
3. Preparación de los Datos
4. Modelado
5. Evaluación
6. Despliegue en Producción

---

### 6. Limpieza y Calidad de Datos
El pipeline ejecutado en `backend/ml/preprocessing.py` auditó y resolvió los defectos inyectados en la fase bruta:

| Dimensión de Calidad | Antes (RAW) | Después (PROCESSED) | Solución Implementada |
| :--- | :--- | :--- | :--- |
| **Total de Registros** | 16,030 | 15,995 | Deduplicación y filtrado de montos imposibles |
| **Filas Duplicadas** | 30 | 0 | Eliminación de registros idénticos por reintentos de red |
| **Montos Inválidos ($\le 0$)** | 5 | 0 | Filtrado estricto de transacciones vacías o erróneas |
| **Valores Nulos** | 321 | 0 | Imputación contextual (`city` $\to$ `usual_city`, `device_type` $\to$ `'unknown'`) |
| **Normalización Sintáctica**| Mayúsculas/Espacios | Minúsculas estándar | Formato uniforme en categorías y métodos de pago |
| **Outliers Extremos** | Sesgo severo | Percentil 99.9 capped | Winsorización superior en $2,450.00 para estabilidad |

**Índice de Salud de Datos Final:** **99.78%**.

---

### 7. Análisis Exploratorio (EDA) y Hallazgos
El análisis de distribuciones generó conclusiones cuantitativas sólidas:
1. **Madrugadas de Alto Riesgo:** Las transacciones entre las 00:00 y las 05:59 hrs registraron una tasa de fraude de **18.74%**, frente a un **6.22%** diurno (riesgo relativo 3.01x).
2. **Desviación de Gasto:** Transacciones con importe superior a 3 veces el promedio habitual alcanzaron un **24.81%** de fraude, frente al **5.14%** en gastos habituales (riesgo 4.83x).
3. **Intentos Fallidos:** Cuando hubo 2 o más intentos rechazados, la tasa saltó a **28.45%** (5.35x más que con 0 fallos).
4. **Anomalía Geográfica:** Distancias mayores a 100 km mostraron una tasa de fraude de **19.12%**, frente a **6.40%** en radios locales (2.99x).
5. **Comercios Líquidos:** Electrónica y Apuestas exhibieron tasas del **13.65%**, más del doble que supermercados (**5.80%**).

---

### 8. Ingeniería de Características (Feature Engineering)
Se formularon variables derivadas calculadas tanto en lotes como en inferencia viva:
- `monto_vs_promedio`: $\frac{\text{amount}}{\text{average\_transaction\_amount} + \epsilon}$
- `hora_inusual`: Indicador binario $\mathbb{I}(\text{hora} \in [0, 5])$
- `distancia_anomala`: Indicador binario $\mathbb{I}(\text{distancia} > 100 \text{ km})$
- `ciudad_diferente`: Indicador binario $\mathbb{I}(\text{ciudad} \neq \text{ciudad\_habitual})$
- `intentos_fallidos_elevados`: Indicador binario $\mathbb{I}(\text{failed\_attempts} \ge 2)$
- `dispositivo_nuevo`: Indicador binario de dispositivo desconocido o catalogado como nuevo.

---

### 9. Modelado y Prevención de Data Leakage
- **Estrategia de Partición:** 70% entrenamiento (11,196 muestras) y 30% prueba (4,799 muestras), estratificado por `is_fraud`.
- **ColumnTransformer Desacoplado:** El escalador `StandardScaler` y el codificador `OneHotEncoder(handle_unknown='ignore')` se ajustaron **exclusivamente con el conjunto de entrenamiento**, protegiendo la integridad del conjunto de prueba.
- **Modelos Evaluados:**
  1. *Logistic Regression:* Regularización L2, `class_weight='balanced'`.
  2. *Random Forest Classifier:* 120 estimadores, profundidad máxima 14, `class_weight='balanced'`.

---

### 10. Evaluación Comparativa de Modelos
Evaluación sobre las **4,799 muestras de prueba no vistas**:

| Modelo | Accuracy | Precision (Fraude) | Recall (Fraude) | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 74.54% | 19.74% | **68.53%** | 30.65% | **78.61%** |
| **Random Forest** | **87.23%** | **29.38%** | 39.59% | **33.73%** | 76.96% |

#### Matriz de Confusión — Random Forest (Modelo Seleccionado)
- **Verdaderos Negativos (TN):** 4,030
- **Falsos Positivos (FP):** 375
- **Falsos Negativos (FN):** 238
- **Verdaderos Positivos (TP):** 156

---

### 11. Justificación Técnica de Selección del Modelo
Se seleccionó técnicamente **Random Forest** como el modelo definitivo para producción por las siguientes razones:
1. **Balance de Desempeño (F1-Score):** Logra un F1-Score superior (**33.73%** frente a 30.65% de la Regresión Logística), manteniendo un Accuracy global sustancialmente más elevado (**87.23%** vs 74.54%).
2. **Control de Falsos Positivos:** En entornos financieros masivos, una precisión inferior al 20% (como la exhibida por la regresión lineal balanceada) genera una saturación insostenible de alertas falsas que bloquean clientes legítimos y colapsan los equipos de atención.
3. **Captura de Interacciones No Lineales:** Random Forest aísla eficientemente combinaciones multifactoriales (e.g. monto elevado + horario nocturno + intentos fallidos) sin requerir ingeniería polinomial manual.

---

### 12. Importancia de Variables
La reducción de impureza de Gini demostró que las variables derivadas lideran el poder explicativo:
1. `monto_vs_promedio` (**10.49%**) — Predictor #1 absoluto.
2. `distance_from_usual_location` (**9.29%**)
3. `failed_attempts` (**8.34%**)
4. `amount` (**7.15%**)
5. `average_transaction_amount` (**6.52%**)
6. `account_age_days` (**6.41%**)
7. `merchant_category` (**6.33%**)

---

### 13. Sistema de Riesgo y Recomendaciones Operativas
Se implementó el servicio centralizado `risk_service.py` con umbrales configurables:
- **0% - 39.9% $\to$ RIESGO BAJO:** *"Operación normal. No se requiere acción adicional."*
- **40.0% - 69.9% $\to$ RIESGO MEDIO:** *"Solicitar validación adicional antes de completar la operación."*
- **70.0% - 100.0% $\to$ RIESGO ALTO:** *"Bloquear temporalmente y solicitar validación de identidad"*

---

### 14. Explicabilidad Algorítmica Dinámica
Cada inferencia calcula dinámicamente factores de riesgo a partir de los datos concretos de la transacción y sus diferencias con el perfil histórico del usuario. Para cada factor se entrega:
- **Variable y Nombre Comercial**
- **Valor Concreto Transado**
- **Impacto Asignado:** ALTO, MEDIO o BAJO
- **Explicación Factual:** Frase clara sin textos estáticos simulados.

---

### 15. Arquitectura del Sistema
El sistema se organiza en una arquitectura modular de 3 capas:
1. **Capa de Presentación (Frontend):** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons y Recharts.
2. **Capa de Servicios y Modelos (Backend):** FastAPI (Python 3.13), scikit-learn, joblib, Pydantic v2.
3. **Capa de Persistencia:** SQLite (`fraud_guard.db`) mediante SQLAlchemy ORM para auditoría transaccional.

---

### 16. Conclusiones y Recomendaciones
1. **La ingeniería de variables supera a los datos en crudo:** La creación de ratios como `monto_vs_promedio` incrementó significativamente la separabilidad de clases en comparación con el uso aislado de importes brutos.
2. **La explicabilidad es un requisito ineludible:** En sistemas bancarios regulados, la confianza del operador y del usuario depende de conocer el porqué de cada bloqueo.
3. **Monitoreo Continuo:** Se recomienda programar re-entrenamientos periódicos conforme evolucione el comportamiento de gasto de los clientes y los patrones de ataque de los defraudadores.
