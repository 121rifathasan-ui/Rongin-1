import React from 'react';
import { Home, Compass, Plus, MessageSquare, User } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

interface BottomNavProps {
  activeTab: 'home' | 'discover' | 'inbox' | 'profile';
  onSelectTab: (tab: 'home' | 'discover' | 'inbox' | 'profile') => void;
  onOpenUpload: () => void;
  unreadInboxCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenUpload,
  unreadInboxCount,
}) => {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-black/95 backdrop-blur-md border-t border-zinc-900 flex items-center justify-around px-2 select-none">
      {/* Home */}
      <button
        id="nav-home-btn"
        onClick={() => onSelectTab('home')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
          activeTab === 'home' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] font-bold tracking-tight">{t.home}</span>
      </button>

      {/* Discover / Explore */}
      <button
        id="nav-discover-btn"
        onClick={() => onSelectTab('discover')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
          activeTab === 'discover' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] font-bold tracking-tight">{t.discover}</span>
      </button>

      {/* Create / Upload Video Center Button */}
      <div className="flex-1 flex items-center justify-center">
        <button
          id="nav-upload-btn"
          onClick={onOpenUpload}
          className="relative group active:scale-90 transition-transform"
          title={t.createVideo}
        >
          {/* Authentic Rongin Cyan & Pink gradient blocks */}
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-[#25F4EE] via-[#FE2C55] to-[#FFB800] p-[2px] shadow-lg shadow-[#fe2c55]/20 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center text-black">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
          </div>
        </button>
      </div>

      {/* Inbox */}
      <button
        id="nav-inbox-btn"
        onClick={() => onSelectTab('inbox')}
        className={`relative flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
          activeTab === 'inbox' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 ${activeTab === 'inbox' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {unreadInboxCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1 py-0.2 min-w-3.5 h-3.5 rounded-full bg-[#fe2c55] text-white text-[9px] font-black flex items-center justify-center border-2 border-black">
              {unreadInboxCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold tracking-tight">{t.inbox}</span>
      </button>

      {/* Profile */}
      <button
        id="nav-profile-btn"
        onClick={() => onSelectTab('profile')}
        className={`flex-1 flex flex-col items-center justify-center gap-1 active:scale-95 transition ${
          activeTab === 'profile' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] font-bold tracking-tight">{t.profile}</span>
      </button>
    </div>
  );
};
