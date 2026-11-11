import React from 'react';
import { PosTerminal } from '../pos/PosTerminal';
import { CustomerMobileApp } from '../customer/CustomerMobileApp';
import { Sparkles, ArrowRightLeft, Smartphone, Monitor, ShieldCheck, Zap } from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';

export const LiveSyncView: React.FC = () => {
  const { config, selectedClient } = useLoyalty();

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Informative Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white p-5 rounded-3xl border border-neutral-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight">
                Simulador Conectado en Tiempo Real (Caja POS + App del Cliente)
              </h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Sincronizado en Vivo
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Prueba acumular o redimir puntos en la <strong>Caja (derecha)</strong> y observa cómo la{' '}
              <strong>App en el Celular del comensal (izquierda)</strong> se actualiza al instante con notificación y nuevo saldo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-400 bg-neutral-900/80 px-4 py-2 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>App Comensal</span>
          </div>
          <ArrowRightLeft className="w-3.5 h-3.5 text-neutral-600" />
          <div className="flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Caja POS Restaurante</span>
          </div>
        </div>
      </div>

      {/* Split Grid: Left (Smartphone App) | Right (Cashier POS) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Customer Mobile App Screen */}
        <div className="xl:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm mb-2 flex items-center justify-between text-xs text-neutral-600 font-semibold px-2">
            <span className="flex items-center gap-1.5 text-neutral-900 font-bold">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Teléfono del Cliente</span>
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              Cliente activo: {selectedClient?.name.split(' ')[0]}
            </span>
          </div>

          <CustomerMobileApp isEmbedded={true} />
        </div>

        {/* RIGHT COLUMN: Restaurant Cashier POS Terminal */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-600 font-semibold px-2">
            <span className="flex items-center gap-1.5 text-neutral-900 font-bold">
              <Monitor className="w-4 h-4 text-emerald-600" />
              <span>Terminal de Caja del Restaurante (POS)</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">
              ● Enlace con Base de Datos Activo
            </span>
          </div>

          <div className="bg-neutral-50/70 p-1 rounded-3xl border border-neutral-200 shadow-xs">
            <PosTerminal />
          </div>
        </div>
      </div>
    </div>
  );
};
