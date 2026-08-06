import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TelegramBotSimulator } from './components/TelegramBotSimulator';
import { FunInviteeFlow } from './components/FunInviteeFlow';
import { FormalInviteeFlow } from './components/FormalInviteeFlow';
import { AdminPanel } from './components/AdminPanel';
import { defaultSettings, defaultDemoInvites } from './data/defaultData';
import { AppSettings, InviteSession, StatsOverview } from './types';
import { soundFx } from './components/SoundManager';
import { Heart, Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'admin' | 'users' | 'broadcast'>('admin');
  const [adminSubTab, setAdminSubTab] = useState<'stats' | 'invites' | 'users' | 'broadcast' | 'questions' | 'bot'>('stats');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isStandaloneGuestMode, setIsStandaloneGuestMode] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [invites, setInvites] = useState<InviteSession[]>(defaultDemoInvites);
  const [stats, setStats] = useState<StatsOverview>({
    totalInvites: defaultDemoInvites.length,
    totalViews: 6,
    totalAccepted: 2,
    totalDeclined: 0,
    totalPending: 1,
    funCount: 2,
    formalCount: 1,
    acceptanceRate: 100,
  });

  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [activeInvite, setActiveInvite] = useState<InviteSession | null>(null);
  const [loadingInvite, setLoadingInvite] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch initial backend data & parse URL invite params
  const fetchData = async () => {
    try {
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData: AppSettings = await settingsRes.json();
        
        // Restore/Backup sync with localStorage
        if (typeof window !== 'undefined') {
          const cachedToken = localStorage.getItem('telegram_bot_token');
          if (!settingsData.botConfig?.botToken && cachedToken) {
            settingsData.botConfig = { ...settingsData.botConfig, botToken: cachedToken };
            fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(settingsData),
            });
          } else if (settingsData.botConfig?.botToken) {
            localStorage.setItem('telegram_bot_token', settingsData.botConfig.botToken);
          }
        }

        setSettings(settingsData);
      }

      const invitesRes = await fetch('/api/invites');
      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvites(data.invites);
        setStats(data.stats);
      }
    } catch (err) {
      console.warn('Backend endpoint unreachable, using standard defaults', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Live background polling every 3 seconds for instant syncing with backend & Telegram
    const pollInterval = setInterval(() => {
      fetchData();
    }, 3000);

    // Check URL parameters for ?invite=id
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const inviteId = urlParams.get('invite');
      if (inviteId) {
        loadInviteSession(inviteId);
        setCurrentTab('invitee');
        setIsStandaloneGuestMode(true);
      }
    }

    return () => clearInterval(pollInterval);
  }, []);

  // Fetch specific invite details from server
  const loadInviteSession = async (inviteId: string) => {
    setLoadingInvite(true);
    setActiveInviteId(inviteId);
    try {
      const res = await fetch(`/api/invites/${inviteId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveInvite(data.invite);
        if (data.settings) setSettings(data.settings);
      } else {
        // Fallback to local memory if server returned 404
        const local = invites.find((i) => i.id === inviteId);
        if (local) {
          setActiveInvite(local);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleInviteCreated = (newInvite: InviteSession) => {
    setInvites((prev) => [newInvite, ...prev]);
    setActiveInviteId(newInvite.id);
    setActiveInvite(newInvite);
    fetchData();
  };

  const handleOpenInvitePage = (inviteId: string) => {
    loadInviteSession(inviteId);
    setCurrentTab('invitee');
    setIsStandaloneGuestMode(true);
  };

  const handleRespondToInvite = async (responses: any, status: 'accepted' | 'declined') => {
    if (!activeInviteId) return;

    try {
      const body =
        activeInvite?.type === 'fun'
          ? { funResponses: responses, status }
          : { formalResponses: responses, status };

      const res = await fetch(`/api/invites/${activeInviteId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveInvite(data.invite);
        fetchData();

        if (status === 'accepted') {
          showToast(`🎉 خبر خوش: مخاطب دعوت ${data.invite.inviterName} را قبول کرد!`);
        } else {
          showToast(`🌸 پاسخ مخاطب ثبت شد.`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      if (typeof window !== 'undefined' && newSettings.botConfig?.botToken) {
        localStorage.setItem('telegram_bot_token', newSettings.botConfig.botToken);
      }
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSettings = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('telegram_bot_token');
      }
      const res = await fetch('/api/settings/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      await fetch(`/api/invites/${id}`, { method: 'DELETE' });
      setInvites((prev) => prev.filter((i) => i.id !== id));
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // STANDALONE GUEST VIEW (When opened via Telegram Invite Link)
  if (isStandaloneGuestMode && activeInvite) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col justify-center items-center p-4 dir-rtl" dir="rtl">
        {/* Toast Notification Banner */}
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 text-xs md:text-sm font-bold flex items-center gap-2 animate-bounce">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>{notification}</span>
          </div>
        )}

        {/* Clean Standalone Card - No admin access link for invitees */}
        <div className="w-full max-w-2xl my-auto animate-fade-in">
          {loadingInvite ? (
            <div className="text-center py-20 text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-400" />
              <span>در حال بارگذاری دعوتنامه...</span>
            </div>
          ) : activeInvite.type === 'fun' ? (
            <FunInviteeFlow
              invite={activeInvite}
              settings={settings}
              onRespond={handleRespondToInvite}
            />
          ) : (
            <FormalInviteeFlow
              invite={activeInvite}
              settings={settings}
              onRespond={handleRespondToInvite}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col dir-rtl" dir="rtl">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 text-xs md:text-sm font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'users') setAdminSubTab('users');
          if (tab === 'broadcast') setAdminSubTab('broadcast');
          if (tab === 'admin') setAdminSubTab('stats');
        }}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        <AdminPanel
          invites={invites}
          stats={stats}
          settings={settings}
          activeSubTab={adminSubTab}
          setActiveSubTab={(st) => {
            setAdminSubTab(st);
            if (st === 'users') setCurrentTab('users');
            else if (st === 'broadcast') setCurrentTab('broadcast');
            else setCurrentTab('admin');
          }}
          onUpdateSettings={handleUpdateSettings}
          onResetSettings={handleResetSettings}
          onDeleteInvite={handleDeleteInvite}
          openInvitePage={handleOpenInvitePage}
        />
      </main>

      {/* Subtle Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500 font-mono">
        اپلیکیشن بازی‌گونه دعوت به دیت • طراحی شده با React + Express & Telegram WebApp Concept
      </footer>
    </div>
  );
}
