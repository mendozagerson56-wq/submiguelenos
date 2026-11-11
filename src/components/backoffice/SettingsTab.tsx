import React, { useState } from 'react';
import {
  Settings,
  Store,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  Save,
  Check,
  AlertTriangle,
  Gift,
  Coins,
  Lock,
  Trash2,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';

export const SettingsTab: React.FC = () => {
  const { config, campaigns, updateConfig, toggleCampaign, resetAllData, clearDemoDataForProduction } =
    useLoyalty();

  const [restaurantName, setRestaurantName] = useState(config.restaurantName);
  const [tagline, setTagline] = useState(config.tagline);
  const [phone, setPhone] = useState(config.phone);
  const [address, setAddress] = useState(config.address);
  const [spendPerPoint, setSpendPerPoint] = useState(config.spendPerPoint.toString());
  const [welcomeBonusPoints, setWelcomeBonusPoints] = useState(config.welcomeBonusPoints.toString());
  const [birthdayBonusPoints, setBirthdayBonusPoints] = useState(config.birthdayBonusPoints.toString());
  const [currentCashier, setCurrentCashier] = useState(config.currentCashier);
  const [enableSound, setEnableSound] = useState(config.enableSoundEffects);
  const [staffPin, setStaffPin] = useState(config.staffPin || '1234');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearDemoConfirm, setShowClearDemoConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      restaurantName: restaurantName.trim(),
      tagline: tagline.trim(),
      phone: phone.trim(),
      address: address.trim(),
      spendPerPoint: parseInt(spendPerPoint, 10) || 1000,
      welcomeBonusPoints: parseInt(welcomeBonusPoints, 10) || 50,
      birthdayBonusPoints: parseInt(birthdayBonusPoints, 10) || 100,
      currentCashier: currentCashier.trim(),
      enableSoundEffects: enableSound,
      staffPin: staffPin.trim() || '1234',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Restaurant Identity Card */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Store className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-neutral-900">
              Datos del Restaurante
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Nombre Comercial del Restaurante
              </label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Eslogan o Subtítulo
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Teléfono para Clientes
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Dirección / Sede
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Loyalty Rules & Conversion Formula */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Coins className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-neutral-900">
              Reglas de Acumulación y Bonos (Submigueleños)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Consumo por cada 1 Punto ({config.currencySymbol})
              </label>
              <input
                type="number"
                min="1"
                required
                value={spendPerPoint}
                onChange={(e) => setSpendPerPoint(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono font-bold"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Ej: Si pones 1000, una cuenta de $50.000 otorga 50 puntos.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Bono de Bienvenida al Registrarse
              </label>
              <input
                type="number"
                min="0"
                required
                value={welcomeBonusPoints}
                onChange={(e) => setWelcomeBonusPoints(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono font-bold"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Puntos obsequio iniciales para incentivar el retorno.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Bono de Cumpleaños
              </label>
              <input
                type="number"
                min="0"
                required
                value={birthdayBonusPoints}
                onChange={(e) => setBirthdayBonusPoints(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono font-bold"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Puntos asignados durante el mes de cumpleaños.
              </p>
            </div>
          </div>
        </div>

        {/* Campaigns & Multipliers */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Flame className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-neutral-900">
              Campañas de Fidelización Activas
            </h3>
          </div>

          <div className="space-y-3">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => toggleCampaign(camp.id)}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  camp.isActive
                    ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-600 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">{camp.title}</span>
                    <span className="text-[10px] font-bold bg-amber-600 text-white px-1.5 py-0.2 rounded">
                      {camp.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{camp.description}</p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-md ${
                    camp.isActive ? 'bg-amber-600 text-white' : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {camp.isActive ? 'Activa' : 'Pausada'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cashier & Security PIN Settings */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Lock className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-neutral-900">
              Seguridad de Caja POS y Administración (PIN de Personal)
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Nombre del Cajero / Turno en Terminal
              </label>
              <input
                type="text"
                value={currentCashier}
                onChange={(e) => setCurrentCashier(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                PIN de Seguridad (Cajero y Admin)
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                required
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono font-bold tracking-widest"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Protege Caja POS y Administración en producción (Por defecto: 1234).
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center gap-2">
                {enableSound ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                )}
                <div>
                  <span className="font-semibold text-neutral-900 block">Efectos de Sonido</span>
                  <span className="text-[11px] text-neutral-500">
                    Sonido al acumular o redimir puntos
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSound}
                onChange={(e) => setEnableSound(e.target.checked)}
                className="w-4 h-4 accent-amber-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>¡Cambios guardados correctamente!</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearDemoConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold transition-colors border border-amber-300 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Clientes de Prueba (Iniciar en Cero)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors border border-rose-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Datos Demo</span>
            </button>
          </div>
        </div>
      </form>

      {/* Clear Demo Data for Production Modal */}
      {showClearDemoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-neutral-900 text-sm">
                ¿Iniciar Base de Datos en Cero para Producción?
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Se eliminarán todos los clientes y transacciones de prueba para recibir únicamente clientes reales de <strong>Submigueleños</strong>. Tus premios, campañas y ajustes se conservarán.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowClearDemoConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  clearDemoDataForProduction();
                  setShowClearDemoConfirm(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Sí, Vaciar Clientes Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-neutral-900 text-sm">
                ¿Restablecer a Datos Iniciales?
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Esto restaurará los clientes, premios y transacciones de demostración iniciales de Submigueleños.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-xs"
              >
                Sí, Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
