import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelsPage } from './pages/ModelsPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { ExplorationPage } from './pages/ExplorationPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { fraudApi } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [systemHealthy, setSystemHealthy] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const checkHealth = async () => {
    try {
      const res = await fraudApi.getHealth();
      setSystemHealthy(res.status === 'healthy');
    } catch {
      setSystemHealthy(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
    checkHealth();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        systemHealthy={systemHealthy}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header currentTab={currentTab} onRefreshData={handleRefreshData} />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardPage key={refreshTrigger} />}
          {currentTab === 'analyze' && <AnalyzePage key={refreshTrigger} />}
          {currentTab === 'history' && <HistoryPage key={refreshTrigger} />}
          {currentTab === 'models' && <ModelsPage key={refreshTrigger} />}
          {currentTab === 'data-quality' && <DataQualityPage key={refreshTrigger} />}
          {currentTab === 'exploration' && <ExplorationPage key={refreshTrigger} />}
          {currentTab === 'features' && <FeaturesPage key={refreshTrigger} />}
        </main>
      </div>
    </div>
  );
}

export default App;
