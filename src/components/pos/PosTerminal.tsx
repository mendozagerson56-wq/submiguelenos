import React, { useState } from 'react';
import {
  Search,
  Scan,
  UserPlus,
  Coins,
  Gift,
  ArrowRight,
  Sparkles,
  Check,
  User,
  Phone,
  Flame,
  Delete,
  AlertCircle,
  HelpCircle,
  Tag,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Client, Reward } from '../../types';
import { RewardIcon } from '../common/RewardIcon';
import { NewClientModal } from './NewClientModal';
import { QrScannerModal } from './QrScannerModal';

export const PosTerminal: React.FC = () => {
  const {
    clients,
    rewards,
    config,
    campaigns,
    selectedClient,
    setSelectedClient,
    accumulatePoints,
    redeemReward,
    redeemCustomDiscount,
    findClientByPhoneOrName,
  } = useLoyalty();

  // Search & Modals state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // POS Operation Mode: 'ACUMULAR' (earn) | 'REDIMIR' (spend)
  const [activeTab, setActiveTab] = useState<'ACUMULAR' | 'REDIMIR'>('ACUMULAR');

  // Accumulate Mode State
  const [billAmount, setBillAmount] = useState<string>('');
  const [tableOrNotes, setTableOrNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Redeem Mode State
  const [rewardCategoryFilter, setRewardCategoryFilter] = useState<string>('TODOS');
  const [customDiscountPoints, setCustomDiscountPoints] = useState<number>(100);

  // Active campaign multiplier
  const activeCampaign = campaigns.find((c) => c.isActive && c.multiplier > 1);
  const multiplier = activeCampaign ? activeCampaign.multiplier : 1;

  // Filtered search results
  const searchResults = searchQuery.trim() ? findClientByPhoneOrName(searchQuery) : [];

  // Computed points for accumulation
  const numericBill = parseFloat(billAmount) || 0;
  const computedPoints = Math.max(
    0,
    Math.round((numericBill / (config.spendPerPoint || 1000)) * multiplier)
  );

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery('');
    setIsSearchFocused(false);
    setErrorMessage('');
  };

  // Quick preset bill buttons (scaled to restaurant currency rate)
  const presets = [
    { label: `${config.currencySymbol}25.000`, value: 25000 },
    { label: `${config.currencySymbol}50.000`, value: 50000 },
    { label: `${config.currencySymbol}80.000`, value: 80000 },
    { label: `${config.currencySymbol}120.000`, value: 120000 },
  ];

  // Submit points accumulation
  const handleConfirmAccumulation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!selectedClient) {
      setErrorMessage('Selecciona o busca un cliente primero.');
      return;
    }

    if (numericBill <= 0) {
      setErrorMessage('Ingresa el monto de la cuenta consumida.');
      return;
    }

    const note = tableOrNotes ? `Mesa: ${tableOrNotes}` : undefined;
    const result = accumulatePoints(selectedClient.id, numericBill, undefined, note);

    if (result.success) {
      setBillAmount('');
      setTableOrNotes('');
    } else if (result.error) {
      setErrorMessage(result.error);
    }
  };

  // Submit reward redemption
  const handleRedeemReward = (reward: Reward) => {
    setErrorMessage('');
    if (!selectedClient) {
      setErrorMessage('Selecciona un cliente para redimir.');
      return;
    }

    const result = redeemReward(selectedClient.id, reward, `Canje en caja`);
    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  // Submit custom points discount
  const handleRedeemDiscount = () => {
    setErrorMessage('');
    if (!selectedClient) {
      setErrorMessage('Selecciona un cliente para redimir.');
      return;
    }

    // Example: 100 points = $10.000 discount (based on spendPerPoint * 10 or 100)
    const discountMoney = customDiscountPoints * 100;
    const result = redeemCustomDiscount(
      selectedClient.id,
      customDiscountPoints,
      discountMoney,
      `Descuento aplicado en cuenta`
    );

    if (!result.success && result.error) {
      setErrorMessage(result.error);
    }
  };

  // Numeric Keypad handler for fast register use
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setBillAmount('');
    } else if (val === 'BACK') {
      setBillAmount((prev) => prev.slice(0, -1));
    } else {
      setBillAmount((prev) => prev + val);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Search & Customer Lookup Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente por teléfono celular o nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-xl text-sm focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-sans"
            />

            {/* Live Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-neutral-200 max-h-72 overflow-y-auto z-40 p-2 space-y-1">
                {searchResults.length > 0 ? (
                  searchResults.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/80 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-neutral-900 group-hover:text-amber-900 truncate">
                            {client.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-mono">
                            {client.phone} · Nivel {client.tier}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-amber-600 tabular-nums">
                          {client.points} pts
                        </span>
                        <span className="block text-[10px] text-neutral-400">
                          {client.totalVisits} visitas
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-xs text-neutral-500">
                      No encontramos ningún cliente con &quot;{searchQuery}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchFocused(false);
                        setShowNewClientModal(true);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Registrar como nuevo cliente ahora</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowScannerModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors border border-neutral-200"
              title="Escanear tarjeta QR del cliente"
            >
              <Scan className="w-4 h-4 text-neutral-600" />
              <span>Escanear QR</span>
            </button>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Quick frequent clients strip */}
        {!selectedClient && (
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-2 overflow-x-auto text-xs text-neutral-500">
            <span className="shrink-0 text-[11px] font-medium text-neutral-400">Atender rápido:</span>
            {clients.slice(0, 4).map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectClient(c)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-amber-100 hover:text-amber-900 transition-colors text-neutral-700 font-medium"
              >
                {c.name.split(' ')[0]} ({c.points} pts)
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Terminal Grid: Left (Customer Profile & Stats) | Right (Operation Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Status Card */}
        <div className="lg:col-span-5 space-y-4">
          {selectedClient ? (
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs relative overflow-hidden">
              {/* Header with Tier styling */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-base leading-tight">
                      {selectedClient.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 font-mono">
                      <span>{selectedClient.phone}</span>
                      <span>·</span>
                      <span className="font-sans font-semibold text-amber-700">
                        Nivel {selectedClient.tier}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-700 font-medium py-1 px-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  Cambiar
                </button>
              </div>

              {/* Main Points Balance Display */}
              <div className="mt-5 p-4 rounded-xl bg-neutral-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                    Saldo de Puntos Disponible
                  </span>
                  <div className="text-3xl font-extrabold tracking-tight font-sans text-amber-400 tabular-nums">
                    {selectedClient.points}{' '}
                    <span className="text-sm font-semibold text-neutral-300">puntos</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-400 block">Equivalente aprox:</span>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums">
                    ~{config.currencySymbol}
                    {(selectedClient.points * 100).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Progress to Next Tier */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Progreso de fidelización</span>
                  <span className="font-semibold text-neutral-800">
                    {selectedClient.points >= 500
                      ? 'Nivel Máximo (Diamante)'
                      : `${selectedClient.points} / ${
                          selectedClient.points < 150
                            ? 150
                            : selectedClient.points < 350
                            ? 350
                            : 500
                        } pts`}
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedClient.points /
                          (selectedClient.points < 150
                            ? 150
                            : selectedClient.points < 350
                            ? 350
                            : 500)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Customer Stats Strip */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-100 text-xs">
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-500 block text-[11px]">Total visitas</span>
                  <span className="font-bold text-neutral-800 tabular-nums">
                    {selectedClient.totalVisits} visitas al local
                  </span>
                </div>
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100">
                  <span className="text-neutral-500 block text-[11px]">Consumo acumulado</span>
                  <span className="font-bold text-neutral-800 tabular-nums">
                    {config.currencySymbol}{selectedClient.totalSpent.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Customer Notes / Preferences */}
              {selectedClient.notes && (
                <div className="mt-3 p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                  <span className="font-semibold text-[11px] block text-amber-700">Nota del comensal:</span>
                  <p className="mt-0.5">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          ) : (
            /* Empty State for client selection */
            <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-neutral-900 text-sm">Ningún Cliente Seleccionado</h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Busca arriba por celular para comenzar a acumular o redimir puntos de este consumo.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowNewClientModal(true)}
                  className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors"
                >
                  Registrar Cliente Rápido
                </button>
              </div>
            </div>
          )}

          {/* Active Campaigns Banner in POS */}
          {activeCampaign && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-900">{activeCampaign.title}</span>
                  <span className="bg-amber-600 text-white px-1.5 py-0.2 rounded font-bold text-[10px]">
                    {activeCampaign.badge}
                  </span>
                </div>
                <p className="text-amber-800/80 text-[11px] mt-0.5">{activeCampaign.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Operation Terminal (Acumular / Redimir) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
            {/* Operation Mode Tabs */}
            <div className="p-2 bg-neutral-100/80 border-b border-neutral-200 flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('ACUMULAR');
                  setErrorMessage('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ACUMULAR'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
              >
                <Coins className={`w-4 h-4 ${activeTab === 'ACUMULAR' ? 'text-emerald-600' : ''}`} />
                <span>Acumular Puntos (Consumo)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('REDIMIR');
                  setErrorMessage('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'REDIMIR'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
              >
                <Gift className={`w-4 h-4 ${activeTab === 'REDIMIR' ? 'text-amber-600' : ''}`} />
                <span>Gastar / Redimir Puntos</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB 1: ACUMULAR PUNTOS */}
            {activeTab === 'ACUMULAR' && (
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Monto Total de la Cuenta del Restaurante ({config.currencySymbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-neutral-400">
                      {config.currencySymbol}
                    </span>
                    <input
                      type="number"
                      placeholder="0"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border-2 border-neutral-200 focus:border-emerald-500 rounded-xl text-2xl font-bold text-neutral-900 focus:outline-hidden tabular-nums transition-all"
                    />
                  </div>

                  {/* Preset Amount Badges */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-neutral-400">Rápido:</span>
                    {presets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setBillAmount(p.value.toString())}
                        className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Computed Points Callout */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-950 block">
                      Puntos a Asignar en esta Visita:
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Regla: 1 punto por cada {config.currencySymbol}
                      {config.spendPerPoint.toLocaleString('es-CO')} consumidos
                      {multiplier > 1 && ` (×${multiplier} por promo activa)`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-emerald-700 font-sans tabular-nums">
                      +{computedPoints}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 block">PUNTOS</span>
                  </div>
                </div>

                {/* Table or notes field */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Número de Mesa / Comentario (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Mesa 6, Barra, Almuerzo con amigos..."
                    value={tableOrNotes}
                    onChange={(e) => setTableOrNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Touch Keypad */}
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/80">
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '00', 'CLEAR'].map(
                      (key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeypadPress(key)}
                          className="py-2 bg-white hover:bg-neutral-100 active:bg-neutral-200 border border-neutral-200 rounded-lg text-sm font-bold text-neutral-800 shadow-2xs transition-colors"
                        >
                          {key === 'CLEAR' ? 'C' : key}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Big Confirm CTA */}
                <button
                  type="button"
                  onClick={() => handleConfirmAccumulation()}
                  disabled={!selectedClient || numericBill <= 0}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                    selectedClient && numericBill > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.99]'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    Confirmar y Acumular (+{computedPoints} pts)
                  </span>
                </button>
              </div>
            )}

            {/* TAB 2: REDIMIR / GASTAR PUNTOS */}
            {activeTab === 'REDIMIR' && (
              <div className="p-5 space-y-5">
                {/* Category Filters for Rewards */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {['TODOS', 'Bebidas', 'Entradas', 'Platos Fuertes', 'Postres', 'Descuentos'].map(
                    (cat) => (
                      <button
                        key={cat}
                        onClick={() => setRewardCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          rewardCategoryFilter === cat
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>

                {/* Rewards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {rewards
                    .filter((r) => r.isActive)
                    .filter(
                      (r) =>
                        rewardCategoryFilter === 'TODOS' || r.category === rewardCategoryFilter
                    )
                    .map((reward) => {
                      const canAfford = selectedClient
                        ? selectedClient.points >= reward.pointsRequired
                        : false;
                      const pointsNeeded = selectedClient
                        ? Math.max(0, reward.pointsRequired - selectedClient.points)
                        : reward.pointsRequired;

                      return (
                        <div
                          key={reward.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                            canAfford
                              ? 'bg-white border-neutral-300 hover:border-amber-400 hover:shadow-xs'
                              : 'bg-neutral-50/70 border-neutral-200 opacity-75'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                                <RewardIcon name={reward.iconName} className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80 tabular-nums">
                                {reward.pointsRequired} pts
                              </span>
                            </div>
                            <h4 className="font-bold text-neutral-900 text-xs mt-2 leading-tight">
                              {reward.name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                              {reward.description}
                            </p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                            <span className="text-[10px] text-neutral-400">
                              Val: {config.currencySymbol}{reward.estimatedValue.toLocaleString('es-CO')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRedeemReward(reward)}
                              disabled={!canAfford}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                canAfford
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-2xs active:scale-95'
                                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed text-[11px]'
                              }`}
                            >
                              {canAfford ? 'Canjear' : `Faltan ${pointsNeeded}p`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Direct Custom Discount Box */}
                <div className="p-4 bg-amber-50/80 border border-amber-300/80 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-950">
                        O Redimir Puntos por Descuento en Dinero
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      -{config.currencySymbol}
                      {(customDiscountPoints * 100).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[50, 100, 150, 200].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setCustomDiscountPoints(pts)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          customDiscountPoints === pts
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-amber-100'
                        }`}
                      >
                        {pts} pts
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleRedeemDiscount}
                    disabled={!selectedClient || selectedClient.points < customDiscountPoints}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                      selectedClient && selectedClient.points >= customDiscountPoints
                        ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-2xs'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    Aplicar Descuento de {config.currencySymbol}
                    {(customDiscountPoints * 100).toLocaleString('es-CO')} (-{customDiscountPoints} pts)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewClientModal && (
        <NewClientModal
          initialPhone={searchQuery}
          onClose={() => setShowNewClientModal(false)}
        />
      )}

      {showScannerModal && (
        <QrScannerModal
          onClose={() => setShowScannerModal(false)}
          onSelectClient={handleSelectClient}
        />
      )}
    </div>
  );
};
