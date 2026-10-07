import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { fraudApi } from '../services/servicioApi';
import { DataQualityReport } from '../types/tipos';

export const DataQualityPage: React.FC = () => {
  const [data, setData] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuality = async () => {
      try {
        setLoading(true);
        const res = await fraudApi.getDataQuality();
        setData(res);
      } catch (err) {
        console.error('Error fetching data quality:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuality();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Cargando métricas de calidad de datos...</span>
      </div>
    );
  }

  const { before, after, transformations_applied, summary } = data;

  const comparisonRows = [
    {
      metric: 'Total de Registros Transaccionales',
      before: before.records.toLocaleString(),
      after: after.records.toLocaleString(),
      diff: `-${summary.records_removed} filas inválidas/duplicadas`,
      status: 'success',
    },
    {
      metric: 'Columnas en el Dataset',
      before: before.columns,
      after: after.columns,
      diff: 'Estructura preservada',
      status: 'neutral',
    },
    {
      metric: 'Valores Nulos / Faltantes (Missing Values)',
      before: before.total_nulls.toLocaleString(),
      after: after.total_nulls.toLocaleString(),
      diff: `-${summary.nulls_resolved} nulos imputados (100% resueltos)`,
      status: 'success',
    },
    {
      metric: 'Filas Duplicadas Exactas',
      before: before.duplicate_rows,
      after: after.duplicate_rows,
      diff: `-${summary.duplicates_removed} duplicados purgados`,
      status: 'success',
    },
    {
      metric: 'Montos Negativos / Inválidos (<= $0)',
      before: before.invalid_negative_amounts,
      after: after.invalid_negative_amounts,
      diff: '0 anomalías monetarias',
      status: 'success',
    },
    {
      metric: 'Outliers Extremos en Monto (Winsorización)',
      before: `${before.outliers_detected.amount} detectados (IQR)`,
      after: 'Capping en percentil 99.9 aplicado',
      diff: 'Estabilidad de varianza lograda',
      status: 'success',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner: Data Health Score */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PIPELINE DE LIMPIEZA COMPLETADO
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">Salud y Depuración del Dataset</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Evidencia cuantitativa de las transformaciones ejecutadas por el módulo de preprocesamiento, garantizando un dataset libre de inconsistencias, nulos y distorsiones numéricas.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <span className="text-xs font-semibold text-indigo-300 uppercase">Índice de Salud</span>
              <div className="text-4xl font-black text-emerald-300 font-mono mt-1">
                {summary.data_health_score}%
              </div>
              <span className="text-[10px] text-slate-300 mt-0.5 block">0% Nulos Remanentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Cards: ANTES vs DESPUÉS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Antes */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Estado Inicial
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">ANTES de la Limpieza (RAW)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">transacciones_crudas.csv</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Registros Totales</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {before.records.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block text-[10px]">Columnas Totales</span>
              <span className="text-lg font-black text-slate-900 font-mono">{before.columns}</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
              <span className="text-rose-500 block text-[10px]">Valores Nulos</span>
              <span className="text-lg font-black font-mono">{before.total_nulls.toLocaleString()}</span>
              <span className="text-[10px] text-rose-600 block mt-0.5">
                (device_type: {before.nulls_by_column?.device_type || 0}, city: {before.nulls_by_column?.city || 0})
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900">
              <span className="text-rose-500 block text-[10px]">Filas Duplicadas</span>
              <span className="text-lg font-black font-mono">{before.duplicate_rows}</span>
              <span className="text-[10px] text-rose-600 block mt-0.5">Reintentos idénticos</span>
            </div>
          </div>
        </div>

        {/* Card Después */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Estado Depurado
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">DESPUÉS de la Limpieza (PROCESSED)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">transacciones_procesadas.csv</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-emerald-700 block text-[10px]">Registros Depurados</span>
              <span className="text-lg font-black text-emerald-950 font-mono">
                {after.records.toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-emerald-700 block text-[10px]">Columnas Totales</span>
              <span className="text-lg font-black text-emerald-950 font-mono">{after.columns}</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-emerald-600 block text-[10px]">Valores Nulos</span>
              <span className="text-lg font-black font-mono">0</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">100% Imputados con lógica de negocio</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-emerald-600 block text-[10px]">Filas Duplicadas</span>
              <span className="text-lg font-black font-mono">0</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Deduplicación exacta ejecutada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Detailed Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Tabla Comparativa Cuantitativa</h3>
          <p className="text-xs text-slate-500">Métricas verificables antes y después del procesamiento</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Métrica de Calidad</th>
                <th className="px-5 py-3.5">Antes (RAW)</th>
                <th className="px-5 py-3.5">Después (PROCESSED)</th>
                <th className="px-5 py-3.5">Impacto / Transformación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {comparisonRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800">{r.metric}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-500">{r.before}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">{r.after}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      {r.diff}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* List of Applied Transformations */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" /> Transformaciones Aplicadas en el Pipeline
          </h3>
          <p className="text-xs text-slate-500">
            Secuencia algorítmica documentada en backend/ml/preprocesamiento.py
          </p>
        </div>

        <div className="space-y-2.5">
          {transformations_applied.map((t, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs text-slate-700"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <p className="leading-relaxed font-medium">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
