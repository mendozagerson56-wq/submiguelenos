import React from 'react';
import { Flame, UserPlus, Smartphone } from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';

export type MainViewMode = 'APP_MOBILE' | 'POS' | 'BACKOFFICE' | 'LIVE_SYNC';

interface NavbarProps {
  currentView: MainViewMode;
  onSelectView: (view: MainViewMode) => void;
  onOpenNewClient: () => void;
  onOpenAndroidInstall: () => void;
  isStaffUnlocked?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenNewClient,
  onOpenAndroidInstall,
  isStaffUnlocked = false,
}) => {
  const { config, isServerConnected } = useLoyalty();

  return (
    <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onSelectView('APP_MOBILE')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-extrabold shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-neutral-900 block leading-tight">
                Submigueleños
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-medium block truncate max-w-[140px] sm:max-w-xs">
              Fidelización &amp; Recompensas
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single Line, 4 Views) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => onSelectView('LIVE_SYNC')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentView === 'LIVE_SYNC'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/70'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚡ En Vivo (Caja + App)</span>
          </button>

          <button
            onClick={() => onSelectView('APP_MOBILE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              currentView === 'APP_MOBILE'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <span>📱 App del Cliente</span>
          </button>

          <button
            onClick={() => onSelectView('POS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              currentView === 'POS'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <span>🛎️ Caja POS</span>
          </button>

          <button
            onClick={() => onSelectView('BACKOFFICE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              currentView === 'BACKOFFICE'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <span>📊 Backoffice</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenAndroidInstall}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            title="Descargar o instalar la App en Android"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar en Android</span>
            <span className="sm:hidden">Android</span>
          </button>

          {isStaffUnlocked && (
            <button
              onClick={onOpenNewClient}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Cliente</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

