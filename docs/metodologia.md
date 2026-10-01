# Metodología de Minería de Datos — FraudGuard AI

## 1. Marco Metodológico: CRISP-DM Adaptado
El proyecto **FraudGuard AI** implementa el estándar metodológico internacional **CRISP-DM** (*Cross-Industry Standard Process for Data Mining*), estructurado en seis fases iterativas diseñadas específicamente para problemas de detección de anomalías y prevención de fraude financiero.

```
       ┌────────────────────────┐
       │ Comprensión del Negocio│
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │ Comprensión de Datos   │
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │ Preparación de Datos   │
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │      Modelado ML       │
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │       Evaluación       │
       └───────────┬────────────┘
                   │
       ┌───────────▼────────────┐
       │ Despliegue en Vivo     │
       └────────────────────────┘
```

---

## 2. Fase 1: Comprensión del Negocio
### 2.1 Contexto
Una pasarela de pagos digitales procesa decenas de miles de transacciones al día. Un incremento no detectado en operaciones fraudulentas produce contracargos (*chargebacks*), sanciones regulatorias de las franquicias financieras (Visa/Mastercard) y pérdida de confianza de los tarjetahabientes.

### 2.2 Objetivos de Minería de Datos
1. Reducir la tasa de falsos negativos (fraudes omitidos) priorizando la métrica de **Recall** y **F1-Score**.
2. Proveer una evaluación de riesgo categorizada en **BAJO**, **MEDIO** y **ALTO** con recomendaciones operativas automatizadas.
3. Brindar **explicabilidad algorítmica** transparente que indique los factores concretos causantes de la alerta.

---

## 3. Fase 2: Comprensión de los Datos
Se parte de un registro de **16,030 transacciones crudas** con 18 variables representativas de la interacción transaccional, geográfica, temporal y de comportamiento del usuario.

### Atributos Principales
- **Identificadores:** `transaction_id`, `customer_id`.
- **Comportamiento Monetario:** `amount`, `average_transaction_amount`.
- **Dimensión Temporal:** `transaction_date`, `transaction_time`, `account_age_days`.
- **Dimensión Geográfica:** `city`, `usual_city`, `distance_from_usual_location`.
- **Contexto de Seguridad:** `failed_attempts`, `recent_transactions`, `device_type`, `payment_method`, `merchant_category`.
- **Variable Objetivo:** `is_fraud` (0 = Legítima, 1 = Fraude).

---

## 4. Fase 3: Preparación de Datos (Limpieza e Ingeniería)
El pipeline de limpieza y calidad aplica transformaciones reproducibles para solventar defectos comunes en flujos transaccionales reales:
- **Deduplicación:** Eliminación de 30 transacciones idénticas provocadas por reintentos de red.
- **Valores Inválidos:** Filtrado de registros con montos menores o iguales a cero.
- **Imputación Semántica:** 
  - Las ciudades nulas se imputan con la ciudad de residencia habitual del cliente (`usual_city`).
  - Dispositivos nulos se catalogan bajo la categoría `'unknown'`.
- **Winsorización / Capping:** Tratamiento de montos desproporcionados en el percentil 99.9 para salvaguardar la estabilidad numérica de los estimadores lineales.
- **Ingeniería de Características:**
  - `hora_inusual`: Marca binaria para transacciones entre 00:00 y 05:59.
  - `monto_vs_promedio`: Ratio normalizado del monto transado respecto al gasto habitual del cliente.
  - `distancia_anomala`: Indicador binario cuando la distancia supera 100 km.
  - `ciudad_diferente`: Discrepancia entre ciudad de compra y residencia habitual.
  - `intentos_fallidos_elevados`: Indicador de ataques de fuerza bruta o suplantación ($\ge 2$ fallos previos).

---

## 5. Fase 4: Modelado
Se implementó una arquitectura basada en `scikit-learn` con preprocesamiento desacoplado mediante `ColumnTransformer`:
- **Variables numéricas:** Escalado con `StandardScaler`.
- **Variables categóricas:** Codificación `OneHotEncoder(handle_unknown='ignore')`.
- **División:** 70% entrenamiento (11,196 muestras) y 30% prueba (4,799 muestras), estratificando por `is_fraud` para preservar la proporción de clase minoritaria (~8.2%).
- **Modelos Evaluados:**
  1. *Logistic Regression:* Modelo paramétrico lineal con ponderación de clases balanceada (`class_weight='balanced'`).
  2. *Random Forest Classifier:* Ensamble no lineal de 120 árboles de decisión con profundidad controlada (`max_depth=14`) para capturar sinergias complejas entre atributos.

---

## 6. Fase 5: Evaluación
Los modelos se sometieron a una batería de métricas exhaustivas orientadas a desbalance de clases:
- **Accuracy:** Proporción global de predicciones correctas.
- **Precision:** Pureza de las alarmas de fraude generadas (minimización de falsos positivos).
- **Recall (Sensibilidad):** Capacidad del modelo para interceptar fraudes reales (minimización de falsos negativos).
- **F1-Score:** Media armónica entre Precision y Recall.
- **Matriz de Confusión:** Cuantificación empírica de Verdaderos Positivos (TP), Falsos Positivos (FP), Verdaderos Negativos (TN) y Falsos Negativos (FN).

---

## 7. Fase 6: Despliegue y Operación
- **Backend API:** Microservicio FastAPI con arquitectura desacoplada en controladores, servicios y repositorios.
- **Inferencia en Memoria:** Serialización del pipeline entrenado en formato `joblib`, evitando reentrenamientos en tiempo de petición.
- **Motor de Explicabilidad:** Módulo dinámico que evalúa la contribución relativa de cada atributo frente al perfil de comportamiento histórico del cliente.
- **Persistencia Transaccional:** Registro en base de datos relacional SQLite de cada predicción para auditoría forense y monitoreo.
- **Frontend Interactivo:** SPA en React + Vite + Tailwind CSS para análisis en tiempo real y exploración analítica.
