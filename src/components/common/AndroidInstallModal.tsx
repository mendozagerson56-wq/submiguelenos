import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  X,
  Check,
  Copy,
  Wifi,
  ShieldCheck,
  ExternalLink,
  Package,
} from 'lucide-react';
import { useLoyalty } from '../../context/LoyaltyContext';
import { RealQrCode } from './RealQrCode';

interface AndroidInstallModalProps {
  onClose: () => void;
  onLaunchNativeView?: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  onClose,
  onLaunchNativeView,
}) => {
  const {
    config,
    networkInfo,
    isServerConnected,
    canInstallAndroid,
    isAndroidStandalone,
    installAndroidApp,
  } = useLoyalty();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [qrMode, setQrMode] = useState<'APK' | 'WEBAPP'>('APK');

  const fallbackOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const baseUrl = networkInfo?.baseUrl || fallbackOrigin;
  const apkDirectUrl = `${baseUrl}/Submiguelenos.apk`;
  const androidAppUrl = networkInfo?.androidAppUrl || `${baseUrl}/?app=android`;

  const activeQrUrl = qrMode === 'APK' ? apkDirectUrl : androidAppUrl;

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(activeQrUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleNativeInstall = async () => {
    const installed = await installAndroidApp();
    if (installed) {
      setInstallSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight">
                  Descargar APK de Submigueleños
                </h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                  Submiguelenos.apk Oficial
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {config.restaurantName} · Instalador directo para teléfonos Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* PRIMARY CTA: Direct APK Download Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full text-emerald-200">
                <Package className="w-3 h-3" />
                <span>Instalador Nativo Android (.APK)</span>
              </div>
              <h4 className="font-extrabold text-base leading-tight">
                Descargar Submiguelenos.apk
              </h4>
              <p className="text-xs text-emerald-100">
                Descarga el archivo APK firmado de Submigueleños e instálalo directamente en tu teléfono Android.
              </p>
            </div>

            <a
              href="/api/download-apk"
              download="Submiguelenos.apk"
              className="w-full sm:w-auto shrink-0 px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-950 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>Descargar APK</span>
            </a>
          </div>

          {/* Optional WebAPK prompt if supported */}
          {canInstallAndroid && !installSuccess && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
              <span className="text-xs text-amber-950 font-medium">
                También puedes instalarla como App Rápida (PWA) desde el navegador:
              </span>
              <button
                onClick={handleNativeInstall}
                className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Instalar PWA
              </button>
            </div>
          )}

          {installSuccess || isAndroidStandalone ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡La aplicación Submigueleños ya está instalada en modo nativo!</span>
            </div>
          ) : null}

          {/* QR Code + Scan Instructions */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
              <span className="text-xs font-bold text-neutral-800">
                Escanea con la cámara de tu Android:
              </span>
              <div className="flex gap-1 bg-neutral-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setQrMode('APK')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    qrMode === 'APK'
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  QR Descarga .APK
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('WEBAPP')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    qrMode === 'WEBAPP'
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  QR App Web
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-1">
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm">
                  <RealQrCode value={activeQrUrl} size={148} />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 mt-2 uppercase tracking-wider flex items-center gap-1">
                  <QrCode className="w-3 h-3" />
                  <span>
                    {qrMode === 'APK' ? 'Descarga Directa APK' : 'Abrir App Móvil'}
                  </span>
                </span>
              </div>

              <div className="sm:col-span-7 space-y-2.5 text-xs">
                <h4 className="font-extrabold text-neutral-900 text-xs">
                  Pasos para instalar el APK en tu teléfono:
                </h4>
                <ol className="space-y-1.5 text-neutral-600 list-decimal list-inside text-[11px]">
                  <li>
                    Conecta tu teléfono al mismo Wi-Fi y{' '}
                    <strong className="text-neutral-900">escanea el código QR</strong> (o envía el archivo{' '}
                    <code className="bg-neutral-200 px-1 rounded">Submiguelenos.apk</code> por WhatsApp/cable).
                  </li>
                  <li>
                    Se descargará <strong className="text-emerald-700">Submiguelenos.apk</strong> en tu celular.
                  </li>
                  <li>
                    Abre el archivo descargado y pulsa <strong>&quot;Instalar&quot;</strong> (si Android pregunta <em>&quot;Instalar de todos modos&quot;</em>, acéptalo).
                  </li>
                </ol>

                <div className="pt-1">
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-neutral-200">
                    <Wifi
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isServerConnected ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    />
                    <span className="font-mono text-[11px] text-neutral-700 truncate flex-1">
                      {activeQrUrl}
                    </span>
                    <button
                      onClick={handleCopyUrl}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {copiedUrl ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-neutral-100">
            <a
              href="/?app=android"
              onClick={(e) => {
                if (onLaunchNativeView) {
                  e.preventDefault();
                  onLaunchNativeView();
                  onClose();
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Probar Vista Nativa Android</span>
            </a>

            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
