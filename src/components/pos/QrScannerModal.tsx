import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Scan, Camera, CameraOff } from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { Client } from '../../types';

interface QrScannerModalProps {
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ onClose, onSelectClient }) => {
  const { clients } = useLoyalty();
  const [scannedCode, setScannedCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const matchClientByCode = (rawCode: string): Client | undefined => {
    const clean = rawCode.trim().replace(/[\s-]/g, '');
    if (!clean) return undefined;
    return clients.find(
      (c) =>
        c.phone.replace(/[\s-]/g, '') === clean ||
        c.id.toLowerCase() === rawCode.trim().toLowerCase() ||
        c.name.toLowerCase().includes(rawCode.toLowerCase().trim())
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setCameraError('Navegador sin acceso directo a cámara. Usa el lector óptico USB o selección rápida.');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setCameraActive(true);
        }

        // Native BarcodeDetector if available (Chrome / Edge / Android WebView)
        const BarcodeDetectorClass = (
          window as unknown as {
            BarcodeDetector?: new (opts: { formats: string[] }) => {
              detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
            };
          }
        ).BarcodeDetector;

        if (BarcodeDetectorClass) {
          const detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
          const scanLoop = async () => {
            if (!isMounted || !videoRef.current) return;
            try {
              if (videoRef.current.readyState >= 2) {
                const codes = await detector.detect(videoRef.current);
                if (codes && codes.length > 0 && codes[0].rawValue) {
                  const found = matchClientByCode(codes[0].rawValue);
                  if (found) {
                    onSelectClient(found);
                    onClose();
                    return;
                  }
                }
              }
            } catch {
              // Ignore frame detection error
            }
            rafRef.current = requestAnimationFrame(scanLoop);
          };
          rafRef.current = requestAnimationFrame(scanLoop);
        }
      } catch {
        if (isMounted) {
          setCameraError('Permiso de cámara no concedido o sin cámara conectada. Puedes usar lector USB o ingreso manual.');
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [clients]);

  const handleSimulateScan = (client: Client) => {
    onSelectClient(client);
    onClose();
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    const found = matchClientByCode(scannedCode);
    if (found) {
      onSelectClient(found);
      onClose();
    } else {
      setScanError('No se encontró ningún cliente con ese código o celular.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-neutral-900 text-white">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm">Escáner de Tarjeta QR Submigueleños</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Live Camera Viewport + Laser Reticle */}
          <div className="relative h-52 bg-neutral-950 rounded-xl overflow-hidden flex flex-col items-center justify-center border border-neutral-800">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                cameraActive ? 'opacity-90' : 'opacity-0'
              }`}
            />

            {/* Laser scanning bar */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce z-10" />

            {/* Target Reticle */}
            <div className="w-32 h-32 border-2 border-amber-400/80 rounded-xl relative flex items-center justify-center bg-amber-400/5 z-10">
              {!cameraActive && <QrCode className="w-14 h-14 text-neutral-600 animate-pulse" />}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400 -translate-x-0.5 -translate-y-0.5" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400 translate-x-0.5 -translate-y-0.5" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400 -translate-x-0.5 translate-y-0.5" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400 translate-x-0.5 translate-y-0.5" />
            </div>

            <div className="relative z-10 mt-2 px-3 py-1 rounded-full bg-black/70 text-[11px] text-neutral-200 font-mono flex items-center gap-1.5">
              {cameraActive ? (
                <>
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cámara activa: apunta al QR del celular del cliente</span>
                </>
              ) : (
                <>
                  <CameraOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>{cameraError || 'Iniciando cámara...'}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick client tap selection */}
          {clients.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-2">
                Selección rápida de clientes registrados:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {clients.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSimulateScan(c)}
                    className="flex items-center justify-between p-2 text-left bg-neutral-50 hover:bg-amber-50 hover:border-amber-300 border border-neutral-200 rounded-xl transition-all group cursor-pointer"
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs font-semibold text-neutral-800 group-hover:text-amber-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono">{c.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-amber-600 shrink-0 tabular-nums">
                      {c.points} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* USB Barcode / Manual input fallback */}
          <form onSubmit={handleManualCodeSubmit} className="pt-2 border-t border-neutral-100 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Lector óptico USB o escribe celular..."
                value={scannedCode}
                onChange={(e) => {
                  setScanError('');
                  setScannedCode(e.target.value);
                }}
                className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-amber-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                Cargar
              </button>
            </div>
            {scanError && <p className="text-[11px] text-rose-600 font-medium">{scanError}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};
