import React, { useState, useEffect } from 'react';
import { LoyaltyProvider, useLoyalty } from './context/LoyaltyContext';
import { Navbar, MainViewMode } from './components/layout/Navbar';
import { PosTerminal } from './components/pos/PosTerminal';
import { BackofficeView } from './components/backoffice/BackofficeView';
import { CustomerMobileApp } from './components/customer/CustomerMobileApp';
import { LiveSyncView } from './components/live/LiveSyncView';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { NewClientModal } from './components/pos/NewClientModal';
import { AndroidInstallModal } from './components/common/AndroidInstallModal';
import { StaffPinGate } from './components/common/StaffPinGate';
import { Lock } from 'lucide-react';
import { Client } from './types';

const STAFF_UNLOCK_KEY = 'submiguelenos_staff_unlocked_v1';

function LoyaltyAppContent() {
  const {
    activeReceipt,
    closeReceipt,
    setSelectedClient,
    config,
    isServerConnected,
    isAndroidStandalone,
  } = useLoyalty();

  // Check URL params for direct Android native launch (?app=android) or specific view (?view=POS)
  const [isNativeAndroidMode, setIsNativeAndroidMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('app') === 'android';
  });

  const [currentView, setCurrentView] = useState<MainViewMode>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as MainViewMode | null;
      if (
        viewParam &&
        ['LIVE_SYNC', 'APP_MOBILE', 'POS', 'BACKOFFICE'].includes(viewParam)
      ) {
        return viewParam;
      }
    }
    return 'APP_MOBILE';
  });

  const [isStaffUnlocked, setIsStaffUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STAFF_UNLOCK_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleUnlockStaff = () => {
    setIsStaffUnlocked(true);
    try {
      sessionStorage.setItem(STAFF_UNLOCK_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleLockStaff = () => {
    setIsStaffUnlocked(false);
    try {
      sessionStorage.removeItem(STAFF_UNLOCK_KEY);
    } catch {
      // Ignore
    }
  };

  const [showGlobalNewClient, setShowGlobalNewClient] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  useEffect(() => {
    if (isAndroidStandalone) {
      setIsNativeAndroidMode(true);
    }
  }, [isAndroidStandalone]);

  const handleGoToPOSWithClient = (client: Client) => {
    setSelectedClient(client);
    setCurrentView('POS');
  };

  // Fullscreen Native Android App Mode (when installed on Android or opened via ?app=android)
  if (isNativeAndroidMode) {
    return (
      <CustomerMobileApp
        isNativeFullscreen={true}
        onExitNativeFullscreen={() => {
          setIsNativeAndroidMode(false);
          if (typeof window !== 'undefined' && window.location.search.includes('app=android')) {
            window.history.replaceState({}, '', '/');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100/70 text-neutral-900">
      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenNewClient={() => setShowGlobalNewClient(true)}
        onOpenAndroidInstall={() => setShowAndroidModal(true)}
        isStaffUnlocked={isStaffUnlocked}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 pb-12">
        {currentView === 'LIVE_SYNC' &&
          (isStaffUnlocked ? (
            <LiveSyncView />
          ) : (
            <StaffPinGate
              title="Modo En Vivo (Caja POS + App)"
              subtitle="Ingresa el PIN de cajero para operar la Terminal POS conectada en tiempo real."
              expectedPin={config.staffPin || '1234'}
              onSuccess={handleUnlockStaff}
            />
          ))}
        {currentView === 'APP_MOBILE' && <CustomerMobileApp />}
        {currentView === 'POS' &&
          (isStaffUnlocked ? (
            <PosTerminal />
          ) : (
            <StaffPinGate
              title="Terminal de Caja POS Protegida"
              subtitle="Ingresa el PIN de cajero para registrar consumos o redimir premios."
              expectedPin={config.staffPin || '1234'}
              onSuccess={handleUnlockStaff}
            />
          ))}
        {currentView === 'BACKOFFICE' &&
          (isStaffUnlocked ? (
            <BackofficeView onGoToPOSWithClient={handleGoToPOSWithClient} />
          ) : (
            <StaffPinGate
              title="Panel de Administración Protegido"
              subtitle="Ingresa el PIN administrativo para gestionar clientes, premios y ajustes."
              expectedPin={config.staffPin || '1234'}
              onSuccess={handleUnlockStaff}
            />
          ))}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800">Submigueleños</span>
            <span aria-hidden="true">·</span>
            <span>Sistema de Fidelización para Restaurantes</span>
            <span aria-hidden="true">·</span>
            <span>{config.restaurantName}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isServerConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{isServerConnected ? 'Producción Conectada' : 'Modo Local'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>Turno activo: {config.currentCashier}</span>
            {isStaffUnlocked && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={handleLockStaff}
                  className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-semibold cursor-pointer"
                  title="Bloquear Caja POS y Administración con PIN"
                >
                  <Lock className="w-3 h-3" />
                  <span>Bloquear Turno</span>
                </button>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>Versión 3.0 Producción</span>
          </div>
        </div>
      </footer>

      {/* Active Thermal Receipt Modal */}
      <ReceiptModal transaction={activeReceipt} onClose={closeReceipt} />

      {/* Quick New Client Global Modal */}
      {showGlobalNewClient && (
        <NewClientModal onClose={() => setShowGlobalNewClient(false)} />
      )}

      {/* Android Download & QR Modal */}
      {showAndroidModal && (
        <AndroidInstallModal
          onClose={() => setShowAndroidModal(false)}
          onLaunchNativeView={() => setIsNativeAndroidMode(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LoyaltyProvider>
      <LoyaltyAppContent />
    </LoyaltyProvider>
  );
}
