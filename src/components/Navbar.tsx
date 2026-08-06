import React from 'react';
import { Heart, ShieldCheck, Users, Send, Volume2, VolumeX } from 'lucide-react';
import { soundFx } from './SoundManager';

interface NavbarProps {
  currentTab: 'admin' | 'users' | 'broadcast';
  setCurrentTab: (tab: 'admin' | 'users' | 'broadcast') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  soundEnabled,
  setSoundEnabled,
  onLogout,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
    if (next) soundFx.playPop();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/20 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('admin')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-md shadow-purple-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-400 fill-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                پنل مدیریت ربات قرار ✨
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">
                مدیریت کل
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans hidden sm:block">مدیریت آمار، کاربران، لیست دعوت‌ها و تنظیمات ربات</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'صدا فعال است' : 'صدا غیرفعال است'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1 shrink-0"
              title="خروج از پنل مدیریت"
            >
              <span>خروج</span>
              <span>🚪</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
