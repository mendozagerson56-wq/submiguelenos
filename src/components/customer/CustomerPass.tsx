import React, { useState } from 'react';
import {
  QrCode,
  Sparkles,
  Award,
  Gift,
  Coffee,
  CheckCircle,
  Phone,
  Search,
  ArrowRight,
  TrendingUp,
  History,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { RewardIcon } from '../common/RewardIcon';
import { Client } from '../../types';

export const CustomerPass: React.FC = () => {
  const { clients, rewards, transactions, config } = useLoyalty();

  // Active customer state
  const [activeClient, setActiveClient] = useState<Client>(clients[0]);
  const [searchPhone, setSearchPhone] = useState('');

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchPhone.trim().replace(/[\s-]/g, '');
    const found = clients.find((c) => c.phone.replace(/[\s-]/g, '').includes(clean));
    if (found) {
      setActiveClient(found);
    }
  };

  const clientTransactions = transactions.filter((t) => t.clientId === activeClient.id);

  // Available rewards the client can redeem right now
  const canRedeemRewards = rewards.filter(
    (r) => r.isActive && activeClient.points >= r.pointsRequired
  );

  // Next tier progress
  const nextTierPoints =
    activeClient.points < 150 ? 150 : activeClient.points < 350 ? 350 : 500;
  const nextTierName =
    activeClient.points < 150 ? 'Plata' : activeClient.points < 350 ? 'Oro' : 'Diamante';
  const progressPercent = Math.min(100, Math.round((activeClient.points / nextTierPoints) * 100));

  // Visual card gradient based on Tier
  const tierGrad =
    activeClient.tier === 'Diamante'
      ? 'from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/40'
      : activeClient.tier === 'Oro'
      ? 'from-amber-950 via-stone-900 to-amber-900 border-amber-500/50'
      : activeClient.tier === 'Plata'
      ? 'from-zinc-900 via-neutral-900 to-zinc-800 border-slate-400/40'
      : 'from-amber-950/80 via-neutral-900 to-neutral-950 border-amber-700/40';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Customer Selector / Phone Login Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handlePhoneSearch} className="relative flex-1 max-w-sm">
          <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Consultar saldo con tu celular..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] text-neutral-400 font-medium shrink-0">
            Ver cliente demo:
          </span>
          {clients.slice(0, 4).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveClient(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                activeClient.id === c.id
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Luxury Digital Pass Card (Wallet Style) */}
      <div className="relative mx-auto max-w-md">
        <div
          className={`relative rounded-3xl p-6 bg-gradient-to-br ${tierGrad} text-white shadow-2xl border overflow-hidden flex flex-col justify-between min-h-[290px]`}
        >
          {/* Subtle background glow effect */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl" />

          {/* Card Top: Restaurant Brand & Tier */}
          <div className="relative flex items-start justify-between">
            <div>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-amber-300/80 block">
                Tarjeta de Fidelización
              </span>
              <h3 className="font-extrabold text-lg tracking-tight font-sans mt-0.5">
                {config.restaurantName}
              </h3>
            </div>

            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-xs">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Nivel {activeClient.tier}</span>
            </div>
          </div>

          {/* Card Middle: Points Counter & QR Code */}
          <div className="relative my-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-neutral-400 block font-medium">Puntos Acumulados</span>
              <div className="text-4xl font-extrabold font-sans tracking-tight text-amber-400 tabular-nums">
                {activeClient.points}{' '}
                <span className="text-sm font-semibold text-neutral-300">pts</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
                Equivalen a ~{config.currencySymbol}
                {(activeClient.points * 100).toLocaleString('es-CO')} en consumos
              </span>
            </div>

            {/* Simulated Digital QR for Cashier Scan */}
            <div className="bg-white p-2.5 rounded-2xl shadow-md text-neutral-900 text-center shrink-0">
              <QrCode className="w-16 h-16" />
              <span className="block text-[8px] font-mono text-neutral-500 mt-1">
                {activeClient.phone.slice(-4)}
              </span>
            </div>
          </div>

          {/* Card Bottom: Client Name & Phone */}
          <div className="relative pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase">Titular</span>
              <span className="font-bold tracking-wide">{activeClient.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block uppercase">Celular</span>
              <span className="font-mono text-neutral-300">{activeClient.phone}</span>
            </div>
          </div>
        </div>

        {/* Level Progression Indicator below card */}
        <div className="mt-4 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-700">
              Camino a Nivel {nextTierName}
            </span>
            <span className="font-mono font-bold text-amber-600 tabular-nums">
              {activeClient.points} / {nextTierPoints} pts
            </span>
          </div>
          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            {activeClient.points >= 500
              ? '¡Felicidades! Eres comensal Diamante con máxima prioridad.'
              : `Acumula ${nextTierPoints - activeClient.points} puntos más para desbloquear beneficios VIP.`}
          </p>
        </div>
      </div>

      {/* Rewards Redeemable Right Now */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h4 className="font-bold text-sm text-neutral-900">
              Premios que Puedes Reclamar Hoy en el Restaurante
            </h4>
          </div>
          <span className="text-xs text-neutral-500">
            Saldo: <strong className="text-amber-600">{activeClient.points} pts</strong>
          </span>
        </div>

        {canRedeemRewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {canRedeemRewards.map((reward) => (
              <div
                key={reward.id}
                className="p-3.5 bg-neutral-50 hover:bg-amber-50/50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <RewardIcon name={reward.iconName} className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-neutral-900">{reward.name}</h5>
                    <span className="text-[11px] text-neutral-500 block">
                      {reward.description}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md tabular-nums block">
                    {reward.pointsRequired} pts
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                    ¡Disponible!
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500 space-y-1">
            <Gift className="w-6 h-6 text-neutral-400 mx-auto mb-1" />
            <p className="font-medium text-neutral-700">Aún no alcanzas el mínimo de puntos</p>
            <p>
              El premio más accesible comienza en 40 pts (Café de especialidad). ¡Sigue acumulando en tus visitas!
            </p>
          </div>
        )}
      </div>

      {/* Customer Visits History */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-neutral-500" />
          <h4 className="font-bold text-sm text-neutral-900">Tus Visitas Recientes</h4>
        </div>

        {clientTransactions.length > 0 ? (
          <div className="divide-y divide-neutral-100 text-xs">
            {clientTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-900">
                    {tx.type === 'REDIMIR'
                      ? `Redención: ${tx.rewardName || 'Premio'}`
                      : tx.type === 'BONO'
                      ? 'Bono de Fidelización'
                      : 'Consumo en Restaurante'}
                  </span>
                  <span className="text-neutral-400 text-[11px] block">
                    {new Date(tx.timestamp).toLocaleDateString('es-CO', {
                      dateStyle: 'medium',
                    })}{' '}
                    · Ticket {tx.ticketNumber}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-mono font-bold tabular-nums text-sm ${
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
          <p className="text-xs text-neutral-400 py-3">No hay registros de visitas aún.</p>
        )}
      </div>
    </div>
  );
};
