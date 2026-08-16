import React from 'react';
import { EnergyProvider, useEnergy } from './context/EnergyContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationToastContainer } from './components/layout/NotificationToast';
import { NetworkMap } from './components/map/NetworkMap';
import { ObjectRegistry } from './components/registry/ObjectRegistry';
import { ObjectDetailView } from './components/object-detail/ObjectDetailView';
import { EventLogView } from './components/events/EventLogView';
import { DashboardView } from './components/dashboard/DashboardView';

const MainContent: React.FC = () => {
  const { activeTab } = useEnergy();

  return (
    <main className="flex-1 overflow-y-auto bg-grid-darkest min-h-screen">
      {activeTab === 'map' && <NetworkMap />}
      {activeTab === 'registry' && <ObjectRegistry />}
      {activeTab === 'detail' && <ObjectDetailView />}
      {activeTab === 'events' && <EventLogView />}
      {activeTab === 'dashboard' && <DashboardView />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <EnergyProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-grid-darkest text-slate-100 antialiased font-sans">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Right Main Container */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header />
          <MainContent />
        </div>

        {/* SCADA Dispatch Alert Toasts */}
        <NotificationToastContainer />
      </div>
    </EnergyProvider>
  );
};

export default App;
