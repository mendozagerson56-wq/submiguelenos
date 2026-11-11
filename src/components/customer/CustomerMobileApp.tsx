import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Sparkles,
  Award,
  Gift,
  Coffee,
  ShoppingBag,
  History,
  User,
  Bell,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  Ticket,
  ExternalLink,
  Phone,
  LogOut,
  Tag,
  Star,
  Copy,
  Check,
  Download,
  Smartphone,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLoyalty } from '../../context/LoyaltyContext';
import { RewardIcon } from '../common/RewardIcon';
import { RealQrCode } from '../common/RealQrCode';
import { Client, Reward } from '../../types';

const MOBILE_AUTH_STORAGE_KEY = 'submiguelenos_mobile_registered_client_v1';

const FALLBACK_EMPTY_CLIENT: Client = {
  id: 'cli-pending',
  name: 'Nuevo Comensal',
  phone: '0000000000',
  email: '',
  points: 0,
  tier: 'Bronce',
  totalSpent: 0,
  totalVisits: 0,
  createdAt: new Date().toISOString(),
  lastVisit: new Date().toISOString(),
};

interface CustomerMobileAppProps {
  isEmbedded?: boolean;
  isNativeFullscreen?: boolean;
  onExitNativeFullscreen?: () => void;
}

export const CustomerMobileApp: React.FC<CustomerMobileAppProps> = ({
  isEmbedded = false,
  isNativeFullscreen = false,
  onExitNativeFullscreen,
}) => {
  const {
    clients,
    rewards,
    transactions,
    config,
    selectedClient,
    setSelectedClient,
    redeemReward,
    registerClient,
    canInstallAndroid,
    isAndroidStandalone,
    installAndroidApp,
  } = useLoyalty();

  // Persistent registration check: if user hasn't registered on this APK/App, always ask on open
  const [registeredClientId, setRegisteredClientId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(MOBILE_AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Fast Gmail Registration / Sign-in state
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [showGoogleAccountSheet, setShowGoogleAccountSheet] = useState(false);

  // Active client in mobile app
  const [currentClient, setCurrentClient] = useState<Client>(() => {
    if (registeredClientId) {
      const saved = clients.find((c) => c.id === registeredClientId);
      if (saved) return saved;
    }
    return selectedClient || clients[0] || FALLBACK_EMPTY_CLIENT;
  });
  const [mobileTab, setMobileTab] = useState<'HOME' | 'REWARDS' | 'HISTORY' | 'PROFILE'>('HOME');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedRewardToClaim, setSelectedRewardToClaim] = useState<Reward | null>(null);
  const [activeCoupon, setActiveCoupon] = useState<{ reward: Reward; code: string } | null>(null);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [phoneLoginInput, setPhoneLoginInput] = useState('');
  const [phoneLoginError, setPhoneLoginError] = useState('');

  // Verify registered client still exists in clients list
  const isUserRegisteredOnDevice = Boolean(
    registeredClientId && clients.some((c) => c.id === registeredClientId)
  );

  // Keep in sync when selectedClient changes from outside
  useEffect(() => {
    if (selectedClient && selectedClient.id !== currentClient.id) {
      setCurrentClient(selectedClient);
    }
  }, [selectedClient]);

  // Keep current client in sync with Context updates (e.g. when cashier adds points!)
  useEffect(() => {
    const updated = clients.find((c) => c.id === currentClient.id);
    if (updated) {
      if (updated.points !== currentClient.points) {
        const delta = updated.points - currentClient.points;
        if (delta > 0) {
          setNotificationBanner(`¡Recibiste +${delta} puntos por tu consumo en ${config.restaurantName}! 🎉`);
        } else {
          setNotificationBanner(`¡Canjeaste un beneficio en ${config.restaurantName}! 🎁`);
        }
        setTimeout(() => setNotificationBanner(null), 6000);
      }
      setCurrentClient(updated);
    }
  }, [clients, currentClient.id, config.restaurantName]);

  const clientTransactions = transactions.filter((t) => t.clientId === currentClient.id);

  // Tier rules
  const tierColor =
    currentClient.tier === 'Diamante'
      ? 'from-indigo-900 via-slate-900 to-indigo-950 border-indigo-500/50 text-indigo-300'
      : currentClient.tier === 'Oro'
      ? 'from-amber-900 via-stone-900 to-amber-950 border-amber-500/50 text-amber-300'
      : currentClient.tier === 'Plata'
      ? 'from-zinc-800 via-neutral-900 to-zinc-900 border-slate-400/40 text-slate-300'
      : 'from-amber-950/80 via-neutral-900 to-neutral-950 border-amber-700/40 text-amber-200';

  const nextTierPoints =
    currentClient.points < 150 ? 150 : currentClient.points < 350 ? 350 : 500;
  const nextTierName =
    currentClient.points < 150 ? 'Plata' : currentClient.points < 350 ? 'Oro' : 'Diamante';
  const progressPercent = Math.min(100, Math.round((currentClient.points / nextTierPoints) * 100));

  const handleClaimRewardFromApp = (reward: Reward) => {
    const code = `SUBM-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = redeemReward(
      currentClient.id,
      reward,
      `Cupón App Móvil [${code}] - Mostrar código en caja`
    );
    if (res.success) {
      setActiveCoupon({ reward, code });
      setSelectedRewardToClaim(null);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleCopyCode = () => {
    if (activeCoupon) {
      navigator.clipboard?.writeText(activeCoupon.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handlePhoneLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoginError('');
    const clean = phoneLoginInput.replace(/[\s-]/g, '');
    const found = clients.find((c) => c.phone.replace(/[\s-]/g, '') === clean);
    if (found) {
      setCurrentClient(found);
      setSelectedClient(found);
      setRegisteredClientId(found.id);
      try {
        localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, found.id);
      } catch {
        // Ignore storage error
      }
      setPhoneLoginInput('');
      setNotificationBanner(`¡Bienvenido de nuevo, ${found.name.split(' ')[0]}!`);
      setTimeout(() => setNotificationBanner(null), 4000);
    } else {
      setPhoneLoginError('No encontramos ese número. Pide en caja tu registro rápido.');
    }
  };

  // Auto-fill name and phone if user types an email that already belongs to a client
  const handleEmailInputChange = (val: string) => {
    setRegEmail(val);
    setRegError('');
    const cleanVal = val.trim().toLowerCase();
    if (cleanVal.includes('@')) {
      const existing = clients.find((c) => c.email && c.email.trim().toLowerCase() === cleanVal);
      if (existing) {
        if (!regName) setRegName(existing.name);
        if (!regPhone) setRegPhone(existing.phone);
      }
    }
  };

  // Complete fast registration / login with Gmail
  const handleCompleteGmailRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    let normalizedEmail = regEmail.trim().toLowerCase();
    if (normalizedEmail && !normalizedEmail.includes('@')) {
      normalizedEmail = `${normalizedEmail}@gmail.com`;
      setRegEmail(normalizedEmail);
    }

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setRegError('Ingresa tu correo de Gmail o cuenta de Google Play Store.');
      return;
    }

    const cleanPhone = regPhone.trim().replace(/[\s-]/g, '');

    // Check if client already exists by Gmail or Phone
    const existingByEmail = clients.find(
      (c) => c.email && c.email.trim().toLowerCase() === normalizedEmail
    );
    const existingByPhone = cleanPhone
      ? clients.find((c) => c.phone.replace(/[\s-]/g, '') === cleanPhone)
      : undefined;

    const existingClient = existingByEmail || existingByPhone;

    if (existingClient) {
      setCurrentClient(existingClient);
      setSelectedClient(existingClient);
      setRegisteredClientId(existingClient.id);
      try {
        localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, existingClient.id);
      } catch {
        // Ignore storage error
      }
      setNotificationBanner(`¡Bienvenido de vuelta, ${existingClient.name.split(' ')[0]}! 🎉`);
      setTimeout(() => setNotificationBanner(null), 5000);
      return;
    }

    // New customer registration
    const finalName =
      regName.trim() ||
      normalizedEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    if (!cleanPhone || cleanPhone.length < 7) {
      setRegError('Ingresa tu número de celular para identificar tus puntos en caja.');
      return;
    }

    const newClient = registerClient({
      name: finalName,
      phone: cleanPhone,
      email: normalizedEmail,
      birthDate: '',
      notes: 'Registrado desde APK Android con cuenta de Gmail / Google Play',
      initialPointsBonus: true,
    });

    setCurrentClient(newClient);
    setSelectedClient(newClient);
    setRegisteredClientId(newClient.id);
    try {
      localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, newClient.id);
    } catch {
      // Ignore storage error
    }
    setNotificationBanner(
      `¡Registro exitoso con Gmail! Recibiste +${config.welcomeBonusPoints} pts de bienvenida 🎉`
    );
    setTimeout(() => setNotificationBanner(null), 6000);
  };

  // 1-Tap Quick Google Account selection from Play Store sheet
  const handleSelectQuickGoogleAccount = (client: Client) => {
    setCurrentClient(client);
    setSelectedClient(client);
    setRegisteredClientId(client.id);
    try {
      localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, client.id);
    } catch {
      // Ignore storage error
    }
    setShowGoogleAccountSheet(false);
    setNotificationBanner(`¡Conectado como ${client.email || client.name}! 🎉`);
    setTimeout(() => setNotificationBanner(null), 4500);
  };

  // Sign out to test mandatory registration on APK/App reopen
  const handleLogoutDevice = () => {
    setRegisteredClientId(null);
    try {
      localStorage.removeItem(MOBILE_AUTH_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
    setRegEmail('');
    setRegName('');
    setRegPhone('');
    setRegError('');
    setMobileTab('HOME');
  };

  return (
    <div
      className={
        isNativeFullscreen
          ? 'min-h-screen w-full bg-neutral-950 flex flex-col items-center justify-start'
          : `flex flex-col items-center justify-center ${isEmbedded ? '' : 'py-6 px-4'}`
      }
    >
      {/* Client Quick Switcher Bar (For testing different clients easily in desktop simulator) */}
      {!isEmbedded && !isNativeFullscreen && (
        <div className="mb-4 bg-white px-4 py-2.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500 font-medium">Comensal en el celular:</span>
          <select
            value={currentClient.id}
            onChange={(e) => {
              const selected = clients.find((c) => c.id === e.target.value);
              if (selected) {
                setCurrentClient(selected);
                setSelectedClient(selected);
                setRegisteredClientId(selected.id);
                try {
                  localStorage.setItem(MOBILE_AUTH_STORAGE_KEY, selected.id);
                } catch {
                  // Ignore storage error
                }
              }
            }}
            className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-lg font-semibold text-neutral-800 focus:outline-hidden focus:border-amber-500"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) - {c.points} pts [{c.tier}]
              </option>
            ))}
          </select>
          {isUserRegisteredOnDevice && (
            <button
              type="button"
              onClick={handleLogoutDevice}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
              title="Simular abrir la APK por primera vez sin haberse registrado"
            >
              <LogOut className="w-3 h-3" />
              <span>Probar Registro Inicial</span>
            </button>
          )}
        </div>
      )}

      {/* Smartphone Shell (or Native Fullscreen Container on Android) */}
      <div
        className={
          isNativeFullscreen
            ? 'relative w-full max-w-md min-h-screen bg-neutral-50 flex flex-col overflow-hidden shadow-2xl'
            : 'relative w-full max-w-[390px] h-[780px] bg-neutral-950 rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border-[6px] border-neutral-800 flex flex-col overflow-hidden'
        }
      >
        {/* Dynamic Island / Notch Speaker (only in simulator frame) */}
        {!isNativeFullscreen && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-900 rounded-full z-40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-neutral-950 mr-2" />
            <div className="w-2 h-2 rounded-full bg-indigo-900/40" />
          </div>
        )}

        {/* Mobile App Screen Frame */}
        <div
          className={
            isNativeFullscreen
              ? 'relative w-full flex-1 bg-neutral-50 flex flex-col'
              : 'relative w-full h-full bg-neutral-50 rounded-[40px] overflow-hidden flex flex-col'
          }
        >
          {/* iOS / Android Status Bar (only in simulator frame) */}
          {!isNativeFullscreen && (
            <div className="pt-3 px-6 pb-1 flex justify-between items-center text-[11px] font-bold text-neutral-800 z-30 select-none">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">5G</span>
                <div className="w-5 h-2.5 border border-neutral-800 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-neutral-800 rounded-2xs" />
                </div>
              </div>
            </div>
          )}

          {/* Live In-App Notification Banner */}
          {notificationBanner && (
            <div className="absolute top-10 inset-x-3 z-50 p-3 bg-neutral-900 text-white rounded-2xl shadow-xl border border-neutral-700 animate-in slide-in-from-top-4 duration-300 flex items-start gap-2.5">
              <Bell className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 animate-bounce" />
              <div className="flex-1 text-xs leading-snug">
                <span className="font-bold block text-amber-400 text-[11px]">Notificación Submigueleños</span>
                <p className="text-[11px] text-neutral-200 mt-0.5">{notificationBanner}</p>
              </div>
              <button
                onClick={() => setNotificationBanner(null)}
                className="text-neutral-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* App Header */}
          <div className="px-5 py-3 bg-white border-b border-neutral-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-2xs">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 leading-tight block">
                  {config.restaurantName}
                </span>
                <span className="text-[10px] text-neutral-400">Puntos & Recompensas</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {typeof window !== 'undefined' &&
                window.location.protocol !== 'file:' &&
                !isAndroidStandalone && (
                  <a
                    href="/api/download-apk"
                    download="Submiguelenos.apk"
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                    title="Descargar APK de Android"
                  >
                    <Download className="w-3 h-3" />
                    <span>APK</span>
                  </a>
                )}
              {isNativeFullscreen &&
                onExitNativeFullscreen &&
                typeof window !== 'undefined' &&
                window.location.protocol !== 'file:' && (
                  <button
                    onClick={onExitNativeFullscreen}
                    className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-[10px] font-semibold transition-colors"
                    title="Volver al Panel Principal"
                  >
                    Panel
                  </button>
                )}
              <button
                onClick={() => setShowQrModal(true)}
                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-neutral-700 transition-colors relative"
                title="Mostrar mi QR en caja"
              >
                <QrCode className="w-4 h-4 text-amber-600" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pb-20 px-4 pt-3 space-y-4">
            {/* SCREEN 1: HOME */}
            {mobileTab === 'HOME' && (
              <>
                {/* Direct APK Download Banner (visible when browsing on web/Wi-Fi, hidden inside installed APK) */}
                {typeof window !== 'undefined' &&
                  window.location.protocol !== 'file:' &&
                  !isAndroidStandalone && (
                    <div className="p-3 rounded-2xl bg-neutral-900 text-white flex items-center justify-between gap-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold block">Instala Submigueleños en Android</span>
                          <span className="text-neutral-400 text-[10px]">
                            Descarga directa del instalador oficial
                          </span>
                        </div>
                      </div>
                      <a
                        href="/api/download-apk"
                        download="Submiguelenos.apk"
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-[10px] rounded-xl shrink-0 transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descargar APK</span>
                      </a>
                    </div>
                  )}
                {/* User Greeting */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-neutral-500 font-medium">¡Hola comensal!</span>
                    <h2 className="text-base font-extrabold text-neutral-900 leading-tight">
                      {currentClient.name.split(' ')[0]} 👋
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Nivel {currentClient.tier}
                    </span>
                  </div>
                </div>

                {/* Digital Loyalty Card */}
                <div
                  onClick={() => setShowQrModal(true)}
                  className={`p-4 rounded-3xl bg-gradient-to-br ${tierColor} text-white shadow-lg border relative overflow-hidden cursor-pointer group active:scale-[0.98] transition-all`}
                >
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />

                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold block">
                        Tarjeta de Puntos
                      </span>
                      <span className="font-extrabold text-xs tracking-tight">
                        {config.restaurantName}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 border border-white/10">
                      <QrCode className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="my-3 relative z-10">
                    <span className="text-[10px] text-neutral-300 block">Tus Puntos Disponibles</span>
                    <div className="text-3xl font-extrabold font-sans text-amber-400 tabular-nums leading-tight">
                      {currentClient.points}{' '}
                      <span className="text-xs font-semibold text-neutral-300">pts</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                      ≈ {config.currencySymbol}{(currentClient.points * 100).toLocaleString('es-CO')} en premios
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] relative z-10">
                    <span className="text-neutral-300">{currentClient.phone}</span>
                    <span className="font-semibold text-amber-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Toca para ver QR</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Tier Progress Bar */}
                <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-neutral-700 text-[11px]">
                      Nivel actual: {currentClient.tier}
                    </span>
                    <span className="font-mono font-bold text-amber-600 text-[11px]">
                      {currentClient.points} / {nextTierPoints} pts
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    {currentClient.points >= 500
                      ? '¡Eres nivel Diamante! Disfruta de la mejor tasa y regalos.'
                      : `Faltan ${nextTierPoints - currentClient.points} pts para subir a nivel ${nextTierName}.`}
                  </p>
                </div>

                {/* Quick Action Button: Present QR to Waiter */}
                <button
                  onClick={() => setShowQrModal(true)}
                  className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Presentar QR en Caja / Al Mesero</span>
                </button>

                {/* Unlocked Rewards Quick Carousel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-neutral-900">Premios para Ti Hoy</h3>
                    <button
                      onClick={() => setMobileTab('REWARDS')}
                      className="text-[11px] text-amber-600 font-semibold hover:underline"
                    >
                      Ver todos
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {rewards
                      .filter((r) => r.isActive && currentClient.points >= r.pointsRequired)
                      .slice(0, 4)
                      .map((reward) => (
                        <div
                          key={reward.id}
                          onClick={() => setSelectedRewardToClaim(reward)}
                          className="bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-1.5">
                              <RewardIcon name={reward.iconName} className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="font-bold text-[11px] text-neutral-900 leading-snug line-clamp-1">
                              {reward.name}
                            </h4>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-amber-600 tabular-nums">
                              {reward.pointsRequired} pts
                            </span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                              Canjear
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Active Promotions Teaser */}
                <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-3.5 rounded-2xl border border-amber-300/80 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900 block text-[11px]">
                      ¡Doble Puntos en Cenas!
                    </span>
                    <span className="text-[10px] text-neutral-600 block mt-0.5">
                      Acumula 2x en todas tus visitas después de las 6:00 PM.
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* SCREEN 2: REWARDS CATALOG */}
            {mobileTab === 'REWARDS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-neutral-900">Catálogo de Premios</h3>
                  <span className="text-[10px] text-amber-600 font-bold">
                    Saldo: {currentClient.points} pts
                  </span>
                </div>

                <div className="space-y-2">
                  {rewards
                    .filter((r) => r.isActive)
                    .map((reward) => {
                      const canAfford = currentClient.points >= reward.pointsRequired;
                      return (
                        <div
                          key={reward.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            canAfford
                              ? 'bg-white border-neutral-200/90 shadow-2xs'
                              : 'bg-neutral-50/70 border-neutral-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                              <RewardIcon name={reward.iconName} className="w-4 h-4" />
                            </div>
                            <div className="max-w-[170px]">
                              <h4 className="font-bold text-xs text-neutral-900 leading-snug">
                                {reward.name}
                              </h4>
                              <p className="text-[10px] text-neutral-500 line-clamp-1">
                                {reward.description}
                              </p>
                              <span className="text-[10px] font-bold text-amber-600 tabular-nums">
                                {reward.pointsRequired} pts
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedRewardToClaim(reward)}
                            disabled={!canAfford}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 ${
                              canAfford
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-2xs'
                                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Canjear' : `Faltan ${reward.pointsRequired - currentClient.points}p`}
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SCREEN 3: HISTORY */}
            {mobileTab === 'HISTORY' && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-neutral-900">Historial de Visitas</h3>
                {clientTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {clientTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3 bg-white rounded-2xl border border-neutral-200/80 shadow-2xs flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-neutral-900 block text-[11px]">
                            {tx.type === 'REDIMIR'
                              ? `🎁 Canje: ${tx.rewardName || 'Premio'}`
                              : tx.type === 'BONO'
                              ? '⭐ Bono Bienvenida'
                              : '🍽️ Consumo en Restaurante'}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(tx.timestamp).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            · {tx.ticketNumber}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-xs tabular-nums ${
                              tx.pointsDelta > 0 ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-400 text-xs">
                    No tienes visitas registradas aún.
                  </div>
                )}
              </div>
            )}

            {/* SCREEN 4: PROFILE */}
            {mobileTab === 'PROFILE' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-2xs text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xs">
                    {currentClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900">{currentClient.name}</h3>
                    <p className="text-xs text-neutral-500 font-mono">{currentClient.phone}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      Miembro Submigueleños {currentClient.tier}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-500">Correo Gmail / Google:</span>
                    <span className="text-neutral-800 font-medium">{currentClient.email || 'No registrado'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-neutral-500">Visitas al restaurante:</span>
                    <span className="text-neutral-800 font-bold tabular-nums">{currentClient.totalVisits}</span>
                  </div>
                </div>

                {/* Switch account by phone number */}
                <form
                  onSubmit={handlePhoneLogin}
                  className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-2xs space-y-2 text-xs"
                >
                  <label className="block font-bold text-neutral-800 text-[11px]">
                    ¿Cambiar de cuenta por celular?
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="tel"
                      placeholder="Ingresa tu número celular..."
                      value={phoneLoginInput}
                      onChange={(e) => setPhoneLoginInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-hidden focus:border-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-[11px] shrink-0"
                    >
                      Entrar
                    </button>
                  </div>
                  {phoneLoginError && (
                    <p className="text-[10px] text-rose-600 font-medium">{phoneLoginError}</p>
                  )}
                </form>

                {/* Sign out / Change Google Play Gmail Account */}
                <button
                  type="button"
                  onClick={handleLogoutDevice}
                  className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión / Cambiar correo de Gmail</span>
                </button>
              </div>
            )}
          </div>

          {/* MANDATORY FAST GMAIL / GOOGLE PLAY STORE REGISTRATION GATE */}
          {!isUserRegisteredOnDevice && (
            <div className="absolute inset-0 z-40 bg-neutral-950/98 backdrop-blur-md flex flex-col justify-between p-5 pt-11 pb-6 overflow-y-auto text-white animate-in fade-in duration-200">
              <div className="space-y-4">
                {/* Brand & Welcome Badge */}
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-600/30">
                    <Flame className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> +{config.welcomeBonusPoints} pts de regalo al registrarte
                    </span>
                    <h2 className="text-lg font-extrabold tracking-tight text-white mt-1.5">
                      Bienvenido a {config.restaurantName}
                    </h2>
                    <p className="text-[11px] text-neutral-400 leading-relaxed max-w-[270px] mx-auto">
                      Regístrate rápido con tu correo de <strong className="text-white">Gmail / Google Play Store</strong> para activar tu tarjeta digital y acumular puntos.
                    </p>
                  </div>
                </div>

                {/* 1-Tap Google Play Account Button */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowGoogleAccountSheet(!showGoogleAccountSheet)}
                    className="w-full py-2.5 px-4 bg-white hover:bg-neutral-100 text-neutral-900 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                      />
                    </svg>
                    <span>Continuar rápido con cuenta de Google</span>
                  </button>

                  {/* Quick Google Play Store Account Selector Sheet */}
                  {showGoogleAccountSheet && (
                    <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold px-1">
                        <span>Cuentas de Gmail asociadas:</span>
                        <button
                          type="button"
                          onClick={() => setShowGoogleAccountSheet(false)}
                          className="text-neutral-500 hover:text-white"
                        >
                          Cerrar
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {clients.slice(0, 3).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectQuickGoogleAccount(c)}
                            className="w-full p-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 flex items-center gap-2.5 text-left transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {c.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[11px] font-bold text-white block truncate">
                                {c.name}
                              </span>
                              <span className="text-[10px] text-neutral-400 block truncate">
                                {c.email || `${c.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-neutral-800"></div>
                  <span className="flex-shrink mx-2.5 text-[10px] text-neutral-500 uppercase font-semibold tracking-wider">
                    o ingresa tu Gmail de Play Store
                  </span>
                  <div className="flex-grow border-t border-neutral-800"></div>
                </div>

                {/* Fast Registration Form with Android Autofill support */}
                <form onSubmit={handleCompleteGmailRegistration} className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Correo de Gmail (Asociado a Google Play) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        placeholder="tucorreo@gmail.com"
                        value={regEmail}
                        onChange={(e) => handleEmailInputChange(e.target.value)}
                        className="w-full pl-9 pr-20 py-2.5 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500"
                      />
                      {!regEmail.includes('@') && regEmail.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleEmailInputChange(`${regEmail.trim()}@gmail.com`)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-mono font-bold transition-colors"
                        >
                          @gmail.com
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Tu Nombre
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        placeholder="Ej. Juan Pérez"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      Número de Celular *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        name="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="Ej. 300 123 4567"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-xs text-white font-mono placeholder:text-neutral-500 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {regError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-medium text-center">
                      {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] mt-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrarme y Entrar a Submigueleños</span>
                  </button>
                </form>
              </div>

              <div className="pt-3 border-t border-neutral-900 text-center">
                <p className="text-[10px] text-neutral-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Registro obligatorio por única vez para guardar tus puntos.</span>
                </p>
              </div>
            </div>
          )}

          {/* Bottom Mobile Tab Bar */}
          <div
            className={`${
              isNativeFullscreen ? 'fixed max-w-md mx-auto' : 'absolute'
            } bottom-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 flex items-center justify-around px-2 z-30`}
          >
            <button
              onClick={() => setMobileTab('HOME')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                mobileTab === 'HOME' ? 'text-amber-600' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setMobileTab('REWARDS')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                mobileTab === 'REWARDS' ? 'text-amber-600' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Premios</span>
            </button>

            <button
              onClick={() => setMobileTab('HISTORY')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                mobileTab === 'HISTORY' ? 'text-amber-600' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Visitas</span>
            </button>

            <button
              onClick={() => setMobileTab('PROFILE')}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                mobileTab === 'PROFILE' ? 'text-amber-600' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </button>
          </div>

          {/* Home Indicator Bar (only in simulator frame) */}
          {!isNativeFullscreen && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-900 rounded-full z-40" />
          )}
        </div>
      </div>

      {/* MODAL: Full Screen QR Code to Present to Cashier */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-neutral-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Código de Fidelización
              </span>
              <h3 className="text-base font-extrabold text-neutral-900 mt-0.5">
                {currentClient.name}
              </h3>
              <p className="text-xs text-neutral-500 font-mono">{currentClient.phone}</p>
            </div>

            {/* Giant Scannable QR */}
            <div className="bg-white p-3 rounded-2xl border-2 border-dashed border-amber-400 flex items-center justify-center mx-auto w-48 h-48 shadow-inner">
              <RealQrCode value={currentClient.phone} size={160} />
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
              Muestra este código al cajero o mesero para acumular o redimir puntos.
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
            >
              Cerrar Código
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Claim Reward */}
      {selectedRewardToClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-neutral-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                <RewardIcon name={selectedRewardToClaim.iconName} className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">
                ¿Canjear {selectedRewardToClaim.name}?
              </h3>
              <p className="text-xs text-neutral-500">{selectedRewardToClaim.description}</p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
              <div className="flex justify-between text-neutral-600">
                <span>Costo en puntos:</span>
                <span className="font-bold text-amber-600">{selectedRewardToClaim.pointsRequired} pts</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Tu saldo actual:</span>
                <span className="font-bold text-neutral-800">{currentClient.points} pts</span>
              </div>
              <div className="flex justify-between text-neutral-900 font-bold pt-1 border-t border-neutral-200">
                <span>Saldo restante:</span>
                <span>{currentClient.points - selectedRewardToClaim.pointsRequired} pts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedRewardToClaim(null)}
                className="py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-xl border border-neutral-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleClaimRewardFromApp(selectedRewardToClaim)}
                className="py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs"
              >
                Confirmar Canje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Active Coupon / Ticket Claimed */}
      {activeCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xs bg-white rounded-3xl p-6 text-center space-y-4 shadow-2xl border border-neutral-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                ¡Cupón Canjeado con Éxito!
              </span>
              <h3 className="text-sm font-extrabold text-neutral-900 mt-1">
                {activeCoupon.reward.name}
              </h3>
            </div>

            <div className="p-3 bg-neutral-900 text-white rounded-2xl space-y-1">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest block">
                Código para el Mesero / Caja
              </span>
              <span className="font-mono text-xl font-black text-amber-400 tracking-wider block">
                {activeCoupon.code}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? '¡Código copiado!' : 'Copiar código'}</span>
            </button>

            <button
              onClick={() => setActiveCoupon(null)}
              className="w-full py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
            >
              Listo / Guardar Cupón
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
