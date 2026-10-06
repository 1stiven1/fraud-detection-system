"""
Generador de Documento PDF Explicativo del Código del Proyecto FraudGuard AI.
Utiliza ReportLab para compilar un documento PDF estructurado y elegante.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf():
    pdf_filename = os.path.join(os.path.dirname(__file__), "Manual_de_Codigo_FraudGuard_AI.pdf")
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=0.5 * inch,
        rightMargin=0.5 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e1b4b'),
        alignment=1, # Center
        spaceAfter=10
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=20
    )

    heading1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#4f46e5'),
        spaceBefore=14,
        spaceAfter=6
    )

    heading2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        spaceAfter=4
    )

    code_block_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0f172a'),
        backColor=colors.HexColor('#f8fafc'),
        borderColor=colors.HexColor('#e2e8f0'),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("FraudGuard AI — Manual Explicativo del Código", title_style))
    story.append(Paragraph("Documentación Técnica Exhaustiva y Función de Cada Archivo del Proyecto<br/><b>Conexión PostgreSQL Verificada | Inferencia ML | Explicabilidad | Frontend React</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4f46e5'), spaceAfter=15))

    # Section 1: Resumen General
    story.append(Paragraph("1. Introducción y Arquitectura del Sistema", heading1_style))
    story.append(Paragraph(
        "El proyecto <b>FraudGuard AI</b> es una solución web integral de Minería de Datos y Aprendizaje Automático diseñada para la detección, clasificación y explicabilidad de transacciones fraudulentas en tiempo real. La arquitectura está dividida en tres módulos principales:",
        body_style
    ))
    story.append(Paragraph("• <b>Backend API (Python 3.13 / FastAPI):</b> Procesa las solicitudes HTTP REST, valida entradas con Pydantic, ejecuta ingeniería de características, aplica el pipeline de Scikit-Learn (Random Forest) y persiste en PostgreSQL.", bullet_style))
    story.append(Paragraph("• <b>Machine Learning & Data Pipeline (scikit-learn / pandas):</b> Genera el dataset, ejecuta limpieza automatizada, extrae hallazgos exploratorios, entrena estimadores estratificados 70/30 y genera explicabilidad dinámica.", bullet_style))
    story.append(Paragraph("• <b>Frontend SPA (React 19 / TypeScript / Vite / Tailwind CSS):</b> Interfaz empresarial responsive con dashboard interactivo, formulario de prueba con presets, historial pericial, métricas y visualizaciones en Recharts.", bullet_style))

    story.append(Spacer(1, 10))

    # Section 2: Explicación Detallada del Backend
    story.append(Paragraph("2. Módulo Backend (`backend/app/`)", heading1_style))
    
    files_backend = [
        ("app/main.py", "Punto de entrada principal de la API FastAPI. Inicializa la conexión a la base de datos PostgreSQL/SQLite, registra los enrutadores REST bajo `/api`, habilita el middleware CORS para desarrollo web y gestiona el evento de precarga del modelo de Machine Learning en memoria al iniciar el servidor."),
        ("app/config.py", "Configuración global centralizada mediante Pydantic Settings. Almacena la cadena de conexión `DATABASE_URL` (configurada para PostgreSQL `postgresql://postgres:12345@localhost:5432/fraudguard_db`), umbrales de riesgo (Bajo <40%, Medio 40-70%, Alto >=70%), recomendaciones operativas y rutas absolutas de artefactos."),
        ("app/database.py", "Gestor de persistencia relacional con SQLAlchemy. Configura el motor `create_engine`, la fábrica de sesiones `SessionLocal` y el generador de dependencias `get_db()`. Detecta automáticamente el dialecto de base de datos (PostgreSQL o SQLite) para adaptar los parámetros de conexión."),
        ("app/models/db_models.py", "Definición del modelo ORM `PredictionRecord` mapeado a la tabla `predictions`. Registra cada evaluación en PostgreSQL incluyendo: `prediction_id`, `transaction_id`, `amount`, `city`, `merchant_category`, `fraud_probability`, `risk_level`, `recommendation`, `input_data` (JSON) y `risk_factors` (JSON)."),
        ("app/schemas/schemas.py", "Esquemas Pydantic v2 para validación rigurosa de datos. `TransactionInput` valida los tipos y rangos de las 15 variables operativas. `PredictionResponse` define la estructura del resultado con probabilidad, nivel de riesgo y explicabilidad. `HistoryItemResponse` formatea los registros históricos."),
        ("app/services/risk_service.py", "Servicio centralizado de clasificación de riesgo. Recibe la probabilidad continua [0.0 - 1.0], calcula el porcentaje y asigna el nivel (BAJO, MEDIO, ALTO) junto con la recomendación operativa correspondiente segun los umbrales configurados."),
        ("app/services/prediction_service.py", "Servicio de orquestación principal. Recibe la transacción validada, invoca el cálculo de variables derivadas, ejecuta `predict_proba()`, consulta el servicio de riesgo y explicabilidad, inserta el registro en PostgreSQL vía SQLAlchemy y retorna la respuesta JSON."),
        ("app/api/routes.py", "Enrutador con todos los endpoints REST expuestos: `/api/health`, `/api/dashboard`, `/api/predict`, `/api/history`, `/api/models`, `/api/data-quality`, `/api/eda`, `/api/feature-importance` y `/api/train`.")
    ]

    for filename, desc in files_backend:
        story.append(Paragraph(f"📄 <b>backend/{filename}</b>", heading2_style))
        story.append(Paragraph(desc, body_style))

    story.append(Spacer(1, 10))

    # Section 3: Módulo Machine Learning
    story.append(Paragraph("3. Módulo de Machine Learning y Pipeline (`backend/ml/`)", heading1_style))

    files_ml = [
        ("ml/generate_data.py", "Generador de dataset sintético realista con 16,030 registros bajo la semilla 42. Modela comportamientos de gasto, horarios, distancias y patrones de fraude con ruido estocástico. Inyecta deliberadamente duplicados, nulos y montos inválidos para evaluar la etapa de limpieza."),
        ("ml/preprocessing.py", "Pipeline de depuración de datos. Elimina filas duplicadas, descarta montos <= $0, imputa ciudades y dispositivos nulos con lógica contextual, aplica normalización sintáctica y realiza capping superior en el percentil 99.9. Genera el reporte ANTES vs DESPUÉS (`data_quality.json`)."),
        ("ml/feature_engineering.py", "Extractor de 6 variables derivadas con alto poder discriminante: `monto_vs_promedio` (ratio de gasto), `hora_inusual` (madrugadas 00:00-05:59), `distancia_anomala` (>100 km), `ciudad_diferente`, `intentos_fallidos_elevados` (>=2) y `dispositivo_nuevo`."),
        ("ml/train.py", "Módulo de entrenamiento. Divide los datos en 70% train / 30% test estratificado por `is_fraud`. Construye un `ColumnTransformer` (StandardScaler + OneHotEncoder) ajustado únicamente sobre train para prevenir Data Leakage. Entrena Logistic Regression y Random Forest, seleccionando técnicamente este último por F1-Score y Recall."),
        ("ml/predict.py", "Motor de inferencia en tiempo real. Carga y cachea en memoria el modelo entrenado (`fraud_model.joblib`), ejecuta la ingeniería de características sobre una sola transacción y calcula `predict_proba()`."),
        ("ml/eda.py", "Calculador automático de distribuciones multivariables y extractor de los 5 hallazgos estadísticos demostrados con evidencia cuantitativa e interpretación pericial de negocio (`eda_findings.json`)."),
        ("ml/explain.py", "Motor de explicabilidad dinámica en tiempo real. Evalúa los datos reales de la transacción contra el perfil histórico del usuario y los pesos del modelo, generando los 5 factores principales con etiqueta, impacto (ALTO/MEDIO/BAJO) y frase explicativa sin textos estáticos.")
    ]

    for filename, desc in files_ml:
        story.append(Paragraph(f"🔬 <b>backend/{filename}</b>", heading2_style))
        story.append(Paragraph(desc, body_style))

    story.append(PageBreak())

    # Section 4: Módulo Frontend React
    story.append(Paragraph("4. Módulo Frontend SPA (`frontend/src/`)", heading1_style))

    files_frontend = [
        ("src/App.tsx", "Componente raíz de la SPA en React. Gestiona el estado de navegación de pestañas, realiza sondeo periódico de salud del backend (`/api/health`) y renderiza la estructura con Sidebar, Header y la página activa."),
        ("src/services/api.ts", "Cliente HTTP centralizado desarrollado con Axios. Define métodos asíncronos fuertemente tipados para comunicarse con todos los endpoints de FastAPI (`getDashboard`, `predict`, `getHistory`, `getModels`, `getDataQuality`, `getEDA`, etc.)."),
        ("src/types/index.ts", "Definiciones e interfaces TypeScript para todas las entidades del sistema: `TransactionInput`, `PredictionResponse`, `RiskFactor`, `HistoryItem`, `DashboardData`, `ModelComparisonData`, etc."),
        ("src/components/Sidebar.tsx", "Barra lateral de navegación responsive. Contiene los enlaces a los 7 módulos del sistema y un panel inferior con el estado en tiempo real de la API, conexión PostgreSQL y modelo activo."),
        ("src/components/Header.tsx", "Encabezado superior con títulos dinámicos según el módulo visible y botón de re-entrenamiento del pipeline en caliente con estado de carga."),
        ("src/components/RiskBadge.tsx", "Componente de insignia visual reutilizable para niveles de riesgo BAJO (Verde), MEDIO (Amarillo) y ALTO (Rojo) con íconos vectoriales de Lucide Icons."),
        ("src/pages/DashboardPage.tsx", "Vista principal. Muestra 4 cards de KPI superiores, gráficos de Recharts (fraude por hora, ciudad, categoría, dona de riesgo), resumen del modelo activo y la matriz de confusión visual."),
        ("src/pages/AnalyzePage.tsx", "Formulario interactivo para análisis en tiempo real. Incluye presets de 1 clic para 'Alto Riesgo' y 'Bajo Riesgo', validador de campos, medidor de probabilidad y tarjeta visual de explicabilidad pericial."),
        ("src/pages/HistoryPage.tsx", "Tabla de auditoría conectada a la base de datos PostgreSQL. Ofrece búsqueda en tiempo real, filtrado por nivel de riesgo, ordenamiento y modal de inspección detallada de cada predicción."),
        ("src/pages/ModelsPage.tsx", "Página de evaluación. Presenta la tabla comparativa de métricas reales, gráficos de barras de desempeño, justificación técnica del modelo y matrices de confusión duales."),
        ("src/pages/DataQualityPage.tsx", "Vista de calidad. Desglosa las tarjetas ANTES vs DESPUÉS, el índice de salud del dataset (99.78%) y la tabla detallada de transformaciones ejecutadas."),
        ("src/pages/ExplorationPage.tsx", "Página de EDA. Muestra los 5 hallazgos estadísticos demostrados con tarjetas de evidencia cuantitativa e interpretación de negocio junto a gráficos de distribución."),
        ("src/pages/FeaturesPage.tsx", "Vista de importancia de variables. Presenta el ranking gráfico de Gini Impurity de los atributos del ensamble y su justificación funcional.")
    ]

    for filename, desc in files_frontend:
        story.append(Paragraph(f"💻 <b>frontend/{filename}</b>", heading2_style))
        story.append(Paragraph(desc, body_style))

    story.append(Spacer(1, 10))

    # Section 5: Documentación y Configuración
    story.append(Paragraph("5. Documentación, Pruebas y Configuración de Infraestructura", heading1_style))

    files_docs = [
        ("docs/informe_tecnico.md", "Informe técnico académico completo de 16 secciones listo para la entrega oficial."),
        ("docs/metodologia.md", "Documento formal del marco metodológico CRISP-DM adaptado a minería de datos financiera."),
        ("docs/hallazgos.md", "Sustentación pericial de los 5 hallazgos estadísticos descubiertos en los datos reales."),
        ("docs/manual_funcionamiento.md", "Manual explicativo de funcionamiento operativo y flujo de extremo a extremo."),
        ("backend/notebooks/fraud_detection_analysis.ipynb", "Jupyter Notebook ejecutable de principio a fin con celdas de código, visualizaciones y conclusiones."),
        ("backend/test_postgres.py", "Script de verificación automatizada que comprueba la conexión a PostgreSQL con usuario `postgres` y clave `12345`, creando la base de datos `fraudguard_db` si no existe."),
        ("backend/test_api.py", "Suite de pruebas de integración de endpoints REST con FastAPI TestClient y persistencia en base de datos."),
        ("docker-compose.yml & Dockerfiles", "Archivos de orquestación Docker multi-stage para levantar backend FastAPI y frontend Nginx en contenedores aislados.")
    ]

    for filename, desc in files_docs:
        story.append(Paragraph(f"📑 <b>{filename}</b>", heading2_style))
        story.append(Paragraph(desc, body_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
    story.append(Paragraph("<b>FraudGuard AI © 2026</b> — Documento generado automáticamente para soporte técnico y académico.", subtitle_style))

    doc.build(story)
    print(f"[OK] Documento PDF generado exitosamente en: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()
