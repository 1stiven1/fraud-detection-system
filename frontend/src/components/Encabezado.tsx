import React, { useState } from 'react';
import { RefreshCw, Play, Sparkles } from 'lucide-react';
import { fraudApi } from '../services/servicioApi';

interface HeaderProps {
  currentTab: string;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onRefreshData }) => {
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard General de Fraude',
      subtitle: 'Métricas agregadas, distribución de riesgo e indicadores clave de detección.',
    },
    analyze: {
      title: 'Analizar Nueva Transacción',
      subtitle: 'Inferencia en tiempo real, estimación de probabilidad, clasificación de riesgo y explicabilidad.',
    },
    history: {
      title: 'Historial de Auditoría Transaccional',
      subtitle: 'Registro persistente en PostgreSQL de todas las operaciones evaluadas con desglose pericial.',
    },
    models: {
      title: 'Modelos de Machine Learning',
      subtitle: 'Evaluación comparativa (Logistic Regression vs Random Forest) y justificación técnica.',
    },
    'data-quality': {
      title: 'Calidad de Datos y Limpieza',
      subtitle: 'Evidencia cuantitativa ANTES vs DESPUÉS del pipeline de depuración y normalización.',
    },
    exploration: {
      title: 'Análisis Exploratorio (EDA) y Hallazgos',
      subtitle: 'Descubrimiento empírico de patrones con 5 hallazgos estadísticos demostrados.',
    },
    features: {
      title: 'Importancia de Variables (Features)',
      subtitle: 'Ponderación algorítmica de los atributos de mayor poder discriminante en el ensamble.',
    },
  };

  const currentInfo = titles[currentTab] || {
    title: 'FraudGuard',
    subtitle: 'Sistema de Minería de Datos para Detección de Fraude Transaccional',
  };

  const handleRetrain = async () => {
    if (!window.confirm('¿Desea re-entrenar y evaluar nuevamente los modelos con el pipeline completo?')) {
      return;
    }
    setRetraining(true);
    setRetrainSuccess(false);
    try {
      await fraudApi.triggerRetrain();
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 4000);
      if (onRefreshData) onRefreshData();
    } catch {
      alert('Error durante el re-entrenamiento. Verifique la consola del servidor.');
    } finally {
      setRetraining(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">{currentInfo.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            title="Actualizar datos"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs border ${
            retrainSuccess
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
          }`}
        >
          {retraining ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Entrenando Pipeline...</span>
            </>
          ) : retrainSuccess ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>¡Modelos Actualizados!</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Reentrenar Pipeline ML</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
