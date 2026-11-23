import React, { useState } from 'react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import { WifiOff, Download, X } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

export const OfflineBanner: React.FC = () => {
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);

  return (
    <>
      {/* Offline Status Warning Indicator */}
      {!isOnline && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/95 text-black text-xs font-extrabold shadow-2xl flex items-center gap-2 animate-bounce backdrop-blur-md">
          <WifiOff className="w-4 h-4" />
          <span>{t.offlineModeBanner}</span>
        </div>
      )}

      {/* PWA Install Banner */}
      {!isInstalled && !dismissedInstall && (isInstallable || isIOS) && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto p-3 rounded-2xl bg-zinc-900/95 border border-zinc-800 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#25F4EE] to-[#fe2c55] flex items-center justify-center text-white shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-white">{t.installTikTokTitle}</h4>
              <p className="text-[10px] text-zinc-400">{t.installAppSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (isInstallable) {
                  install();
                } else if (isIOS) {
                  setShowInstallGuide(true);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#fe2c55] hover:bg-[#e0264b] text-white text-xs font-extrabold shadow-md active:scale-95 transition whitespace-nowrap"
            >
              {t.installBtn}
            </button>
            <button
              onClick={() => setDismissedInstall(true)}
              className="p-1 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-2xl bg-zinc-900 border border-zinc-800 p-5 text-white space-y-3">
            <h3 className="text-sm font-extrabold">{t.iosInstallTitle}</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {t.iosInstallStep1}<br />
              {t.iosInstallStep2}
            </p>
            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2 rounded-xl bg-zinc-800 text-xs font-bold text-white hover:bg-zinc-700"
            >
              {t.doneBtn}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
