# FraudGuard AI — Frontend (React + TypeScript + Vite)

Interfaz de usuario empresarial desarrollada en React 19, TypeScript, Vite, Tailwind CSS y Recharts para la visualización y análisis de fraude.

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo Vite
npm run dev

# 3. Compilar para producción
npm run build
```

## 📱 Módulos de la Interfaz

1. **Dashboard Principal:** Cards estadísticas, gráficos interactivos Recharts, resumen del modelo y matriz de confusión.
2. **Analizar Transacción:** Formulario interactivo con validación de inputs, presets de demostración rápida para sustentación y tarjeta visual de explicabilidad.
3. **Historial de Auditoría:** Tabla de operaciones persistidas en SQLite con búsqueda por ID/ciudad, filtros por riesgo y modal de detalle pericial.
4. **Modelos y Evaluación:** Comparación de métricas (Logistic Regression vs Random Forest), gráficos comparativos y justificación técnica.
5. **Calidad de Datos:** Métricas de salud del dataset antes vs después y lista de transformaciones ejecutadas.
6. **Exploración EDA:** Distribuciones completas y 5 hallazgos estadísticos sustentados con números reales.
7. **Importancia de Variables:** Ranking gráfico de atributos por ponderación de Gini Impurity.
