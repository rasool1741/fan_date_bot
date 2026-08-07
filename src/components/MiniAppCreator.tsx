import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Send, Copy, Check, Eye, User, Sparkle, RefreshCw, Lock } from 'lucide-react';
import { InviteSession, AppSettings } from '../types';

interface MiniAppCreatorProps {
  settings: AppSettings;
  onOpenAdminLogin?: () => void;
  onBackToAdminPanel?: () => void;
}

export const MiniAppCreator: React.FC<MiniAppCreatorProps> = ({
  settings,
  onOpenAdminLogin,
  onBackToAdminPanel,
}) => {
  const [dateType, setDateType] = useState<'fun' | 'formal'>('fun');
  const [inviteeName, setInviteeName] = useState<string>('');
  const [inviterName, setInviterName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [createdInvite, setCreatedInvite] = useState<InviteSession | null>(null);
  const [botUsername, setBotUsername] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Auto detect Telegram user name if opened inside Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      try {
        const tg = (window as any).Telegram.WebApp;
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user?.first_name) {
          setInviterName(user.first_name + (user.last_name ? ` ${user.last_name}` : ''));
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let inviterChatId: number | string | undefined = undefined;
      if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
        const tgUser = (window as any).Telegram.WebApp.initDataUnsafe?.user;
        if (tgUser?.id) {
          inviterChatId = tgUser.id;
        }
      }

      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviterName: inviterName.trim() || 'یک دوست',
          inviteeName: inviteeName.trim() || 'مخاطب خاص',
          type: dateType,
          inviterChatId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedInvite(data.invite);
        if (data.settings?.botConfig?.botUsername) {
          setBotUsername(data.settings.botConfig.botUsername);
        } else if (settings.botConfig?.botUsername) {
          setBotUsername(settings.botConfig.botUsername);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInviteLink = () => {
    if (!createdInvite) return '';
    const cleanBot = (botUsername || settings.botConfig?.botUsername || '').trim().replace(/^@/, '');
    if (cleanBot) {
      return `https://t.me/${cleanBot}?start=${createdInvite.id}`;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}?invite=${createdInvite.id}`;
  };

  const getShareText = () => {
    if (!createdInvite) return '';
    const inviteeLabel = createdInvite.inviteeName ? ` ${createdInvite.inviteeName} عزیز` : '';
    const inviterLabel = createdInvite.inviterName ? ` ${createdInvite.inviterName}` : '';
    const link = getInviteLink();

    return `سلام${inviteeLabel}! 🌹\n\n` +
      `یک دعوت‌نامه اختصاصی و جذاب برای یک دیدار خاص از طرف${inviterLabel} برای شما ارسال شده است! ✨\n\n` +
      `جهت مشاهده دعوت‌نامه و اعلام پاسخ، روی لینک زیر کلیک کنید:\n` +
      `👇👇👇\n${link}`;
  };

  const handleCopyLink = () => {
    const text = getShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareInTelegram = () => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(getInviteLink())}&text=${encodeURIComponent(
      `سلام ${createdInvite?.inviteeName || ''} عزیز! 🌹\nیک دعوت‌نامه اختصاصی برای یک دیدار خاص از طرف ${createdInvite?.inviterName || ''} برای شما ارسال شده است! ✨`
    )}`;
    
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 sm:p-6 dir-rtl" dir="rtl">
      {/* Mini App Top Header Bar */}
      <div className="flex items-center justify-between mb-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>دعوت دیدار 💌</span>
            </h1>
            <p className="text-xs text-slate-400">ساخت دعوت‌نامه اختصاصی برای مخاطب خاص</p>
          </div>
        </div>

        {onBackToAdminPanel && (
          <button
            onClick={onBackToAdminPanel}
            className="text-xs text-purple-300 hover:text-white bg-purple-500/20 hover:bg-purple-500/30 px-3 py-2 rounded-xl border border-purple-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>بازگشت به پنل مدیریت</span>
          </button>
        )}
      </div>

      {!createdInvite ? (
        /* FORM VIEW */
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مراحل ساخت دعوت‌نامه</span>
            </div>
            <h2 className="text-xl font-black text-white">نوع دیدار خود را انتخاب کنید</h2>
            <p className="text-xs text-slate-400">
              با مشخص کردن نوع دیدار و اسم مخاطب، یک لینک بازی‌گونه و جذاب برای او ساخته می‌شود.
            </p>
          </div>

          <form onSubmit={handleCreateInvite} className="space-y-6">
            {/* TYPE SELECTOR CARDS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDateType('fun')}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  dateType === 'fun'
                    ? 'bg-gradient-to-br from-purple-500/25 via-pink-500/20 to-amber-500/15 border-purple-400/80 shadow-lg shadow-purple-500/20 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🦄✨</span>
                  {dateType === 'fun' && <Sparkles className="w-4 h-4 text-purple-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">دیت فانتزی و صمیمی</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                    پر از افکت‌های جادویی، دکمه فراری و بازی‌های جذاب!
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDateType('formal')}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between space-y-3 cursor-pointer ${
                  dateType === 'formal'
                    ? 'bg-gradient-to-br from-rose-500/25 via-pink-600/20 to-red-500/15 border-rose-500/80 shadow-lg shadow-rose-500/20 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💖🌹</span>
                  {dateType === 'formal' && <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">دیت رسمی و عاشقانه</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                    با تم عاشقانه قرمز و صورتی، شعر و نظرسنجی دیدار!
                  </p>
                </div>
              </button>
            </div>

            {/* INVITEE NAME INPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-rose-400" />
                <span>نام مخاطب شما (طرف مقابل):</span>
              </label>
              <input
                type="text"
                required
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
                placeholder="مثلاً: مریم عزیز، علی جان..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>

            {/* SENDER NAME INPUT */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>نام شما (فرستنده):</span>
              </label>
              <input
                type="text"
                value={inviterName}
                onChange={(e) => setInviterName(e.target.value)}
                placeholder="نام شما"
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>در حال ساخت دعوت‌نامه...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>ساخت و دریافت لینک «دعوت دیدار» ✨</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* CREATED SUCCESS VIEW */
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white">دعوت‌نامه شما آماده شد! 💌</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              لینک و پیام جذاب آماده شد. آن را برای <b className="text-rose-400">{createdInvite.inviteeName}</b> ارسال کنید!
            </p>
          </div>

          {/* SHARE MESSAGE PREVIEW CARD */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 space-y-3 leading-relaxed relative">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px] text-slate-400 font-medium">
              <span>متن پیشنهادی جهت ارسال به مخاطب:</span>
              <span className="text-rose-400 font-mono">دعوت‌نامه #{createdInvite.id.replace('date-', '')}</span>
            </div>
            <p className="whitespace-pre-line font-sans leading-relaxed text-slate-300">
              {getShareText()}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleShareInTelegram}
              className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ارسال مستقیم در تلگرام 📱</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm border transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>متن و لینک با موفقیت کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>کپی کردن متن و لینک دعوت</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setCreatedInvite(null);
                setInviteeName('');
              }}
              className="w-full text-center text-xs text-rose-400 hover:text-rose-300 pt-2 transition-colors cursor-pointer"
            >
              + ساخت یک دعوت جدید
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
