import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  X,
  AlertTriangle,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  Shield,
  HelpCircle
} from 'lucide-react';
import { fraudApi } from '../services/api';
import { HistoryItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fraudApi.getHistory({
        search: search || undefined,
        risk_level: riskFilter || undefined,
        sort_by: sortBy,
        order: sortOrder,
        limit: 100,
      });
      setHistory(res);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por ID o Ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </form>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los Niveles</option>
              <option value="BAJO">Solo Riesgo Bajo</option>
              <option value="MEDIO">Solo Riesgo Medio</option>
              <option value="ALTO">Solo Riesgo Alto</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="timestamp-desc">Más Recientes Primero</option>
              <option value="timestamp-asc">Más Antiguos Primero</option>
              <option value="fraud_probability-desc">Mayor Probabilidad</option>
              <option value="fraud_probability-asc">Menor Probabilidad</option>
              <option value="amount-desc">Mayor Monto ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Consultando registros en SQLite...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <History className="w-10 h-10 text-slate-300 mb-1" />
            <h4 className="text-sm font-bold text-slate-800">No se encontraron predicciones</h4>
            <p className="text-xs text-slate-400">
              Pruebe cambiando los filtros o analice una transacción nueva en la pestaña 'Analizar'.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">ID Transacción</th>
                  <th className="px-5 py-3.5">Monto ($)</th>
                  <th className="px-5 py-3.5">Ciudad</th>
                  <th className="px-5 py-3.5">Probabilidad</th>
                  <th className="px-5 py-3.5">Nivel Riesgo</th>
                  <th className="px-5 py-3.5">Recomendación</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((row) => (
                  <tr
                    key={row.prediction_id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(row)}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(row.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(row.timestamp).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                      {row.transaction_id}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 capitalize">{row.city}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 font-mono">{row.percentage}%</span>
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              row.risk_level === 'ALTO'
                                ? 'bg-rose-500'
                                : row.risk_level === 'MEDIO'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(10, row.percentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <RiskBadge level={row.risk_level} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-600 font-medium">
                      {row.recommendation}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(row);
                        }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200"
                        title="Ver detalle pericial"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Predicción */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Detalle Pericial de Auditoría
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Transacción: {selectedItem.transaction_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Risk Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedItem.risk_level === 'ALTO'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : selectedItem.risk_level === 'MEDIO'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}
            >
              <div>
                <div className="text-xs uppercase font-semibold text-slate-500">Estimación Algorítmica</div>
                <div className="text-3xl font-black font-mono mt-0.5">{selectedItem.percentage}%</div>
                <div className="text-xs font-bold mt-1 text-slate-800">{selectedItem.recommendation}</div>
              </div>
              <RiskBadge level={selectedItem.risk_level} size="lg" />
            </div>

            {/* Input Attributes Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Datos de la Operación
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Monto</span>
                  <span className="font-bold text-slate-900">${selectedItem.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Ciudad</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedItem.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Categoría</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedItem.merchant_category.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Método de Pago</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedItem.payment_method?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ID Predicción</span>
                  <span className="font-mono text-slate-700 text-[11px] truncate block">
                    {selectedItem.prediction_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Modelo Utilizado</span>
                  <span className="font-semibold text-indigo-600">{selectedItem.model_version}</span>
                </div>
              </div>
            </div>

            {/* Explanatory Factors */}
            {selectedItem.risk_factors && selectedItem.risk_factors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Factores Explicativos Registrados
                </h4>
                <div className="space-y-2">
                  {selectedItem.risk_factors.map((rf, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">{rf.label}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            rf.impact === 'ALTO'
                              ? 'bg-rose-100 text-rose-800'
                              : rf.impact === 'MEDIO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rf.impact}
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[11px]">{rf.value}</div>
                      <p className="text-slate-600 leading-snug">{rf.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
