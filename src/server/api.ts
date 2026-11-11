import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import pg from 'pg';
import {
  INITIAL_CLIENTS,
  INITIAL_REWARDS,
  INITIAL_TRANSACTIONS,
  INITIAL_CAMPAIGNS,
  INITIAL_CONFIG,
} from '../data/initialData';
import {
  Client,
  Reward,
  Transaction,
  LoyaltyCampaign,
  RestaurantConfig,
} from '../types';

export interface DatabaseState {
  clients: Client[];
  rewards: Reward[];
  transactions: Transaction[];
  campaigns: LoyaltyCampaign[];
  config: RestaurantConfig;
  updatedAt: string;
}

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lealresto-db.json');

// Optional Cloud PostgreSQL Connection Pool (Railway / Render / Supabase / Neon)
const DATABASE_URL = process.env.DATABASE_URL || '';
const pgPool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl:
        DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
    })
  : null;

function getInitialState(): DatabaseState {
  return {
    clients: INITIAL_CLIENTS,
    rewards: INITIAL_REWARDS,
    transactions: INITIAL_TRANSACTIONS,
    campaigns: INITIAL_CAMPAIGNS,
    config: INITIAL_CONFIG,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeState(parsed: Partial<DatabaseState> | null | undefined): DatabaseState {
  if (!parsed) return getInitialState();
  return {
    clients: Array.isArray(parsed.clients) ? parsed.clients : INITIAL_CLIENTS,
    rewards: Array.isArray(parsed.rewards) ? parsed.rewards : INITIAL_REWARDS,
    transactions: Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL_TRANSACTIONS,
    campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : INITIAL_CAMPAIGNS,
    config: parsed.config ? { ...INITIAL_CONFIG, ...parsed.config } : INITIAL_CONFIG,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
  };
}

function loadLocalDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialState();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    return normalizeState(parsed);
  } catch (err) {
    console.error('[Submigueleños DB] Error loading local database, using initial state:', err);
    return getInitialState();
  }
}

function saveLocalDatabase(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[Submigueleños DB] Error saving local database:', err);
  }
}

async function initCloudDatabase(fallbackState: DatabaseState): Promise<DatabaseState> {
  if (!pgPool) return fallbackState;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS submiguelenos_store (
        id INTEGER PRIMARY KEY DEFAULT 1,
        state JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const res = await pgPool.query('SELECT state FROM submiguelenos_store WHERE id = 1');
    if (res.rows.length > 0 && res.rows[0].state) {
      const cloudState = normalizeState(res.rows[0].state);
      saveLocalDatabase(cloudState);
      console.log('☁️ [Submigueleños DB] Conectado a PostgreSQL en la nube exitosamente.');
      return cloudState;
    } else {
      await pgPool.query(
        'INSERT INTO submiguelenos_store (id, state, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET state = $1, updated_at = NOW()',
        [JSON.stringify(fallbackState)]
      );
      console.log('☁️ [Submigueleños DB] Base de datos PostgreSQL inicializada con éxito.');
      return fallbackState;
    }
  } catch (err) {
    console.error('⚠️ [Submigueleños DB] Error conectando a PostgreSQL, usando almacenamiento en disco:', err);
    return fallbackState;
  }
}

async function persistDatabase(state: DatabaseState): Promise<void> {
  saveLocalDatabase(state);
  if (pgPool) {
    try {
      await pgPool.query(
        'INSERT INTO submiguelenos_store (id, state, updated_at) VALUES (1, $1, NOW()) ON CONFLICT (id) DO UPDATE SET state = $1, updated_at = NOW()',
        [JSON.stringify(state)]
      );
    } catch (err) {
      console.error('⚠️ [Submigueleños DB] Error guardando en PostgreSQL:', err);
    }
  }
}

/**
 * Smart merge that prevents two concurrent clients (e.g. a customer registering on Android APK
 * while a cashier is adding points on POS) from overwriting each other's new records.
 */
