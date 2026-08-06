import React from 'react';
import { Heart, ShieldCheck, Users, Send, Volume2, VolumeX } from 'lucide-react';
import { soundFx } from './SoundManager';

interface NavbarProps {
  currentTab: 'admin' | 'users' | 'broadcast';
  setCurrentTab: (tab: 'admin' | 'users' | 'broadcast') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  soundEnabled,
  setSoundEnabled,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.enabled = next;
    if (next) soundFx.playPop();
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/20 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('admin')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-md shadow-purple-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-400 fill-purple-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 via-pink-200 to-amber-200 bg-clip-text text-transparent">
                پنل اختصاصی ربات قرار ✨
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">
                مدیریت کل
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">مدیریت کاربران، لیست دعوت‌ها و ارسال پیام همگانی</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => {
              soundFx.playPop();
              setCurrentTab('admin');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
              currentTab === 'admin'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>داشبورد و آمار</span>
          </button>

          <button
            onClick={() => {
              soundFx.playPop();
              setCurrentTab('users');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
              currentTab === 'users'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>کاربران ربات 👥</span>
          </button>

          <button
            onClick={() => {
              soundFx.playPop();
              setCurrentTab('broadcast');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${
              currentTab === 'broadcast'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>ارسال پیام همگانی 📢</span>
          </button>
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
        </div>
      </div>
    </header>
  );
};
