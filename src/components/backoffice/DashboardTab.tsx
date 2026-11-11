import React from 'react';
import {
  Users,
  Coins,
  Gift,
  TrendingUp,
  Award,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { RewardIcon } from '../common/RewardIcon';

export const DashboardTab: React.FC = () => {
  const { clients, rewards, transactions, config, campaigns } = useLoyalty();

  // Metric Computations
  const totalClients = clients.length;
  const totalPointsInCirculation = clients.reduce((acc, c) => acc + c.points, 0);

  const redeemTransactions = transactions.filter((t) => t.type === 'REDIMIR');
  const totalPointsRedeemed = Math.abs(
    redeemTransactions.reduce((acc, t) => acc + t.pointsDelta, 0)
  );

  const totalRevenueInfluenced = clients.reduce((acc, c) => acc + c.totalSpent, 0);

  // Frequent customers (>= 2 visits)
  const returningClients = clients.filter((c) => c.totalVisits > 1).length;
  const retentionRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0;

  // Tier distribution
  const tierCounts = {
    Diamante: clients.filter((c) => c.tier === 'Diamante').length,
    Oro: clients.filter((c) => c.tier === 'Oro').length,
    Plata: clients.filter((c) => c.tier === 'Plata').length,
    Bronce: clients.filter((c) => c.tier === 'Bronce').length,
  };

  // Top rewards by redemption
  const sortedRewards = [...rewards].sort((a, b) => b.redeemedCount - a.redeemedCount);

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Clientes Fidelizados</span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tabular-nums">
            {totalClients}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{retentionRate}% tasa de recurrencia</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Puntos en Circulación</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tabular-nums">
            {totalPointsInCirculation.toLocaleString('es-CO')}{' '}
            <span className="text-xs font-semibold text-neutral-400">pts</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            En billeteras de comensales
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Premios Redimidos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tabular-nums">
            {totalPointsRedeemed.toLocaleString('es-CO')}{' '}
            <span className="text-xs font-semibold text-neutral-400">pts</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            {redeemTransactions.length} canjes exitosos en caja
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-semibold">Consumo Fidelizado</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-neutral-900 tabular-nums">
            {config.currencySymbol}{totalRevenueInfluenced.toLocaleString('es-CO')}
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            Generado por miembros Submigueleños
          </div>
        </div>
      </div>

      {/* Two Column Grid: Tier Distribution & Top Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Distribution Breakdown */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900">
              Segmentación de Comensales por Nivel
            </h4>
            <Award className="w-4 h-4 text-neutral-400" />
          </div>

          <div className="space-y-3 pt-2">
            {[
              { level: 'Diamante', count: tierCounts.Diamante, color: 'bg-indigo-600', min: '500+ pts' },
              { level: 'Oro', count: tierCounts.Oro, color: 'bg-amber-500', min: '350 - 499 pts' },
              { level: 'Plata', count: tierCounts.Plata, color: 'bg-slate-400', min: '150 - 349 pts' },
              { level: 'Bronce', count: tierCounts.Bronce, color: 'bg-amber-800', min: '0 - 149 pts' },
            ].map((tier) => {
              const pct = totalClients > 0 ? Math.round((tier.count / totalClients) * 100) : 0;
              return (
                <div key={tier.level} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${tier.color}`} />
                      {tier.level}
                      <span className="text-[11px] font-normal text-neutral-400">({tier.min})</span>
                    </span>
                    <span className="tabular-nums font-bold text-neutral-700">
                      {tier.count} clientes ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${tier.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 bg-neutral-50 p-3 rounded-xl text-xs text-neutral-600">
            <span className="font-semibold text-neutral-900 block mb-1">
              Beneficio del Programa:
            </span>
            Los comensales en nivel Oro y Diamante visitan el restaurante en promedio{' '}
            <strong className="text-neutral-900 font-bold">2.8 veces más</strong> que clientes ocasionales.
          </div>
        </div>

        {/* Top 5 Most Redeemed Rewards */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-neutral-900">
              Premios Más Canjeados en Restaurante
            </h4>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>

          <div className="divide-y divide-neutral-100">
            {sortedRewards.slice(0, 5).map((reward, idx) => (
              <div key={reward.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-neutral-400 w-4">
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                    <RewardIcon name={reward.iconName} className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-900 leading-tight">
                      {reward.name}
                    </h5>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Categoría: {reward.category} · {reward.pointsRequired} pts
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-amber-600 tabular-nums">
                    {reward.redeemedCount} canjes
                  </span>
                  <span className="block text-[10px] text-neutral-400">
                    Valor: {config.currencySymbol}{reward.estimatedValue.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Mini Feed */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-3">
        <h4 className="font-bold text-sm text-neutral-900">
          Últimas Operaciones de Fidelización
        </h4>
        <div className="divide-y divide-neutral-100">
          {transactions.slice(0, 4).map((tx) => (
            <div key={tx.id} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    tx.type === 'REDIMIR'
                      ? 'bg-amber-500'
                      : tx.type === 'BONO'
                      ? 'bg-purple-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <div>
                  <span className="font-semibold text-neutral-800">{tx.clientName}</span>
                  <span className="text-neutral-400 text-[11px] ml-2">
                    {tx.notes || tx.ticketNumber}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold tabular-nums ${
                    tx.pointsDelta > 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                </span>
                <span className="text-[10px] text-neutral-400 block">
                  {new Date(tx.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
