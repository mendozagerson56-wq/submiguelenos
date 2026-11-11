import React, { useState } from 'react';
import { UserPlus, X, Gift, Phone, User, Mail, Calendar, Check } from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';

interface NewClientModalProps {
  initialPhone?: string;
  onClose: () => void;
  onClientCreated?: () => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  initialPhone = '',
  onClose,
  onClientCreated,
}) => {
  const { registerClient, config } = useLoyalty();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [giveBonus, setGiveBonus] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor ingresa el nombre del cliente');
      return;
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Ingresa un número de celular válido (mínimo 7 dígitos)');
      return;
    }

    registerClient({
      name,
      phone: cleanPhone,
      email,
      birthDate,
      notes,
      initialPointsBonus: giveBonus,
    });

    if (onClientCreated) onClientCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Registrar Nuevo Cliente</h3>
              <p className="text-xs text-neutral-400">Rápido en menos de 15 segundos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. Carolina Herrera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Teléfono Celular <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                placeholder="Ej. 3123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Servirá como su ID de fidelización para acumular y redimir
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Correo (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Cumpleaños (Opcional)
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Welcome points promotion checkbox */}
          <div
            onClick={() => setGiveBonus(!giveBonus)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              giveBonus
                ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Gift className={`w-4 h-4 ${giveBonus ? 'text-amber-600' : 'text-neutral-400'}`} />
              <div>
                <span className="text-xs font-bold block">
                  Asignar Bono de Bienvenida (+{config.welcomeBonusPoints} pts)
                </span>
                <span className="text-[11px] text-neutral-500">
                  El cliente inicia con saldo a favor para fidelizarlo hoy mismo
                </span>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                giveBonus
                  ? 'bg-amber-600 border-amber-600 text-white'
                  : 'border-neutral-300 bg-white'
              }`}
            >
              {giveBonus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registrar y Seleccionar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
