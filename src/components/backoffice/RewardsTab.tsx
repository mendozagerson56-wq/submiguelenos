import React, { useState } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Coffee,
  UtensilsCrossed,
  Sparkles,
  DollarSign,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Reward, RewardCategory } from '../../types';
import { RewardIcon } from '../common/RewardIcon';

export const RewardsTab: React.FC = () => {
  const { rewards, config, addReward, updateReward, deleteReward } = useLoyalty();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('100');
  const [category, setCategory] = useState<RewardCategory>('Postres');
  const [iconName, setIconName] = useState('CakeSlice');
  const [estimatedValue, setEstimatedValue] = useState('20000');

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setPointsRequired('100');
    setCategory('Postres');
    setIconName('CakeSlice');
    setEstimatedValue('20000');
    setShowAddModal(true);
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setName(reward.name);
    setDescription(reward.description);
    setPointsRequired(reward.pointsRequired.toString());
    setCategory(reward.category);
    setIconName(reward.iconName);
    setEstimatedValue(reward.estimatedValue.toString());
  };

  const handleSaveReward = (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(pointsRequired, 10) || 50;
    const val = parseInt(estimatedValue, 10) || 10000;

    if (editingReward) {
      updateReward({
        ...editingReward,
        name: name.trim(),
        description: description.trim(),
        pointsRequired: pts,
        category,
        iconName,
        estimatedValue: val,
      });
      setEditingReward(null);
    } else {
      addReward({
        name: name.trim(),
        description: description.trim(),
        pointsRequired: pts,
        category,
        iconName,
        isActive: true,
        estimatedValue: val,
      });
      setShowAddModal(false);
    }
  };

  const iconOptions = [
    { label: 'Café', name: 'Coffee' },
    { label: 'Bebida', name: 'GlassWater' },
    { label: 'Entrada', name: 'UtensilsCrossed' },
    { label: 'Parrilla / Fuego', name: 'Flame' },
    { label: 'Postre / Torta', name: 'CakeSlice' },
    { label: 'Plato Fuerte', name: 'CookingPot' },
    { label: 'Carne / Bife', name: 'Beef' },
    { label: 'Descuento %', name: 'BadgePercent' },
    { label: 'Pizza', name: 'Pizza' },
    { label: 'Vino / Bar', name: 'Wine' },
    { label: 'Helado', name: 'IceCream' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h3 className="font-bold text-sm text-neutral-900">
            Catálogo de Premios y Beneficios
          </h3>
          <p className="text-xs text-neutral-500">
            Platos, bebidas y descuentos que los clientes pueden canjear en caja.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Premio</span>
        </button>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              reward.isActive
                ? 'bg-white border-neutral-200 shadow-xs hover:border-neutral-300'
                : 'bg-neutral-50 border-neutral-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/50">
                  <RewardIcon name={reward.iconName} className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateReward({ ...reward, isActive: !reward.isActive })}
                    className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
                    title={reward.isActive ? 'Desactivar premio' : 'Activar premio'}
                  >
                    {reward.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-neutral-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(reward)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-neutral-900 text-sm leading-snug">
                    {reward.name}
                  </h4>
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 tabular-nums shrink-0">
                    {reward.pointsRequired} pts
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {reward.description}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>Categoría: <strong>{reward.category}</strong></span>
              <span className="tabular-nums">
                Canjeado: <strong className="text-neutral-800">{reward.redeemedCount} veces</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Reward Modal */}
      {(showAddModal || editingReward) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-neutral-900 text-white">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">
                  {editingReward ? 'Editar Premio' : 'Crear Nuevo Premio'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingReward(null);
                }}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Nombre del Plato / Beneficio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Postre de Tres Leches con Arequipe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre porción, ingredientes o condiciones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Puntos Requeridos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pointsRequired}
                    onChange={(e) => setPointsRequired(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-bold text-neutral-900 focus:bg-white focus:outline-hidden focus:border-amber-500 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Valor Estimado ({config.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl font-mono text-neutral-900 focus:bg-white focus:outline-hidden focus:border-amber-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RewardCategory)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="Bebidas">Bebidas</option>
                    <option value="Entradas">Entradas</option>
                    <option value="Platos Fuertes">Platos Fuertes</option>
                    <option value="Postres">Postres</option>
                    <option value="Descuentos">Descuentos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Ícono Ilustrativo
                  </label>
                  <select
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500"
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingReward(null);
                  }}
                  className="px-4 py-2 font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-xs transition-colors"
                >
                  {editingReward ? 'Actualizar Premio' : 'Guardar Premio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
