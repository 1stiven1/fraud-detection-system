import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  Lightbulb,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { fraudApi } from '../services/servicioApi';
import { EDAData } from '../types/tipos';

export const ExplorationPage: React.FC = () => {
  const [data, setData] = useState<EDAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEDA = async () => {
      try {
        setLoading(true);
        const res = await fraudApi.getEDA();
        setData(res);
      } catch (err) {
        console.error('Error fetching EDA:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEDA();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Calculando análisis exploratorio de datos (EDA)...</span>
      </div>
    );
  }

  const { distributions, findings } = data;
  const { summary } = distributions;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-indigo-800/50">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 inline-flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" /> EXPLORACIÓN EMPÍRICA DE DATOS
            </span>
            <h2 className="text-2xl font-black text-white">Descubrimiento de Patrones y Anomalías</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Análisis multivariable sobre {summary.total_transactions.toLocaleString()} transacciones depuradas. Se identifican correlaciones estadísticas no lineales entre factores operacionales y el vector de ataque de fraude.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-400 uppercase">Tasa Fraude Base</span>
              <div className="text-2xl font-black text-rose-300 font-mono mt-0.5">
                {summary.base_fraud_rate}%
              </div>
            </div>
            <div className="text-center px-2 border-l border-white/10">
              <span className="text-[11px] text-slate-400 uppercase">Fraudes Confirmados</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {summary.total_fraud.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PRINCIPALES HALLAZGOS ESTADÍSTICOS (MÍNIMO 5 OBLIGATORIOS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> Principales 5 Hallazgos Estadísticos Demostrados
            </h3>
            <p className="text-xs text-slate-500">
              Patrones descubiertos algorítmicamente a partir de los datos reales del dataset procesado
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Evidencia Cuantitativa
          </span>
        </div>

        <div className="space-y-4">
          {findings.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4 hover:border-indigo-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    #{f.id}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                  Riesgo Relativo: {f.evidence.risk_multiplier || 'Elevado'}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {f.description}
              </p>

              {/* Statistical Evidence Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                {Object.entries(f.evidence).map(([key, val]: [string, any]) => (
                  <div key={key}>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold truncate">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-900 font-mono mt-0.5 block text-sm">
                      {typeof val === 'number' ? (val < 100 && val > 0 ? `${val}%` : val.toLocaleString()) : val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900 block mb-0.5">Interpretación Pericial de Negocio:</span>
                  <p className="text-indigo-800 leading-relaxed">{f.interpretation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: GRÁFICOS EXPLORATORIOS COMPLETOS */}
      <div className="space-y-6 pt-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" /> Visualización de Distribuciones Transaccionales
          </h3>
          <p className="text-xs text-slate-500">
            Exploración exhaustiva de las dimensiones temporales, geográficas, monetarias y conductuales
          </p>
        </div>

        {/* Grid Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Fraude por Hora */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" /> Fraude Según Hora del Día
              </h4>
              <p className="text-xs text-slate-500">Tasa porcentual de fraude por cada hora (0 a 23 hrs)</p>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.fraud_by_hour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour_label" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Tasa Fraude']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="fraud_rate" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong className="text-slate-700">Insight:</strong> Alta concentración de riesgo en la franja de 00:00 a 05:00 horas debido a la ausencia de supervisión inmediata del tarjetahabiente.
            </div>
          </div>

          {/* Gráfico 2: Fraude por Intentos Fallidos */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-indigo-600" /> Relación: Intentos Fallidos vs Fraude
              </h4>
              <p className="text-xs text-slate-500">Tasa de fraude en función del número de fallas previas</p>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.failed_attempts_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="attempts" tick={{ fontSize: 11, fill: '#64748b' }} unit=" intentos" />
                  <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Tasa Fraude']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="fraud_rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong className="text-slate-700">Insight:</strong> Operaciones con 2 o más intentos fallidos disparan el riesgo exponencialmente por ataques de credential testing.
            </div>
          </div>

          {/* Gráfico 3: Distribución por Rangos de Monto */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Relación: Rango de Monto vs Fraude
              </h4>
              <p className="text-xs text-slate-500">Tasa de fraude por intervalos de importe monetario</p>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.amount_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Tasa Fraude']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="fraud_rate" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong className="text-slate-700">Insight:</strong> Los importes superiores a $600 presentan una tasa de fraude desproporcionada respecto a consumos de bajo monto.
            </div>
          </div>

          {/* Gráfico 4: Relación Distancia vs Fraude */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-600" /> Relación: Distancia de Ubicación vs Fraude
              </h4>
              <p className="text-xs text-slate-500">Tasa de fraude según la distancia al domicilio habitual</p>
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.distance_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Tasa Fraude']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="fraud_rate" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <strong className="text-slate-700">Insight:</strong> Distancias superiores a 150 km respecto al centro habitual multiplican el riesgo por desplazamientos geográficos anómalos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
