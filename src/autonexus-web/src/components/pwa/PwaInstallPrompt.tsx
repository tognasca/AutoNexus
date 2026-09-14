import { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-xs md:text-sm font-medium z-50">
      <div className="flex items-center gap-2">
        <Smartphone size={20} className="shrink-0" />
        <span>Instale o **AutoNexus** no seu dispositivo para acesso rápido!</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="bg-white text-blue-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow transition-all active:scale-95 cursor-pointer"
        >
          <Download size={14} />
          Instalar App
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