function mergeIncomingState(current: DatabaseState, incoming: Partial<DatabaseState>): DatabaseState {
  // 1. Merge Clients by ID (union of existing + incoming, incoming updates matching IDs)
  let mergedClients = current.clients;
  if (Array.isArray(incoming.clients)) {
    const incomingMap = new Map<string, Client>();
    for (const c of incoming.clients) {
      if (c && c.id) incomingMap.set(c.id, c);
    }
    // Keep any newly registered client in `current` that wasn't in `incoming` yet
    const missingFromIncoming = current.clients.filter(
      (c) => !incomingMap.has(c.id) && Date.now() - new Date(c.createdAt).getTime() < 60000
    );
    mergedClients = [...missingFromIncoming, ...incoming.clients];
  }

  // 2. Merge Transactions by ID (never lose a recent transaction from another device)
  let mergedTransactions = current.transactions;
  if (Array.isArray(incoming.transactions)) {
    const seenIds = new Set<string>();
    const combined = [...incoming.transactions, ...current.transactions];
    mergedTransactions = [];
    for (const tx of combined) {
      if (tx && tx.id && !seenIds.has(tx.id)) {
        seenIds.add(tx.id);
        mergedTransactions.push(tx);
      }
    }
    mergedTransactions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return {
    clients: mergedClients,
    rewards: Array.isArray(incoming.rewards) ? incoming.rewards : current.rewards,
    transactions: mergedTransactions,
    campaigns: Array.isArray(incoming.campaigns) ? incoming.campaigns : current.campaigns,
    config: incoming.config ? { ...current.config, ...incoming.config } : current.config,
    updatedAt: new Date().toISOString(),
  };
}

function getLocalLanIps(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;
    for (const net of netList) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.sort((a, b) => {
    const aScore = a.startsWith('192.168.') ? 2 : a.startsWith('10.') ? 1 : 0;
    const bScore = b.startsWith('192.168.') ? 2 : b.startsWith('10.') ? 1 : 0;
    return bScore - aScore;
  });
}

export function createApiRouter(port = 3000) {
  const router = express.Router();

  // Enable CORS so the native Android APK (file:// or capacitor://) can sync from anywhere (4G/5G/Wi-Fi)
  router.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  router.use(express.json({ limit: '5mb' }));

  let dbState: DatabaseState = loadLocalDatabase();
  const sseClients = new Set<Response>();

  // Initialize PostgreSQL asynchronously if DATABASE_URL is configured
  initCloudDatabase(dbState).then((loaded) => {
    dbState = loaded;
  });

  const broadcastState = (senderId?: string) => {
    const payload = JSON.stringify({
      type: 'STATE_UPDATED',
      senderId: senderId || null,
      state: dbState,
    });
    for (const clientRes of sseClients) {
      try {
        clientRes.write(`data: ${payload}\n\n`);
      } catch {
        sseClients.delete(clientRes);
      }
    }
  };

  // Health & Network discovery for Android QR code installation
  router.get('/network-info', (req: Request, res: Response) => {
    const ips = getLocalLanIps();
    const hostHeader = req.headers.host || `localhost:${port}`;
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol =
      (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ||
      req.protocol ||
      'http';
    const primaryIp = ips[0] || 'localhost';
    const isLocalhost =
      hostHeader.startsWith('localhost') || hostHeader.startsWith('127.0.0.1');

    const baseUrl = process.env.PUBLIC_SERVER_URL
      ? process.env.PUBLIC_SERVER_URL.replace(/\/+$/, '')
      : isLocalhost
      ? `${protocol}://${primaryIp}:${port}`
      : `${protocol}://${hostHeader}`;

    const apkPath = path.resolve(process.cwd(), 'public', 'Submiguelenos.apk');
    const apkAvailable = fs.existsSync(apkPath);

    res.json({
      status: 'ok',
      databaseMode: pgPool ? 'postgresql-cloud' : 'persistent-json',
      ips,
      port,
      baseUrl,
      androidAppUrl: `${baseUrl}/?app=android`,
      apkDownloadUrl: `${baseUrl}/api/download-apk`,
      apkAvailable,
      posUrl: `${baseUrl}/?view=POS`,
      updatedAt: dbState.updatedAt,
    });
  });

  // Direct APK Download Endpoint
  router.get('/download-apk', (_req: Request, res: Response) => {
    const apkPath = path.resolve(process.cwd(), 'public', 'Submiguelenos.apk');
    const fallbackApkPath = path.resolve(process.cwd(), 'public', 'LealResto.apk');
    const targetPath = fs.existsSync(apkPath) ? apkPath : fallbackApkPath;
    if (!fs.existsSync(targetPath)) {
      res.status(404).send('El archivo Submiguelenos.apk aún se está generando.');
      return;
    }
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Submiguelenos.apk"');
    res.sendFile(targetPath);
  });

  // Get full loyalty state
  router.get('/state', (_req: Request, res: Response) => {
    res.json(dbState);
  });

  // Real-time Server-Sent Events (SSE) stream for live POS <-> Android sync
  router.get('/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(
      `data: ${JSON.stringify({ type: 'INIT', state: dbState })}\n\n`
    );

    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Sync state updates with smart concurrency protection
  router.put('/state', async (req: Request, res: Response) => {
    const { clients, rewards, transactions, campaigns, config, senderId } = req.body || {};

    dbState = mergeIncomingState(dbState, {
      clients,
      rewards,
      transactions,
      campaigns,
      config,
    });

    await persistDatabase(dbState);
    broadcastState(senderId);

    res.json({ ok: true, updatedAt: dbState.updatedAt });
  });

  // Reset to initial demo state
  router.post('/reset', async (req: Request, res: Response) => {
    const { senderId } = req.body || {};
    dbState = getInitialState();
    await persistDatabase(dbState);
    broadcastState(senderId);
    res.json({ ok: true, state: dbState });
  });

  // Clear demo clients & transactions for clean Production Launch
  router.post('/clear-demo', async (req: Request, res: Response) => {
    const { senderId } = req.body || {};
    dbState = {
      ...dbState,
      clients: [],
      transactions: [],
      rewards: dbState.rewards.map((r) => ({ ...r, redeemedCount: 0 })),
      updatedAt: new Date().toISOString(),
    };
    await persistDatabase(dbState);
    broadcastState(senderId);
    res.json({ ok: true, state: dbState });
  });

  return router;
}
