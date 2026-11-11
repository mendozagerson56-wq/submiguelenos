import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Client,
  Reward,
  Transaction,
  LoyaltyCampaign,
  RestaurantConfig,
  TierLevel,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_CLIENTS,
  INITIAL_REWARDS,
  INITIAL_CAMPAIGNS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';

export interface NetworkInfo {
  ips: string[];
  port: number;
  baseUrl: string;
  androidAppUrl: string;
  apkDownloadUrl?: string;
  apkAvailable?: boolean;
  posUrl: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface LoyaltyContextType {
  clients: Client[];
  rewards: Reward[];
  transactions: Transaction[];
  campaigns: LoyaltyCampaign[];
  config: RestaurantConfig;
  selectedClient: Client | null;
  activeReceipt: Transaction | null;
  isServerConnected: boolean;
  networkInfo: NetworkInfo | null;
  canInstallAndroid: boolean;
  isAndroidStandalone: boolean;
  installAndroidApp: () => Promise<boolean>;
  setSelectedClient: (client: Client | null) => void;
  findClientByPhoneOrName: (query: string) => Client[];
  accumulatePoints: (
    clientId: string,
    billAmount: number,
    customPoints?: number,
    notes?: string
  ) => { success: boolean; transaction?: Transaction; error?: string };
  redeemReward: (
    clientId: string,
    reward: Reward,
    notes?: string
  ) => { success: boolean; transaction?: Transaction; error?: string };
  redeemCustomDiscount: (
    clientId: string,
    points: number,
    discountAmount: number,
    notes?: string
  ) => { success: boolean; transaction?: Transaction; error?: string };
  registerClient: (
    clientData: Omit<Client, 'id' | 'points' | 'tier' | 'totalSpent' | 'totalVisits' | 'createdAt' | 'lastVisit'> & { initialPointsBonus?: boolean }
  ) => Client;
  updateClient: (updated: Client) => void;
  manualAdjustPoints: (
    clientId: string,
    pointsDelta: number,
    reason: string
  ) => { success: boolean; transaction?: Transaction; error?: string };
  addReward: (reward: Omit<Reward, 'id' | 'redeemedCount'>) => void;
  updateReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
  toggleCampaign: (id: string) => void;
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  resetAllData: () => void;
  clearDemoDataForProduction: () => void;
  closeReceipt: () => void;
  playAudioChime: (type: 'earn' | 'redeem' | 'click') => void;
}

const STORAGE_KEYS = {
  CLIENTS: 'submiguelenos_clients_v2',
  REWARDS: 'submiguelenos_rewards_v2',
  TRANSACTIONS: 'submiguelenos_transactions_v2',
  CAMPAIGNS: 'submiguelenos_campaigns_v2',
  CONFIG: 'submiguelenos_config_v2',
};

const calculateTier = (points: number): TierLevel => {
  if (points >= 500) return 'Diamante';
  if (points >= 350) return 'Oro';
  if (points >= 150) return 'Plata';
  return 'Bronce';
};

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REWARDS);
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return saved ? JSON.parse(saved) : INITIAL_CAMPAIGNS;
  });

  const [config, setConfig] = useState<RestaurantConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(() => clients[0] || null);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [isServerConnected, setIsServerConnected] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAndroidStandalone, setIsAndroidStandalone] = useState<boolean>(false);

  const senderIdRef = useRef<string>(`session-${Math.random().toString(36).slice(2, 10)}`);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const initialLoadCompleteRef = useRef<boolean>(false);

  // Detect standalone PWA mode & listen for Android beforeinstallprompt
  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsAndroidStandalone(standalone);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsAndroidStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installAndroidApp = async (): Promise<boolean> => {
    if (!deferredInstallPrompt) return false;
    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredInstallPrompt(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const apiBaseUrl =
    typeof window !== 'undefined' &&
    (window as unknown as { __LEALRESTO_SERVER_URL__?: string }).__LEALRESTO_SERVER_URL__
      ? (window as unknown as { __LEALRESTO_SERVER_URL__: string }).__LEALRESTO_SERVER_URL__
      : '';

  // Connect to production backend API & Real-Time SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    fetch(`${apiBaseUrl}/api/network-info`)
      .then((res) => (res.ok ? res.json() : null))
      .then((info) => {
        if (isMounted && info) {
          setNetworkInfo(info);
        }
      })
      .catch(() => {});

    try {
      eventSource = new EventSource(`${apiBaseUrl}/api/stream`);
      eventSource.onopen = () => {
        if (isMounted) setIsServerConnected(true);
      };
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data.senderId && data.senderId === senderIdRef.current) {
            return;
          }
          if (data.state) {
            isRemoteUpdateRef.current = true;
            setClients(data.state.clients || INITIAL_CLIENTS);
            setRewards(data.state.rewards || INITIAL_REWARDS);
            setTransactions(data.state.transactions || INITIAL_TRANSACTIONS);
            setCampaigns(data.state.campaigns || INITIAL_CAMPAIGNS);
            setConfig(data.state.config || INITIAL_CONFIG);
            initialLoadCompleteRef.current = true;
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 50);
          }
        } catch {
          // Ignore malformed message
        }
      };
      eventSource.onerror = () => {
        if (isMounted) {
          setIsServerConnected(false);
          initialLoadCompleteRef.current = true;
        }
      };
    } catch {
      initialLoadCompleteRef.current = true;
    }

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, [apiBaseUrl]);

  // Sync local state changes to localStorage AND production backend
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));

    if (!initialLoadCompleteRef.current || isRemoteUpdateRef.current) {
      return;
    }

    fetch(`${apiBaseUrl}/api/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: senderIdRef.current,
        clients,
        rewards,
        transactions,
        campaigns,
        config,
      }),
    })
      .then((res) => {
        if (res.ok) setIsServerConnected(true);
      })
      .catch(() => {
        setIsServerConnected(false);
      });
  }, [clients, rewards, transactions, campaigns, config, apiBaseUrl]);

  // Keep selectedClient in sync when clients state changes
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated && (updated.points !== selectedClient.points || updated.tier !== selectedClient.tier)) {
        setSelectedClient(updated);
      }
    }
  }, [clients]);

  // Audio feedback synthesis using Web Audio API (graceful, no asset dependencies)
  const playAudioChime = (type: 'earn' | 'redeem' | 'click') => {
    if (!config.enableSoundEffects) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'earn') {
        // High celebratory ascending arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.08);
          osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
      } else if (type === 'redeem') {
        // Warm celebratory chime
        const notes = [659.25, 880, 1174.66]; // E5, A5, D6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.09);
          osc.stop(ctx.currentTime + idx * 0.09 + 0.35);
        });
      } else {
        // Soft click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const findClientByPhoneOrName = (query: string): Client[] => {
    if (!query.trim()) return clients;
    const cleanQuery = query.toLowerCase().replace(/[\s-]/g, '');
    return clients.filter((c) => {
      const cleanPhone = c.phone.replace(/[\s-]/g, '');
      const cleanName = c.name.toLowerCase();
      return cleanPhone.includes(cleanQuery) || cleanName.includes(query.toLowerCase());
    });
  };

  // Generate sequential ticket number
  const generateTicketNumber = () => {
    const nextNum = 8500 + transactions.length;
    return `TKT-${nextNum}`;
  };

  // 1. Acumular Puntos (Earn)
  const accumulatePoints = (
    clientId: string,
    billAmount: number,
    customPoints?: number,
    notes?: string
  ) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    if (billAmount <= 0 && (!customPoints || customPoints <= 0)) {
      return { success: false, error: 'Ingresa un monto de consumo o puntos válidos' };
    }

    // Determine points earned
    let pointsToAdd = 0;
    if (customPoints !== undefined && customPoints > 0) {
      pointsToAdd = Math.round(customPoints);
    } else {
      // Calculate from bill amount & spendPerPoint
      const basePoints = Math.floor(billAmount / (config.spendPerPoint || 1000));
      // Apply active campaign multiplier if any
      const activeMult = campaigns
        .filter((c) => c.isActive)
        .reduce((max, c) => Math.max(max, c.multiplier), 1);
      pointsToAdd = Math.max(1, Math.round(basePoints * activeMult));
    }

    const newPoints = client.points + pointsToAdd;
    const newTier = calculateTier(newPoints);
    const nowIso = new Date().toISOString();

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      ticketNumber: generateTicketNumber(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      type: 'ACUMULAR',
      pointsDelta: pointsToAdd,
      billAmount: billAmount > 0 ? billAmount : undefined,
      cashierName: config.currentCashier.split(' ')[0] || 'Cajero',
      notes: notes || `Consumo en restaurante (${config.currencySymbol}${billAmount.toLocaleString('es-CO')})`,
      timestamp: nowIso,
    };

    const updatedClient: Client = {
      ...client,
      points: newPoints,
      tier: newTier,
      totalSpent: client.totalSpent + (billAmount > 0 ? billAmount : 0),
      totalVisits: client.totalVisits + 1,
      lastVisit: nowIso,
    };

    setClients((prev) => prev.map((c) => (c.id === client.id ? updatedClient : c)));
    setTransactions((prev) => [transaction, ...prev]);
    setSelectedClient(updatedClient);
    setActiveReceipt(transaction);

    // Audio & Confetti
    playAudioChime('earn');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#d97706', '#10b981', '#3b82f6'],
    });

    return { success: true, transaction };
  };

  // 2. Redimir Premio (Spend)
  const redeemReward = (clientId: string, reward: Reward, notes?: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    if (client.points < reward.pointsRequired) {
      return {
        success: false,
        error: `Puntos insuficientes. Requiere ${reward.pointsRequired} pts y tiene ${client.points} pts.`,
      };
    }

    const newPoints = client.points - reward.pointsRequired;
    const newTier = calculateTier(newPoints);
    const nowIso = new Date().toISOString();

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      ticketNumber: generateTicketNumber(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      type: 'REDIMIR',
      pointsDelta: -reward.pointsRequired,
      rewardId: reward.id,
      rewardName: reward.name,
      cashierName: config.currentCashier.split(' ')[0] || 'Cajero',
      notes: notes || `Redención de premio: ${reward.name}`,
      timestamp: nowIso,
    };

    const updatedClient: Client = {
      ...client,
      points: newPoints,
      tier: newTier,
      lastVisit: nowIso,
    };

    // Update reward redeemed count
    setRewards((prev) =>
      prev.map((r) => (r.id === reward.id ? { ...r, redeemedCount: r.redeemedCount + 1 } : r))
    );

    setClients((prev) => prev.map((c) => (c.id === client.id ? updatedClient : c)));
    setTransactions((prev) => [transaction, ...prev]);
    setSelectedClient(updatedClient);
    setActiveReceipt(transaction);

    playAudioChime('redeem');
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ea580c', '#f59e0b', '#fbbf24', '#ec4899'],
    });

    return { success: true, transaction };
  };

  // 3. Redimir Descuento personalizado en efectivo / cuenta
  const redeemCustomDiscount = (
    clientId: string,
    points: number,
    discountAmount: number,
    notes?: string
  ) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    if (client.points < points) {
      return {
        success: false,
        error: `Puntos insuficientes. Tiene ${client.points} pts y desea redimir ${points} pts.`,
      };
    }

    const newPoints = client.points - points;
    const newTier = calculateTier(newPoints);
    const nowIso = new Date().toISOString();

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      ticketNumber: generateTicketNumber(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      type: 'REDIMIR',
      pointsDelta: -points,
      billAmount: discountAmount,
      rewardName: `Descuento en factura de ${config.currencySymbol}${discountAmount.toLocaleString('es-CO')}`,
      cashierName: config.currentCashier.split(' ')[0] || 'Cajero',
      notes: notes || `Descuento directo en caja`,
      timestamp: nowIso,
    };

    const updatedClient: Client = {
      ...client,
      points: newPoints,
      tier: newTier,
      lastVisit: nowIso,
    };

    setClients((prev) => prev.map((c) => (c.id === client.id ? updatedClient : c)));
    setTransactions((prev) => [transaction, ...prev]);
    setSelectedClient(updatedClient);
    setActiveReceipt(transaction);

    playAudioChime('redeem');
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.65 },
    });

    return { success: true, transaction };
  };

  // 4. Register new client
  const registerClient = (
    clientData: Omit<Client, 'id' | 'points' | 'tier' | 'totalSpent' | 'totalVisits' | 'createdAt' | 'lastVisit'> & { initialPointsBonus?: boolean }
  ): Client => {
    const nowIso = new Date().toISOString();
    const bonus = clientData.initialPointsBonus !== false ? config.welcomeBonusPoints : 0;
    const initialTier = calculateTier(bonus);

    const newClient: Client = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      name: clientData.name.trim(),
      phone: clientData.phone.trim(),
      email: clientData.email?.trim() || '',
      points: bonus,
      tier: initialTier,
      totalSpent: 0,
      totalVisits: 1,
      birthDate: clientData.birthDate || '',
      notes: clientData.notes || '',
      createdAt: nowIso,
      lastVisit: nowIso,
    };

    let bonusTx: Transaction | null = null;
    if (bonus > 0) {
      bonusTx = {
        id: `tx-${Date.now()}`,
        ticketNumber: generateTicketNumber(),
        clientId: newClient.id,
        clientName: newClient.name,
        clientPhone: newClient.phone,
        type: 'BONO',
        pointsDelta: bonus,
        cashierName: config.currentCashier.split(' ')[0] || 'Cajero',
        notes: 'Bono de bienvenida por registro en Submigueleños',
        timestamp: nowIso,
      };
    }

    setClients((prev) => [newClient, ...prev]);
    if (bonusTx) {
      setTransactions((prev) => [bonusTx, ...prev]);
      setActiveReceipt(bonusTx);
    }
    setSelectedClient(newClient);
    playAudioChime('earn');

    return newClient;
  };

  // 5. Update existing client
  const updateClient = (updated: Client) => {
    const calculated = {
      ...updated,
      tier: calculateTier(updated.points),
    };
    setClients((prev) => prev.map((c) => (c.id === updated.id ? calculated : c)));
    if (selectedClient?.id === updated.id) {
      setSelectedClient(calculated);
    }
  };

  // 6. Manual Adjustment (e.g. from Backoffice CRM)
  const manualAdjustPoints = (clientId: string, pointsDelta: number, reason: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return { success: false, error: 'Cliente no encontrado' };

    const newPoints = Math.max(0, client.points + pointsDelta);
    const newTier = calculateTier(newPoints);
    const nowIso = new Date().toISOString();

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      ticketNumber: generateTicketNumber(),
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      type: 'AJUSTE',
      pointsDelta,
      cashierName: 'Administración',
      notes: reason || 'Ajuste manual desde Backoffice',
      timestamp: nowIso,
    };

    const updatedClient: Client = {
      ...client,
      points: newPoints,
      tier: newTier,
    };

    setClients((prev) => prev.map((c) => (c.id === client.id ? updatedClient : c)));
    setTransactions((prev) => [transaction, ...prev]);
    if (selectedClient?.id === client.id) {
      setSelectedClient(updatedClient);
    }

    return { success: true, transaction };
  };

  // 7. Rewards management
  const addReward = (reward: Omit<Reward, 'id' | 'redeemedCount'>) => {
    const newReward: Reward = {
      ...reward,
      id: `rew-${Date.now().toString().slice(-4)}`,
      redeemedCount: 0,
    };
    setRewards((prev) => [...prev, newReward]);
  };

  const updateReward = (reward: Reward) => {
    setRewards((prev) => prev.map((r) => (r.id === reward.id ? reward : r)));
  };

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  // 8. Campaign toggle
  const toggleCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  };

  // 9. Update Config
  const updateConfig = (newConfig: Partial<RestaurantConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // 10. Reset to default data
  const resetAllData = () => {
    setClients(INITIAL_CLIENTS);
    setRewards(INITIAL_REWARDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setConfig(INITIAL_CONFIG);
    setSelectedClient(INITIAL_CLIENTS[0]);
    setActiveReceipt(null);
    localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    localStorage.removeItem(STORAGE_KEYS.REWARDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    fetch(`${apiBaseUrl}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: senderIdRef.current }),
    }).catch(() => {});
  };

  // 11. Clear demo clients & transactions for real Production Start
  const clearDemoDataForProduction = () => {
    setClients([]);
    setTransactions([]);
    setRewards((prev) => prev.map((r) => ({ ...r, redeemedCount: 0 })));
    setSelectedClient(null);
    setActiveReceipt(null);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.removeItem('submiguelenos_mobile_registered_client_v1');
    fetch(`${apiBaseUrl}/api/clear-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: senderIdRef.current }),
    }).catch(() => {});
  };

  const closeReceipt = () => {
    setActiveReceipt(null);
  };

  return (
    <LoyaltyContext.Provider
      value={{
        clients,
        rewards,
        transactions,
        campaigns,
        config,
        selectedClient,
        activeReceipt,
        isServerConnected,
        networkInfo,
        canInstallAndroid: !!deferredInstallPrompt,
        isAndroidStandalone,
        installAndroidApp,
        setSelectedClient,
        findClientByPhoneOrName,
        accumulatePoints,
        redeemReward,
        redeemCustomDiscount,
        registerClient,
        updateClient,
        manualAdjustPoints,
        addReward,
        updateReward,
        deleteReward,
        toggleCampaign,
        updateConfig,
        resetAllData,
        clearDemoDataForProduction,
        closeReceipt,
        playAudioChime,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
