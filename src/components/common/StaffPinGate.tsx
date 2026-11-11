import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, Delete } from 'lucide-react';

interface StaffPinGateProps {
  title: string;
  subtitle: string;
  expectedPin: string;
  onSuccess: () => void;
}

export const StaffPinGate: React.FC<StaffPinGateProps> = ({
  title,
  subtitle,
  expectedPin,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');

  const verifyPin = (candidate: string) => {
    const cleanExpected = (expectedPin || '1234').trim();
    if (candidate === cleanExpected) {
      setError('');
      onSuccess();
    } else {
      setError('PIN incorrecto. Verifica con el administrador del restaurante.');
      setPinInput('');
    }
  };

  const handleDigitClick = (digit: string) => {
    setError('');
    if (pinInput.length >= 8) return;
    const next = pinInput + digit;
    setPinInput(next);
    const cleanExpected = (expectedPin || '1234').trim();
    if (next.length === cleanExpected.length && next === cleanExpected) {
      onSuccess();
    }
  };

  const handleBackspace = () => {
    setError('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPin(pinInput);
  };

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Acceso Exclusivo Personal
          </span>
          <h2 className="text-lg font-extrabold text-neutral-900">{title}</h2>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="Ingresa el PIN de seguridad..."
              value={pinInput}
              onChange={(e) => {
                setError('');
                setPinInput(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-center font-mono text-lg font-bold tracking-[0.4em] text-neutral-900 focus:bg-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Numeric Keypad for Touch POS Terminals */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitClick(digit)}
                className="py-3 bg-neutral-50 hover:bg-amber-50 active:bg-amber-100 border border-neutral-200 hover:border-amber-300 rounded-xl font-mono font-extrabold text-sm text-neutral-800 transition-colors cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setError('');
                setPinInput('');
              }}
              className="py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl font-semibold text-xs text-neutral-600 transition-colors cursor-pointer"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => handleDigitClick('0')}
              className="py-3 bg-neutral-50 hover:bg-amber-50 active:bg-amber-100 border border-neutral-200 hover:border-amber-300 rounded-xl font-mono font-extrabold text-sm text-neutral-800 transition-colors cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
              title="Borrar"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl text-xs font-extrabold tracking-wide transition-colors shadow-sm cursor-pointer"
          >
            Desbloquear Terminal
          </button>
        </form>

        <p className="text-[11px] text-neutral-400">
          PIN predeterminado de fábrica: <code className="font-mono font-bold text-neutral-600">1234</code> (configurable en Ajustes).
        </p>
      </div>
    </div>
  );
};

