import React, { useState } from 'react';
import {
  ShieldAlert,
  Send,
  RefreshCw,
  Sparkles,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  MapPin,
  Smartphone,
  CreditCard,
  User,
  History,
  Info
} from 'lucide-react';
import { fraudApi } from '../services/api';
import { TransactionInput, PredictionResponse } from '../types';
import { RiskBadge } from '../components/RiskBadge';

const HIGH_RISK_PRESET: TransactionInput = {
  transaction_id: 'TX_DEMO_ALTO_RIESGO',
  amount: 3450.0,
  transaction_date: '2026-03-24',
  transaction_time: '03:42:00',
  customer_age: 29,
  city: 'Cartagena',
  merchant_category: 'electronics',
  payment_method: 'crypto',
  recent_transactions: 5,
  device_type: 'unknown',
  account_age_days: 14,
  failed_attempts: 4,
  usual_city: 'Bogota',
  distance_from_usual_location: 820.0,
  average_transaction_amount: 110.0,
  transaction_frequency: 7.2,
};

const LOW_RISK_PRESET: TransactionInput = {
  transaction_id: 'TX_DEMO_BAJO_RIESGO',
  amount: 42.5,
  transaction_date: '2026-03-24',
  transaction_time: '14:20:00',
  customer_age: 41,
  city: 'Bogota',
  merchant_category: 'supermarket',
  payment_method: 'debit_card',
  recent_transactions: 1,
  device_type: 'mobile_android',
  account_age_days: 640,
  failed_attempts: 0,
  usual_city: 'Bogota',
  distance_from_usual_location: 2.1,
  average_transaction_amount: 48.0,
  transaction_frequency: 2.4,
};

