import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Plus,
  Minus,
  History,
  Coins,
  Phone,
  Mail,
  Calendar,
  X,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Client, TierLevel, Transaction } from '../../types';
import { NewClientModal } from '../pos/NewClientModal';

interface ClientsTabProps {
  onGoToPOSWithClient?: (client: Client) => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({ onGoToPOSWithClient }) => {
  const { clients, transactions, config, manualAdjustPoints } = useLoyalty();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('TODOS');
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Client Adjustment Modal
  const [adjustingClient, setAdjustingClient] = useState<Client | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>('50');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');

  // Client History Drawer / Modal
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  // Filtered clients list
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm.trim()) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = selectedTier === 'TODOS' || c.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingClient) return;

    const delta = parseInt(adjustmentDelta, 10);
    if (isNaN(delta) || delta <= 0) return;

    const finalDelta = adjustmentType === 'ADD' ? delta : -delta;
    manualAdjustPoints(adjustingClient.id, finalDelta, adjustmentReason);
    setAdjustingClient(null);
    setAdjustmentDelta('50');
    setAdjustmentReason('');
  };

  const getClientHistory = (clientId: string): Transaction[] => {
    return transactions.filter((t) => t.clientId === clientId);
  };

  return (
    <div className="space-y-5">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, celular o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Tier filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {['TODOS', 'Diamante', 'Oro', 'Plata', 'Bronce'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedTier === tier
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {tier}
            </button>
          ))}
          <button
            onClick={() => setShowNewClientModal(true)}
            className="ml-2 flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs transition-colors shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Nuevo</span>
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Comensal / Cliente</th>
                <th className="py-3 px-4">Celular</th>
                <th className="py-3 px-4">Nivel Submigueleños</th>
                <th className="py-3 px-4 text-right">Puntos Disponibles</th>
                <th className="py-3 px-4 text-right">Consumo Total</th>
                <th className="py-3 px-4 text-center">Visitas</th>
                <th className="py-3 px-4">Última Visita</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {filteredClients.map((client) => {
                const tierColor =
                  client.tier === 'Diamante'
                    ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                    : client.tier === 'Oro'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : client.tier === 'Plata'
                    ? 'text-slate-700 bg-slate-100 border-slate-200'
                    : 'text-amber-900 bg-orange-50 border-orange-200';

                return (
                  <tr key={client.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Name & initial */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div className="truncate max-w-[160px]">
                          <span className="font-semibold text-neutral-900 block truncate">
                            {client.name}
                          </span>
                          {client.email && (
                            <span className="text-[11px] text-neutral-400 block truncate">
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 font-mono text-neutral-600">
                      {client.phone}
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${tierColor}`}
                      >
                        {client.tier}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-amber-600 tabular-nums text-sm">
                        {client.points}{' '}
                        <span className="text-xs font-normal text-neutral-400">pts</span>
                      </span>
                    </td>

                    {/* Spent */}
                    <td className="py-3 px-4 text-right font-mono text-neutral-700 tabular-nums">
                      {config.currencySymbol}{client.totalSpent.toLocaleString('es-CO')}
                    </td>

                    {/* Visits */}
                    <td className="py-3 px-4 text-center font-bold text-neutral-800 tabular-nums">
                      {client.totalVisits}
                    </td>

                    {/* Last Visit */}
                    <td className="py-3 px-4 text-neutral-500 text-[11px]">
                      {new Date(client.lastVisit).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustingClient(client)}
                          className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Ajustar puntos manualmente"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setHistoryClient(client)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Ver historial de visitas"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                        {onGoToPOSWithClient && (
                          <button
                            onClick={() => onGoToPOSWithClient(client)}
                            className="px-2 py-1 text-[11px] font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>Atender</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Points Adjustment Modal */}
      {adjustingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">Ajuste Manual de Puntos</h3>
              </div>
              <button
                onClick={() => setAdjustingClient(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-neutral-500 block text-[11px]">Comensal:</span>
                <span className="font-bold text-sm text-neutral-900 block">
                  {adjustingClient.name}
                </span>
                <span className="text-neutral-500 font-mono text-[11px]">
                  Saldo actual: {adjustingClient.points} pts
                </span>
              </div>

              {/* Add vs Subtract */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('ADD')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    adjustmentType === 'ADD'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Abonar (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('SUBTRACT')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    adjustmentType === 'SUBTRACT'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Restar (-)</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Cantidad de Puntos
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentDelta}
                  onChange={(e) => setAdjustmentDelta(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-base font-bold text-neutral-900 focus:bg-white focus:outline-hidden focus:border-amber-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Motivo del Ajuste
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cortesía por retraso en mesa, compensación..."
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAdjustingClient(null)}
                  className="px-3 py-2 font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl shadow-xs transition-colors"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Full History Modal */}
      {historyClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 bg-neutral-900 text-white">
              <div>
                <h3 className="font-semibold text-sm">Historial de Fidelización</h3>
                <p className="text-xs text-neutral-400">{historyClient.name} · {historyClient.phone}</p>
              </div>
              <button
                onClick={() => setHistoryClient(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {getClientHistory(historyClient.id).length > 0 ? (
                getClientHistory(historyClient.id).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 font-mono">
                          {tx.ticketNumber}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(tx.timestamp).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-neutral-600 mt-1">{tx.notes || tx.rewardName}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-sm tabular-nums ${
                          tx.pointsDelta > 0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                      </span>
                      {tx.billAmount && (
                        <span className="block text-[11px] text-neutral-400">
                          Cuenta: {config.currencySymbol}{tx.billAmount.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-neutral-400 py-6">
                  No hay transacciones registradas para este comensal aún.
                </p>
              )}
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setHistoryClient(null)}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal onClose={() => setShowNewClientModal(false)} />
      )}
    </div>
  );
};
