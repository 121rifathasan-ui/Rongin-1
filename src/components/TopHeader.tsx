import React from 'react';
import { Search, Globe } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

interface TopHeaderProps {
  activeFeedTab: 'following' | 'foryou';
  onSelectFeedTab: (tab: 'following' | 'foryou') => void;
  onSearchClick: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeFeedTab,
  onSelectFeedTab,
  onSearchClick,
}) => {
  const { currentLanguageInfo, openLanguageModal, t } = useLanguage();

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 pt-2.5 pb-2 select-none pointer-events-none">
      {/* Left Spacer to keep Following | For You centered */}
      <div className="w-16 sm:w-20" />

      {/* Following vs For You Tabs */}
      <div className="pointer-events-auto flex items-center gap-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => onSelectFeedTab('following')}
          className={`relative text-[14px] sm:text-[15px] font-bold transition-colors ${
            activeFeedTab === 'following' ? 'text-white font-extrabold' : 'text-white/60 hover:text-white/80'
          }`}
        >
          {t.following}
          {activeFeedTab === 'following' && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-white animate-scale-up" />
          )}
        </button>

        <span className="text-white/30 text-xs">|</span>

        <button
          onClick={() => onSelectFeedTab('foryou')}
          className={`relative text-[15px] sm:text-[16px] font-bold transition-colors ${
            activeFeedTab === 'foryou' ? 'text-white font-black' : 'text-white/60 hover:text-white/80'
          }`}
        >
          {t.forYou}
          {activeFeedTab === 'foryou' && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full bg-white animate-scale-up" />
          )}
        </button>
      </div>

      {/* Language Switch Toggle & Search Icon */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        {/* Language Selector Pill */}
        <button
          onClick={openLanguageModal}
          className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-zinc-700/80 hover:border-zinc-500 text-[11px] font-black flex items-center gap-1.5 text-white active:scale-95 transition drop-shadow shadow-sm"
          title={t.selectLanguageTitle}
        >
          <Globe className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span className="text-xs leading-none">{currentLanguageInfo.flag}</span>
          <span className="text-[#FE2C55] font-bold">
            {currentLanguageInfo.shortLabel}
          </span>
        </button>

        {/* Search Icon */}
        <button
          onClick={onSearchClick}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/90 hover:text-white active:scale-90 transition drop-shadow border border-white/10"
          title={t.search}
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
