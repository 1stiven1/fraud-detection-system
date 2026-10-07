import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  History,
  Cpu,
  Database,
  BarChart3,
  Sliders,
  CheckCircle2,
  Server
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  systemHealthy: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, systemHealthy }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Principal', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analizar Transacción', icon: ShieldAlert, highlight: true },
    { id: 'history', label: 'Historial de Auditoría', icon: History },
    { id: 'models', label: 'Modelos y Evaluación', icon: Cpu },
    { id: 'data-quality', label: 'Calidad de Datos', icon: Database },
    { id: 'exploration', label: 'Exploración y Hallazgos', icon: BarChart3 },
    { id: 'features', label: 'Importancia de Variables', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 tracking-tight text-lg">FraudGuard</span>
            <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
              AI
            </span>
          </div>
          <p className="text-xs text-slate-400">Sistema Minería de Datos</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Módulos del Sistema
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${item.highlight && !isActive ? 'font-semibold text-indigo-600' : ''}`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              <span className="flex-1">{item.label}</span>
              {item.highlight && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="bg-white rounded-lg p-3 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" /> API Backend:
            </span>
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                systemHealthy ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  systemHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              {systemHealthy ? 'Online (8000)' : 'Desconectado'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" /> Base de Datos:
            </span>
            <span className="text-slate-700 font-semibold">PostgreSQL</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Modelo Activo:
            </span>
            <span className="text-indigo-600 font-semibold truncate max-w-[90px]">
              Random Forest
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
