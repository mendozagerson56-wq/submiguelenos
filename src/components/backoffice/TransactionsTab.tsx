import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Receipt,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Transaction, TransactionType } from '../../types';

export const TransactionsTab: React.FC = () => {
  const { transactions, config } = useLoyalty();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.clientName.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.clientPhone.includes(search) ||
      (t.rewardName && t.rewardName.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'TODOS' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Ticket',
      'Fecha',
      'Hora',
      'Cliente',
      'Telefono',
      'Tipo',
      'Puntos',
      'Monto Factura',
      'Premio / Detalle',
      'Cajero',
    ];

    const rows = filteredTransactions.map((t) => {
      const d = new Date(t.timestamp);
      return [
        t.ticketNumber,
        d.toLocaleDateString('es-CO'),
        d.toLocaleTimeString('es-CO'),
        `"${t.clientName.replace(/"/g, '""')}"`,
        t.clientPhone,
        t.type,
        t.pointsDelta,
        t.billAmount || 0,
        `"${(t.rewardName || t.notes || '').replace(/"/g, '""')}"`,
        `"${t.cashierName.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LealResto_Transacciones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Search, Filter & CSV Export */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ticket, cliente, celular..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 focus:bg-white border border-neutral-200 rounded-xl text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {['TODOS', 'ACUMULAR', 'REDIMIR', 'BONO', 'AJUSTE'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {type === 'TODOS'
                ? 'Todas'
                : type === 'ACUMULAR'
                ? 'Acumulaciones'
                : type === 'REDIMIR'
                ? 'Canjes'
                : type === 'BONO'
                ? 'Bonos'
                : 'Ajustes'}
            </button>
          ))}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition-colors shrink-0 shadow-2xs"
            title="Descargar reporte en formato Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cliente / Celular</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Movimiento Pts</th>
                <th className="py-3 px-4 text-right">Monto Factura</th>
                <th className="py-3 px-4">Premio o Detalle</th>
                <th className="py-3 px-4">Cajero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-sans">
              {filteredTransactions.map((tx) => {
                const isEarn = tx.type === 'ACUMULAR';
                const isRedeem = tx.type === 'REDIMIR';
                const isBonus = tx.type === 'BONO';

                return (
                  <tr key={tx.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Ticket */}
                    <td className="py-3 px-4 font-mono font-bold text-neutral-800">
                      {tx.ticketNumber}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-neutral-500 text-[11px] whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-neutral-900 block truncate max-w-[150px]">
                        {tx.clientName}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {tx.clientPhone}
                      </span>
                    </td>

                    {/* Type badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isEarn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isRedeem
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isBonus
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    {/* Points Delta */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-mono font-bold text-sm tabular-nums ${
                          tx.pointsDelta > 0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                      </span>
                    </td>

                    {/* Bill Amount */}
                    <td className="py-3 px-4 text-right font-mono text-neutral-600 tabular-nums">
                      {tx.billAmount
                        ? `${config.currencySymbol}${tx.billAmount.toLocaleString('es-CO')}`
                        : '—'}
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-neutral-600 text-[11px] truncate max-w-[200px]">
                      {tx.rewardName || tx.notes || 'Operación regular'}
                    </td>

                    {/* Cashier */}
                    <td className="py-3 px-4 text-neutral-500 text-[11px]">
                      {tx.cashierName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
