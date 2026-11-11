import express from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { createApiRouter } from './src/server/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

// Mount REST & Real-time SSE API
app.use('/api', createApiRouter(PORT));

// Direct routes for downloading Submiguelenos.apk (and alias LealResto.apk)
app.get(['/Submiguelenos.apk', '/LealResto.apk'], (_req, res) => {
  const apkPath = path.resolve(__dirname, 'public', 'Submiguelenos.apk');
  const fallbackApkPath = path.resolve(__dirname, 'public', 'LealResto.apk');
  const target = fs.existsSync(apkPath) ? apkPath : fallbackApkPath;
  if (fs.existsSync(target)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Submiguelenos.apk"');
    res.sendFile(target);
    return;
  }
  res.status(404).send('APK no encontrado. Ejecuta npm run build:apk');
});

// Serve static production frontend from dist/
const distPath = path.resolve(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Endpoint no encontrado' });
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res
      .status(200)
      .send(
        '<h1>LealResto Server Activo</h1><p>Ejecuta <code>npm run build</code> para servir la interfaz de producción.</p>'
      );
  });
}

function getLocalLanIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        if (net.address.startsWith('192.168.') || net.address.startsWith('10.')) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}

function freePortWindows(port: number): void {
  if (process.platform !== 'win32') return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    const lines = out.split(/\r?\n/).filter((l) => l.includes('LISTENING'));
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (pid && pid !== process.pid && pid > 4) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch {
          // Ignore if already exited
        }
      }
    }
  } catch {
    // Port was not in use
  }
}

function startServer(port: number, retried = false) {
  const server = app.listen(port, '0.0.0.0', () => {
    const lanIp = getLocalLanIp();
    console.log('\n============================================================');
    console.log('🚀 SUBMIGUELEÑOS - SERVIDOR DE PRODUCCIÓN ACTIVO');
    console.log('============================================================');
    console.log(`💻 Terminal Caja POS / Backoffice (Local): http://localhost:${port}`);
    console.log(`🌐 Acceso en Red Local (Wi-Fi):            http://${lanIp}:${port}`);
    console.log(`📦 Descarga Directa APK Android:           http://${lanIp}:${port}/Submiguelenos.apk`);
    console.log(`📱 App Android Web Directa:                http://${lanIp}:${port}/?app=android`);
    console.log(`💾 Base de datos persistente:              ./data/lealresto-db.json`);
    console.log('============================================================\n');
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && !retried) {
      console.log(`⚠️ Puerto ${port} ocupado por una instancia previa. Liberando puerto...`);
      freePortWindows(port);
      setTimeout(() => startServer(port, true), 600);
    } else if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.log(`⚠️ Puerto ${port} en uso, iniciando en puerto ${nextPort}...`);
      startServer(nextPort, true);
    } else {
      console.error('Error al iniciar servidor:', err);
    }
  });
}

startServer(PORT);
