import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  Clock,
  MapPin,
  ShoppingBag
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { fraudApi } from '../services/servicioApi';
import { DashboardData } from '../types/tipos';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fraudApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar las métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Cargando métricas y distribuciones reales...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-rose-900">Error al Conectar con el Backend</h3>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  const { cards, charts, model_summary, top_features, confusion_matrix } = data;

  const cardItems = [
    {
      label: 'Transacciones Analizadas',
      value: cards.total_transactions.toLocaleString(),
      subtext: `Dataset base + ${cards.live_evaluations_count} inferencias vivas`,
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Transacciones Sospechosas',
      value: cards.suspicious_transactions.toLocaleString(),
      subtext: `Riesgo Medio y Alto (${((cards.suspicious_transactions / cards.total_transactions) * 100).toFixed(1)}%)`,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      label: 'Operaciones de Alto Riesgo',
      value: cards.high_risk_transactions.toLocaleString(),
      subtext: `Tasa de fraude detectada: ${cards.base_fraud_rate}%`,
      icon: ShieldAlert,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-100',
    },
    {
      label: 'Valor Monetario en Riesgo',
      value: `$ ${cards.suspicious_amount.toLocaleString()}`,
      subtext: 'Monto estimado en transacciones anómalas',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cardItems.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {c.label}
                </span>
                <div className={`p-2 rounded-lg border ${c.bg}`}>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                  <span>{c.subtext}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-indigo-400" /> MODELO PRODUCTIVO EN VIVO
              </span>
              <span className="text-xs text-slate-400">
                División Estratificada 70/30 (Sin Data Leakage)
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {model_summary.selected_model}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Activo
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Ensamble de 120 árboles de decisión con hiperparámetros optimizados para minimizar pérdidas financieras por falsos negativos (fraudes omitidos).
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
            <div className="text-center px-3">
              <div className="text-xs text-slate-400 font-medium">Accuracy</div>
              <div className="text-xl font-black text-white mt-0.5">{model_summary.accuracy}%</div>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <div className="text-xs text-slate-400 font-medium">Precision</div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{model_summary.precision}%</div>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <div className="text-xs text-indigo-300 font-semibold">Recall Fraude</div>
              <div className="text-xl font-black text-emerald-300 mt-0.5">{model_summary.recall}%</div>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <div className="text-xs text-indigo-300 font-semibold">F1-Score</div>
              <div className="text-xl font-black text-indigo-300 mt-0.5">{model_summary.f1_score}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Charts (Fraude por Hora & Distribución de Riesgo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraudes por Hora */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Tasa de Fraude por Franja Horaria
              </h3>
              <p className="text-xs text-slate-500">
                Picos críticos evidenciados durante horas de madrugada (00:00 - 05:00)
              </p>
            </div>
            <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold">
              24 Horas
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.fraud_by_hour} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Tasa de Fraude']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="fraud_rate" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Tasa de Fraude (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Riesgo (Donut) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Distribución de Niveles de Riesgo
            </h3>
            <p className="text-xs text-slate-500">Clasificación operativa de la cartera</p>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.risk_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {charts.risk_distribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [val.toLocaleString(), 'Transacciones']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Umbral Bajo: &lt; 40%</span>
            <span>Umbral Alto: &ge; 70%</span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Categoría de Comercio & Fraude por Ciudad) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraudes por Categoría */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" /> Tasa de Fraude por Categoría de Comercio
              </h3>
              <p className="text-xs text-slate-500">Electrónica y Viajes concentran mayor incidencia</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.fraud_by_category} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#334155' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Tasa de Fraude']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="fraud_rate" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Tasa de Fraude (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraudes por Ciudad */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> Tasa de Fraude por Ciudad
              </h3>
              <p className="text-xs text-slate-500">Distribución de riesgo en principales ciudades</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.fraud_by_city} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="city" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Tasa de Fraude']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="fraud_rate" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Tasa de Fraude (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Matriz de Confusión & Top Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matriz de Confusión Real */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Matriz de Confusión — {model_summary.selected_model}
              </h3>
              <p className="text-xs text-slate-500">Evaluada sobre el conjunto de prueba (4,799 transacciones)</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Test Set (30%)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Verdaderos Negativos (TN)
              </span>
              <div className="text-2xl font-black text-emerald-950 mt-2">
                {confusion_matrix.tn?.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 mt-1">
                Transacciones legítimas correctamente autorizadas
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Falsos Positivos (FP)
              </span>
              <div className="text-2xl font-black text-amber-950 mt-2">
                {confusion_matrix.fp?.toLocaleString()}
              </div>
              <span className="text-[11px] text-amber-700 mt-1">
                Falsas alarmas (operaciones normales marcadas)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/70 flex flex-col justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                Falsos Negativos (FN)
              </span>
              <div className="text-2xl font-black text-rose-950 mt-2">
                {confusion_matrix.fn?.toLocaleString()}
              </div>
              <span className="text-[11px] text-rose-700 mt-1">
                Fraudes no interceptados (pérdida económica)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/70 flex flex-col justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
                Verdaderos Positivos (TP)
              </span>
              <div className="text-2xl font-black text-indigo-950 mt-2">
                {confusion_matrix.tp?.toLocaleString()}
              </div>
              <span className="text-[11px] text-indigo-700 mt-1">
                Fraudes interceptados exitosamente
              </span>
            </div>
          </div>
        </div>

        {/* Top Features */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Variables con Mayor Poder Discriminante
            </h3>
            <p className="text-xs text-slate-500">Ponderación algorítmica Gini del ensamble Random Forest</p>
          </div>

          <div className="space-y-3 my-3">
            {top_features.map((feat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{feat.feature}</span>
                  <span className="font-bold text-indigo-600">{feat.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, feat.percentage * 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Extraído del modelo persistido</span>
            <span className="text-indigo-600 font-semibold cursor-pointer">Ver ranking completo &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
};
