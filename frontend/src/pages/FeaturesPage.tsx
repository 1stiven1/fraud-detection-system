import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Cpu,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Info
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
import { fraudApi } from '../services/api';
import { FeatureImportanceData } from '../types';

export const FeaturesPage: React.FC = () => {
  const [data, setData] = useState<FeatureImportanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        const res = await fraudApi.getFeatureImportance();
        setData(res);
      } catch (err) {
        console.error('Error fetching feature importance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Extrayendo importancias del modelo persistido...</span>
      </div>
    );
  }

  const { features, model } = data;

  const featureExplanations: Record<string, string> = {
    monto_vs_promedio: 'Variable derivada que mide el ratio del monto respecto al histórico del cliente. Es el predictor #1 de fraude.',
    distance_from_usual_location: 'Distancia física en km desde el lugar habitual de residencia. Captura transacciones remotas no autorizadas.',
    failed_attempts: 'Número de intentos de pago fallidos previos. Identifica ataques de fuerza bruta y prueba sistemática de credenciales.',
    amount: 'Valor monetario nominal de la transacción. Magnitud directa del posible drenado financiero.',
    average_transaction_amount: 'Perfil de gasto promedio habitual del cliente, usado como línea base de normalidad.',
    account_age_days: 'Antigüedad de la cuenta en días. Cuentas muy recientes presentan mayor propensión a identidades sintéticas.',
    merchant_category: 'Sector del comercio receptor. Categorías líquidas como electrónica y viajes concentran mayor riesgo.',
    transaction_frequency: 'Frecuencia típica diaria de transacciones del cliente.',
    intentos_fallidos_elevados: 'Bandera derivada para indicar reiteración crítica de fallos (>= 2 intentos rechazados).',
    customer_age: 'Edad del titular de la cuenta bancaria.',
    city: 'Ciudad física donde se originó el cobro.',
    hora_inusual: 'Bandera derivada de operación en horario nocturno crítico (00:00 - 05:59 hrs).',
    payment_method: 'Método de pago (tarjeta de crédito, débito, transferencia, crypto, billetera virtual).',
    device_type: 'Huella y tipo de dispositivo utilizado (móvil, web, desconocido).',
    recent_transactions: 'Ráfaga de operaciones realizadas en la última hora.',
    distancia_anomala: 'Bandera binaria derivada cuando la distancia excede los 100 km respecto al hogar.',
    transacciones_ultima_hora: 'Número de cargos consecutivos en la ventana móvil de 60 minutos.',
    ciudad_diferente: 'Indicador de discrepancia geográfica entre ciudad de compra y residencia habitual.',
    dispositivo_nuevo: 'Dispositivo no registrado previamente o clasificado como desconocido.',
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 inline-flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> IMPORTANCIA RELATIVA DE ATRIBUTOS
            </span>
            <h2 className="text-2xl font-black text-white">Ranking de Variables — {model}</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Ponderación algorítmica calculada mediante la reducción de impureza de Gini a través de los 120 árboles del ensamble. Destaca el valor de las variables derivadas de ingeniería de características.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center shrink-0">
            <span className="text-[11px] text-indigo-300 uppercase font-semibold">Variable Más Determinante</span>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-0.5">
              {features[0]?.feature}
            </div>
            <span className="text-xs text-slate-300 mt-1 block">
              {features[0]?.percentage}% del poder predictivo total
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" /> Visualización de la Distribución de Importancia
            </h3>
            <p className="text-xs text-slate-500">Porcentaje de contribución individual al árbol de decisiones</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Gini Feature Importance
          </span>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={features.slice(0, 12)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="feature" type="category" tick={{ fontSize: 11, fill: '#1e293b' }} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Contribución Relativa']}
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="percentage" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Feature Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Tabla de Atributos y Rol en el Negocio</h3>
          <p className="text-xs text-slate-500">
            Descripción conceptual y peso matemático de cada variable en el modelo productivo
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Posición</th>
                <th className="px-5 py-3.5">Variable</th>
                <th className="px-5 py-3.5">Importancia (%)</th>
                <th className="px-5 py-3.5">Barra Relativa</th>
                <th className="px-5 py-3.5">Justificación de Negocio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {features.map((f, idx) => {
                const isEngineered = [
                  'monto_vs_promedio',
                  'hora_inusual',
                  'distancia_anomala',
                  'ciudad_diferente',
                  'transacciones_ultima_hora',
                  'intentos_fallidos_elevados',
                  'dispositivo_nuevo',
                ].includes(f.feature);

                return (
                  <tr key={f.feature} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-400">#{idx + 1}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{f.feature}</span>
                      {isEngineered && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          Derivada
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-700 text-sm">
                      {f.percentage}%
                    </td>
                    <td className="px-5 py-3.5 w-40">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, f.percentage * 8.5)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs leading-relaxed max-w-md">
                      {featureExplanations[f.feature] || 'Variable relevante para segmentación y clasificación.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
