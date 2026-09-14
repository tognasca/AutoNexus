import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(true);

  useEffect(() => {
    // 1. Verifica se já está rodando como app instalado
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMedia || isIosStandalone);
    };

    // 2. Detecta se é iOS/Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|android/.test(userAgent);
    
    setIsIos(isIosDevice && isSafari);
    checkStandalone();

    // 3. Captura o evento nativo de instalação do Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', checkStandalone);
    };
  }, []);

  // Se já estiver instalado, não renderiza nada
  if (isStandalone) return null;

  // Ação de instalação no Android / Desktop Chrome
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* Botão de Instalação para Android / Chrome */}
      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-sm transition-all"
          title="Instalar AutoNexus no smartphone"
        >
          <Smartphone className="w-4 h-4" />
          <span>Instalar App</span>
          <Download className="w-3.5 h-3.5 opacity-80" />
        </button>
      )}

      {/* Banner Orientativo para iOS / Safari */}
      {isIos && showIosBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900 border border-slate-700 text-slate-100 p-4 rounded-xl shadow-2xl flex items-start justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg shrink-0 mt-0.5">
              <Share className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Instalar o AutoNexus no iPhone</p>
              <p className="text-slate-300 mt-1">
                Toque no ícone de <strong className="text-white">Compartilhar</strong> na barra do Safari e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowIosBanner(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};