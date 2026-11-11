import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Gift,
  FileSpreadsheet,
  Settings,
  Store,
} from 'lucide-react';
import { DashboardTab } from './DashboardTab';
import { ClientsTab } from './ClientsTab';
import { RewardsTab } from './RewardsTab';
import { TransactionsTab } from './TransactionsTab';
import { SettingsTab } from './SettingsTab';
import { Client } from '../../types';

interface BackofficeViewProps {
  onGoToPOSWithClient?: (client: Client) => void;
}

export const BackofficeView: React.FC<BackofficeViewProps> = ({ onGoToPOSWithClient }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'DASHBOARD' | 'CLIENTS' | 'REWARDS' | 'TRANSACTIONS' | 'SETTINGS'
  >('DASHBOARD');

  const navItems = [
    { id: 'DASHBOARD', label: 'Resumen & Métricas', icon: LayoutDashboard },
    { id: 'CLIENTS', label: 'Clientes (CRM)', icon: Users },
    { id: 'REWARDS', label: 'Catálogo de Premios', icon: Gift },
    { id: 'TRANSACTIONS', label: 'Libro de Transacciones', icon: FileSpreadsheet },
    { id: 'SETTINGS', label: 'Reglas & Restaurante', icon: Settings },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Sub-tab Navigation Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSubTab(item.id)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render active sub-tab */}
      {activeSubTab === 'DASHBOARD' && <DashboardTab />}
      {activeSubTab === 'CLIENTS' && <ClientsTab onGoToPOSWithClient={onGoToPOSWithClient} />}
      {activeSubTab === 'REWARDS' && <RewardsTab />}
      {activeSubTab === 'TRANSACTIONS' && <TransactionsTab />}
      {activeSubTab === 'SETTINGS' && <SettingsTab />}
    </div>
  );
};
