import React, { useEffect, useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { fraudApi } from '../services/api';
import { ModelComparisonData } from '../types';

export const ModelsPage: React.FC = () => {
  const [data, setData] = useState<{
    comparison: ModelComparisonData;
    confusion_matrices: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const res = await fraudApi.getModels();
        setData(res);
      } catch (err) {
        console.error('Error fetching models:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Cargando evaluación de modelos...</span>
      </div>
    );
  }

  const { comparison, confusion_matrices } = data;
  const models = comparison.models || [];
  const selectedModel = comparison.selected_model;

  // Preparar datos para el gráfico comparativo de barras
  const chartData = [
    {
      metric: 'Accuracy',
      'Logistic Regression': models.find((m) => m.model_name === 'Logistic Regression')?.accuracy || 0,
      'Random Forest': models.find((m) => m.model_name === 'Random Forest')?.accuracy || 0,
    },
    {
      metric: 'Precision',
      'Logistic Regression': models.find((m) => m.model_name === 'Logistic Regression')?.precision || 0,
      'Random Forest': models.find((m) => m.model_name === 'Random Forest')?.precision || 0,
    },
    {
      metric: 'Recall (Fraude)',
      'Logistic Regression': models.find((m) => m.model_name === 'Logistic Regression')?.recall || 0,
      'Random Forest': models.find((m) => m.model_name === 'Random Forest')?.recall || 0,
    },
    {
      metric: 'F1-Score',
      'Logistic Regression': models.find((m) => m.model_name === 'Logistic Regression')?.f1_score || 0,
      'Random Forest': models.find((m) => m.model_name === 'Random Forest')?.f1_score || 0,
    },
    {
      metric: 'ROC-AUC',
      'Logistic Regression': models.find((m) => m.model_name === 'Logistic Regression')?.roc_auc || 0,
      'Random Forest': models.find((m) => m.model_name === 'Random Forest')?.roc_auc || 0,
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Selected Model Highlight Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-indigo-800/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> MODELO PRODUCTIVO SELECCIONADO
              </span>
              <span className="text-xs text-slate-400">Evaluación con 4,799 muestras de prueba</span>
            </div>
            <h2 className="text-2xl font-black text-white">{selectedModel} Classifier</h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {comparison.selection_reason}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0 text-center">
            <div className="text-xs text-indigo-200 font-medium uppercase">Métrica Decisoria</div>
            <div className="text-3xl font-black text-emerald-300 font-mono mt-1">
              F1: {models.find((m) => m.model_name === selectedModel)?.f1_score}%
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              Mayor balance armónico en clase desbalanceada
            </div>
          </div>
        </div>
      </div>

      {/* Model Metrics Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tabla Comparativa de Desempeño</h3>
            <p className="text-xs text-slate-500">
              Evaluación cuantitativa sobre el 30% del dataset reservado para test (sin data leakage)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Split 70/30 Estratificado
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Modelo Evaluado</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Accuracy</th>
                <th className="px-5 py-3.5">Precision (Fraude)</th>
                <th className="px-5 py-3.5 text-indigo-700">Recall (Fraude)*</th>
                <th className="px-5 py-3.5 text-indigo-700 font-black">F1-Score*</th>
                <th className="px-5 py-3.5">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {models.map((m) => {
                const isSelected = m.model_name === selectedModel;
                return (
                  <tr
                    key={m.model_name}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="px-5 py-4 text-slate-900 font-bold text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      {m.model_name}
                    </td>
                    <td className="px-5 py-4">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Producción
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Benchmark Alternativo</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-700">{m.accuracy}%</td>
                    <td className="px-5 py-4 text-slate-700">{m.precision}%</td>
                    <td className="px-5 py-4 text-indigo-700 font-bold text-sm">{m.recall}%</td>
                    <td className="px-5 py-4 text-indigo-700 font-black text-sm">{m.f1_score}%</td>
                    <td className="px-5 py-4 text-slate-700">{m.roc_auc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-400 italic pt-1">
          * En detección de fraude financiero, el Recall y F1-Score son las métricas prioritarias debido al alto costo asimétrico de los falsos negativos.
        </p>
      </div>

      {/* Visual Metric Comparison Bar Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" /> Comparación Visual de Métricas
            </h3>
            <p className="text-xs text-slate-500">Contraste directo entre los modelos evaluados</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12, fill: '#334155' }} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
              <Tooltip
                formatter={(val: any) => [`${val}%`]}
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="Logistic Regression" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Random Forest" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Confusion Matrices Comparison */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Matrices de Confusión Detalladas</h3>
          <p className="text-xs text-slate-500">
            Comparación empírica de aciertos y errores en el conjunto de prueba
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(confusion_matrices).map(([mName, cm]: [string, any]) => {
            const isSelected = mName === selectedModel;
            return (
              <div
                key={mName}
                className={`bg-white rounded-2xl p-6 border shadow-xs space-y-4 ${
                  isSelected ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {mName}
                    {isSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                        Seleccionado
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-slate-400">Total: 4,799</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Verdaderos Negativos (TN)
                    </span>
                    <div className="text-xl font-black text-emerald-950 font-mono mt-1">
                      {cm.tn?.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">Legítimas autorizadas</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">
                      Falsos Positivos (FP)
                    </span>
                    <div className="text-xl font-black text-amber-950 font-mono mt-1">
                      {cm.fp?.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-amber-600 block mt-0.5">Falsas alarmas generadas</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">
                      Falsos Negativos (FN)
                    </span>
                    <div className="text-xl font-black text-rose-950 font-mono mt-1">
                      {cm.fn?.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-rose-600 block mt-0.5">Fraudes omitidos</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
                    <span className="text-[10px] font-bold text-indigo-800 uppercase block">
                      Verdaderos Positivos (TP)
                    </span>
                    <div className="text-xl font-black text-indigo-950 font-mono mt-1">
                      {cm.tp?.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-indigo-600 block mt-0.5">Fraudes detectados</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
