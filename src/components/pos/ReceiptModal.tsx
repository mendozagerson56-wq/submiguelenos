import React, { useState } from 'react';
import { CheckCircle2, Printer, Share2, X, Sparkles, ArrowRight } from 'lucide-react';
import { Transaction } from '../../types';
import { useLoyalty } from '../../context/LoyaltyContext';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { config, clients } = useLoyalty();
  const [copiedShare, setCopiedShare] = useState(false);

  if (!transaction) return null;

  const client = clients.find((c) => c.id === transaction.clientId);
  const currentPoints = client ? client.points : 0;
  const previousPoints =
    transaction.type === 'REDIMIR'
      ? currentPoints + Math.abs(transaction.pointsDelta)
      : Math.max(0, currentPoints - transaction.pointsDelta);

  const formattedDate = new Date(transaction.timestamp).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isRedeem = transaction.type === 'REDIMIR';
  const isBonus = transaction.type === 'BONO';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `¡Hola ${transaction.clientName}! 🍽️ Gracias por visitar *${config.restaurantName}*.\n\n` +
      `🧾 *Comprobante ${transaction.ticketNumber}*\n` +
      `✨ ${isRedeem ? 'Puntos Redimidos' : 'Puntos Ganados'}: ${transaction.pointsDelta > 0 ? '+' : ''}${transaction.pointsDelta} pts\n` +
      (transaction.rewardName ? `🎁 Premio: ${transaction.rewardName}\n` : '') +
      `⭐ *Tu Nuevo Saldo*: ${currentPoints} puntos\n` +
      `Nivel actual: ${client?.tier || 'Bronce'}\n\n` +
      `¡Te esperamos pronto para seguir disfrutando!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col">
        {/* Top Header */}
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide">
              {isRedeem ? '¡Redención Exitosa!' : isBonus ? '¡Bono Asignado!' : '¡Puntos Acumulados!'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content - Styled as high quality thermal ticket */}
        <div className="p-6 bg-neutral-50 font-mono text-xs text-neutral-700 space-y-4">
          <div className="text-center space-y-1 border-b border-dashed border-neutral-300 pb-3">
            <h4 className="font-sans font-bold text-base text-neutral-900 tracking-tight">
              {config.restaurantName}
            </h4>
            <p className="text-neutral-500">{config.tagline}</p>
            <p className="text-neutral-400 text-[11px]">{config.address}</p>
            <p className="text-neutral-400 text-[11px]">Tel: {config.phone}</p>
          </div>

          <div className="flex justify-between text-neutral-500 text-[11px]">
            <span>Ticket: <strong className="text-neutral-800">{transaction.ticketNumber}</strong></span>
            <span>{formattedDate}</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-neutral-200 space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Cliente:</span>
              <span className="font-semibold text-neutral-900 truncate max-w-[170px]">
                {transaction.clientName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Teléfono:</span>
              <span className="text-neutral-700">{transaction.clientPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Nivel Submigueleños:</span>
              <span className="font-semibold text-amber-600">Nivel {client?.tier || 'Bronce'}</span>
            </div>
            {transaction.billAmount && (
              <div className="flex justify-between pt-1 border-t border-neutral-100">
                <span className="text-neutral-500">Monto Cuenta:</span>
                <span className="font-semibold text-neutral-900">
                  {config.currencySymbol}{transaction.billAmount.toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>

          {/* Points Movement Box */}
          <div className={`p-4 rounded-xl text-center border ${
            isRedeem
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-emerald-50/70 border-emerald-200'
          }`}>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
              {isRedeem ? 'Puntos Utilizados' : 'Puntos Ganados'}
            </span>
            <div className={`text-3xl font-extrabold tracking-tight font-sans mt-1 ${
              isRedeem ? 'text-amber-700' : 'text-emerald-700'
            }`}>
              {transaction.pointsDelta > 0 ? `+${transaction.pointsDelta}` : transaction.pointsDelta} <span className="text-sm font-semibold">pts</span>
            </div>
            {transaction.rewardName && (
              <div className="mt-2 text-xs font-semibold text-neutral-800 bg-white/80 py-1 px-2 rounded-lg border border-neutral-200 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate max-w-[200px]">{transaction.rewardName}</span>
              </div>
            )}
          </div>

          {/* Points Balance Calculation */}
          <div className="border-t border-b border-dashed border-neutral-300 py-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-neutral-500">
              <span>Saldo anterior:</span>
              <span className="tabular-nums">{previousPoints} pts</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Movimiento:</span>
              <span className={`tabular-nums font-semibold ${isRedeem ? 'text-rose-600' : 'text-emerald-600'}`}>
                {transaction.pointsDelta > 0 ? `+${transaction.pointsDelta}` : transaction.pointsDelta} pts
              </span>
            </div>
            <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-200 text-xs">
              <span>NUEVO SALDO DISPONIBLE:</span>
              <span className="tabular-nums text-amber-600 font-extrabold">{currentPoints} pts</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-neutral-400 space-y-0.5">
            <p>Atendido por: {transaction.cashierName}</p>
            <p>¡Gracias por ser parte de Submigueleños!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-neutral-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? '¡Enviado!' : 'WhatsApp'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors border border-neutral-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors shadow-sm"
          >
            <span>Siguiente Operación</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
