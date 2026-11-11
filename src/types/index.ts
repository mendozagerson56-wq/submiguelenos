export type TierLevel = 'Bronce' | 'Plata' | 'Oro' | 'Diamante';

export type TransactionType = 'ACUMULAR' | 'REDIMIR' | 'BONO' | 'AJUSTE';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  tier: TierLevel;
  totalSpent: number;
  totalVisits: number;
  birthDate?: string;
  notes?: string;
  createdAt: string;
  lastVisit: string;
}

export type RewardCategory = 'Bebidas' | 'Entradas' | 'Platos Fuertes' | 'Postres' | 'Descuentos';

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: RewardCategory;
  iconName: string; // lucide icon identifier
  isActive: boolean;
  redeemedCount: number;
  estimatedValue: number; // in currency for ROI calculation
}

export interface Transaction {
  id: string;
  ticketNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  type: TransactionType;
  pointsDelta: number; // positive for accumulate, negative for redeem
  billAmount?: number;
  rewardId?: string;
  rewardName?: string;
  cashierName: string;
  notes?: string;
  timestamp: string;
}

export interface LoyaltyCampaign {
  id: string;
  title: string;
  description: string;
  multiplier: number; // e.g. 2 for 2x points
  isActive: boolean;
  dayOfWeek?: number; // 0 Sunday - 6 Saturday (optional)
  badge: string;
}

export interface RestaurantConfig {
  restaurantName: string;
  tagline: string;
  phone: string;
  address: string;
  currencySymbol: string;
  // Conversion rule: How much currency spent yields 1 point
  // Example: 10 means 1 point for every $10 spent; or 1 means 1 point per $1 spent
  spendPerPoint: number;
  welcomeBonusPoints: number;
  birthdayBonusPoints: number;
  currentCashier: string;
  enableSoundEffects: boolean;
  staffPin?: string;
}
