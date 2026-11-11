import React from 'react';
import {
  Coffee,
  GlassWater,
  UtensilsCrossed,
  Flame,
  CakeSlice,
  CookingPot,
  Beef,
  BadgePercent,
  Sparkles,
  Gift,
  Pizza,
  Wine,
  IceCream,
} from 'lucide-react';

interface RewardIconProps {
  name: string;
  className?: string;
}

export const RewardIcon: React.FC<RewardIconProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Coffee':
      return <Coffee className={className} />;
    case 'GlassWater':
      return <GlassWater className={className} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'CakeSlice':
      return <CakeSlice className={className} />;
    case 'CookingPot':
      return <CookingPot className={className} />;
    case 'Beef':
      return <Beef className={className} />;
    case 'BadgePercent':
      return <BadgePercent className={className} />;
    case 'Pizza':
      return <Pizza className={className} />;
    case 'Wine':
      return <Wine className={className} />;
    case 'IceCream':
      return <IceCream className={className} />;
    default:
      return <Gift className={className} />;
  }
};