export const AnalyzePage: React.FC = () => {
  const [formData, setFormData] = useState<TransactionInput>(LOW_RISK_PRESET);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Santa Marta'];
  const categories = [
    'retail',
    'electronics',
    'travel',
    'supermarket',
    'entertainment',
    'restaurants',
    'financial_services',
    'gambling',
  ];
  const paymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'virtual_wallet', 'crypto'];
  const deviceTypes = ['mobile_android', 'mobile_ios', 'web_chrome', 'web_safari', 'unknown'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fraudApi.predict(formData);
      setResult(res);
      // Desplazamiento suave al resultado
      setTimeout(() => {
        const el = document.getElementById('prediction-result-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Error al procesar la predicción.');
    } finally {
      setLoading(false);
    }
  };

  const loadRandomSample = async () => {
    try {
      setLoading(true);
      const samples = await fraudApi.getTransactions(10, Math.random() > 0.5);
      if (samples && samples.length > 0) {
        const rnd = samples[Math.floor(Math.random() * samples.length)];
        setFormData({
          transaction_id: rnd.transaction_id || `TX_RND_${Math.floor(Math.random() * 10000)}`,
          amount: rnd.amount,
          transaction_date: rnd.transaction_date || '2026-03-24',
          transaction_time: rnd.transaction_time || '12:00:00',
          customer_age: rnd.customer_age,
          city: rnd.city,
          merchant_category: rnd.merchant_category,
          payment_method: rnd.payment_method,
          recent_transactions: rnd.recent_transactions,
          device_type: rnd.device_type,
          account_age_days: rnd.account_age_days,
          failed_attempts: rnd.failed_attempts,
          usual_city: rnd.usual_city,
          distance_from_usual_location: rnd.distance_from_usual_location,
          average_transaction_amount: rnd.average_transaction_amount,
          transaction_frequency: rnd.transaction_frequency,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Quick Demo Shortcuts Banner */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Demostración en Vivo para Sustentación</h3>
            <p className="text-xs text-slate-500">
              Cargue presets rápidos o introduzca cualquier valor arbitrario en el formulario inferior.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFormData(HIGH_RISK_PRESET)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Preset Alto Riesgo</span>
          </button>

          <button
            type="button"
            onClick={() => setFormData(LOW_RISK_PRESET)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preset Bajo Riesgo</span>
          </button>

          <button
            type="button"
            onClick={loadRandomSample}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>Muestra del Dataset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Result on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Parámetros de la Transacción</h2>
              <p className="text-xs text-slate-500">Ingrese las 15 variables operativas para análisis</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
              Validación Pydantic
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section 1: Montos y Finanzas */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> 1. Variables Monetarias
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monto de la Transacción ($ USD/COP)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gasto Promedio Histórico del Cliente ($)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="average_transaction_amount"
                    value={formData.average_transaction_amount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ratio calculado: {(formData.amount / (formData.average_transaction_amount || 1)).toFixed(1)}x
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Tiempo y Hora */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> 2. Dimensión Temporal
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha (YYYY-MM-DD)*</label>
                  <input
                    type="date"
                    name="transaction_date"
                    value={formData.transaction_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hora (HH:MM:SS)*</label>
                  <input
                    type="time"
                    step="1"
                    name="transaction_time"
                    value={formData.transaction_time}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Horario inusual crítico: 00:00 - 05:59 hrs
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Geografía y Distancia */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 3. Dimensión Geoespacial
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad Transacción*</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden capitalize"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ciudad Habitual*</label>
                  <select
                    name="usual_city"
                    value={formData.usual_city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden capitalize"
                  >
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Distancia (km)*</label>
                  <input
                    type="number"
                    step="0.1"
                    name="distance_from_usual_location"
                    value={formData.distance_from_usual_location}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Categoría y Método */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> 4. Contexto y Seguridad
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría Comercio*</label>
                  <select
                    name="merchant_category"
                    value={formData.merchant_category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden capitalize"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Método de Pago*</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden capitalize"
                  >
                    {paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dispositivo*</label>
                  <select
                    name="device_type"
                    value={formData.device_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden capitalize"
                  >
                    {deviceTypes.map((d) => (
                      <option key={d} value={d}>
                        {d.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Intentos Fallidos*</label>
                  <input
                    type="number"
                    name="failed_attempts"
                    value={formData.failed_attempts}
                    onChange={handleChange}
                    min="0"
                    max="20"
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tx Última Hora*</label>
                  <input
                    type="number"
                    name="recent_transactions"
                    value={formData.recent_transactions}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Antigüedad Cuenta (días)*</label>
                  <input
                    type="number"
                    name="account_age_days"
                    value={formData.account_age_days}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Edad Cliente*</label>
                  <input
                    type="number"
                    name="customer_age"
                    value={formData.customer_age}
                    onChange={handleChange}
                    min="18"
                    max="105"
                    required
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ejecutando Pipeline ML y Explicabilidad...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ANALIZAR TRANSACCIÓN EN TIEMPO REAL</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Result Container */}
        <div className="lg:col-span-5" id="prediction-result-card">
          {result ? (
            <div className="space-y-6 sticky top-24">
              {/* Main Score Card */}
              <div
                className={`rounded-2xl p-6 border shadow-md transition-all ${
                  result.risk_level === 'ALTO'
                    ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                    : result.risk_level === 'MEDIO'
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                    : 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase opacity-75">
                    Resultado de Evaluación
                  </span>
                  <RiskBadge level={result.risk_level} size="lg" />
                </div>

                <div className="mt-5 text-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Probabilidad de Fraude
                  </div>
                  <div className="text-5xl font-black tracking-tight mt-1 font-mono">
                    {result.percentage}%
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-3 mt-4 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ${
                        result.risk_level === 'ALTO'
                          ? 'bg-rose-600'
                          : result.risk_level === 'MEDIO'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.max(5, result.percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Recommendation Banner */}
                <div className="mt-6 bg-white/90 backdrop-blur-xs rounded-xl p-4 border border-slate-200/70 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Recomendación Operativa
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {result.recommendation}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200/50">
                  <span>ID: {result.prediction_id}</span>
                  <span>{result.model_used}</span>
                </div>
              </div>

              {/* Explainability Factors */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" /> ¿Por qué esta transacción fue evaluada así?
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Explicabilidad Dinámica
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Factores estadísticos del cliente y pesos del modelo evaluados sobre los datos reales:
                </p>

                <div className="space-y-3">
                  {result.factors.map((f, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{f.label}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            f.impact === 'ALTO'
                              ? 'bg-rose-100 text-rose-800'
                              : f.impact === 'MEDIO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          IMPACTO {f.impact}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-indigo-600 font-mono">
                        Valor ingresado: {f.value}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                        {f.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center flex flex-col items-center justify-center min-h-[420px] text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Esperando Parámetros</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Complete el formulario de la izquierda o seleccione un preset de prueba para ejecutar la inferencia en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
