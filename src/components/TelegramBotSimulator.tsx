import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Copy, Check, Sparkles, Share2, ExternalLink, RefreshCw, HeartHandshake, Play, Info } from 'lucide-react';
import { InviteType, InviteSession, AppSettings } from '../types';
import { soundFx } from './SoundManager';

interface TelegramBotSimulatorProps {
  settings: AppSettings;
  onInviteCreated: (invite: InviteSession) => void;
  openInvitePage: (inviteId: string) => void;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  settings,
  onInviteCreated,
  openInvitePage,
}) => {
  const [inviterName, setInviterName] = useState<string>('');
  const [inviteeName, setInviteeName] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [botStarted, setBotStarted] = useState<boolean>(true);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [loadingType, setLoadingType] = useState<InviteType | null>(null);
  const [generatedInvite, setGeneratedInvite] = useState<InviteSession | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [forwardSuccess, setForwardSuccess] = useState<boolean>(false);
  const [showRealBotGuide, setShowRealBotGuide] = useState<boolean>(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [botStarted, generatedInvite, isTyping]);

  const handleStartBot = () => {
    soundFx.playPop();
    setBotStarted(false);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setBotStarted(true);
    }, 450);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    soundFx.playPop();
    setChatInput('');

    if (text === '/start' || text.includes('استارت') || text.includes('start')) {
      handleStartBot();
    } else {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setBotStarted(true);
      }, 500);
    }
  };

  const handleSelectInviteType = async (type: InviteType) => {
    soundFx.playPop();
    setLoadingType(type);

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviterName: inviterName.trim() || 'کاربر عاشق',
          inviteeName: inviteeName.trim(),
          type,
        }),
      });

      const data = await res.json();
      if (data.success && data.invite) {
        setGeneratedInvite(data.invite);
        onInviteCreated(data.invite);
      }
    } catch (err) {
      console.error('Error creating invite:', err);
    } finally {
      setLoadingType(null);
    }
  };

  const getInviteLinkOnly = (invite: InviteSession) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const botUsername = settings.botConfig.botUsername?.trim().replace(/^@/, '');
    return botUsername ? `https://t.me/${botUsername}?start=${invite.id}` : `${origin}?invite=${invite.id}`;
  };

  const getFullInviteText = (invite: InviteSession) => {
    const inviteLink = getInviteLinkOnly(invite);
    const template =
      invite.type === 'fun'
        ? settings.botConfig.funInviteTemplate
        : settings.botConfig.formalInviteTemplate;

    let text = template.replace('{LINK}', inviteLink);
    if (invite.inviteeName) {
      text = `${invite.inviteeName} عزیز ❤️\n` + text;
    }
    return text;
  };

  const handleCopyText = (text: string) => {
    soundFx.playPop();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateForward = (text: string) => {
    soundFx.playPop();
    if (navigator.share) {
      navigator
        .share({
          title: 'دعوت‌نامه اختصاصی دیت ✨',
          text,
          url: getInviteLinkOnly(generatedInvite!),
        })
        .catch(() => {});
    } else {
      setForwardSuccess(true);
      setTimeout(() => setForwardSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Container simulating Telegram Chat Interface */}
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-sky-950/50 backdrop-blur-xl">
        {/* Telegram Header */}
        <div className="bg-slate-800/95 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 relative">
              <Bot className="w-6 h-6" />
              <span className="w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full absolute bottom-0 right-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-100 text-base">بات هوشمند قرارِ فان</h2>
                <span className="text-[10px] bg-sky-500/20 border border-sky-500/30 text-sky-300 px-2 py-0.5 rounded-full font-mono">
                  @DateFunBot
                </span>
              </div>
              <p className="text-xs text-sky-400">
                {isTyping ? 'در حال تایپ... 💬' : 'آنلاین • پاسخگویی آنی'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playPop();
                setShowRealBotGuide(!showRealBotGuide);
              }}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs flex items-center gap-1.5 border border-purple-500/30 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>اتصال به توکن تلگرام</span>
            </button>

            <button
              onClick={handleStartBot}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs flex items-center gap-1.5 font-bold shadow-md transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ارسال مجدد /start</span>
            </button>
          </div>
        </div>

        {/* Informational banner distinguishing Admin Panel vs User Telegram Experience */}
        <div className="bg-sky-950/60 border-b border-sky-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-sky-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>نمای کاربر در تلگرام:</strong> وقتی کاربر برای اولین بار دستور <code className="bg-sky-900/80 px-1.5 py-0.5 rounded text-sky-100 font-mono">/start</code> را ارسال کند، پیام خوش‌آمدگویی زیر همراه با کلیدهای شیشه‌ای فعال می‌شود.
            </span>
          </div>
          <span className="hidden md:inline text-[11px] text-sky-400 font-mono">
            (مدیریت متون در: «پنل مدیریت من»)
          </span>
        </div>

        {/* Real Telegram Token Guide Modal */}
        {showRealBotGuide && (
          <div className="bg-slate-950 border-b border-purple-500/30 p-5 text-xs text-slate-300 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between font-bold text-purple-300 text-sm">
              <span>🚀 راهنمای اتصال به تلگرام واقعی (Telegram Bot API):</span>
              <button
                onClick={() => setShowRealBotGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p>
              این اپلیکیشن علاوه بر شبیه‌ساز آنلاین، قابلیت اتصال مستقیم به توکن واقعی تلگرام را داراست:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 pt-1 font-mono">
              <li>وارد بات @BotFather در تلگرام شوید و دستور /newbot را بزنید.</li>
              <li>توکن اختصاصی را کپی کرده و در تب «پنل مدیریت من» &gt; «تنظیمات بات» قرار دهید.</li>
              <li>همچنین می‌توانید لینک شبیه‌ساز همین برنامه را مستقیماً به مخاطبتان در تلگرام ارسال کنید!</li>
            </ol>
          </div>
        )}

        {/* Chat Body */}
        <div className="p-6 space-y-6 min-h-[460px] max-h-[600px] overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {/* Inviter & Invitee Names Input Bar */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 max-w-xl mx-auto text-slate-300 text-sm shadow-md">
            <h3 className="font-bold text-rose-300 mb-2 flex items-center gap-2 text-xs md:text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              تنظیم اسامی پیش‌فرض قرار (اختیاری):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">نام شما (دعوت کننده):</label>
                <input
                  type="text"
                  placeholder="مثلاً: امیرحسین"
                  value={inviterName}
                  onChange={(e) => setInviterName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-medium">نام مخاطب شما:</label>
                <input
                  type="text"
                  placeholder="مثلاً: سارا جان"
                  value={inviteeName}
                  onChange={(e) => setInviteeName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* User /start message bubble */}
          <div className="flex justify-end">
            <div className="bg-sky-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm font-medium shadow-md flex items-center gap-2">
              <span>/start</span>
              <span className="text-[10px] text-sky-200 font-mono">۱۳:۲۸</span>
            </div>
          </div>

          {/* Typing Animation */}
          {isTyping && (
            <div className="flex gap-3 max-w-xs animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-bounce delay-200" />
              </div>
            </div>
          )}

          {/* Welcome Message from Bot */}
          {botStarted && !isTyping && (
            <div className="flex gap-3 max-w-2xl animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
              <div className="space-y-3 flex-1">
                {/* Speech Bubble */}
                <div className="bg-slate-800/90 border border-slate-700 text-slate-100 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-lg">
                  <p className="font-semibold text-sky-300 mb-2">
                    {inviterName.trim() ? `${inviterName} عزیز، خوش آمدی! 👋` : 'سلام رفیق! 👋'}
                  </p>
                  <p className="text-slate-200 leading-relaxed">{settings.botConfig.welcomeMessage}</p>
                </div>

                {/* Glass Inline Keyboard Buttons (کلیدهای شیشه‌ای) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleSelectInviteType('fun')}
                    disabled={loadingType !== null}
                    className="relative group overflow-hidden bg-slate-800/60 hover:bg-rose-500/20 border border-rose-500/40 hover:border-rose-500 text-rose-200 hover:text-white p-4 rounded-2xl text-right transition-all duration-300 backdrop-blur-md shadow-lg shadow-rose-950/20 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base flex items-center gap-2 text-rose-300 group-hover:text-rose-200">
                        <HeartHandshake className="w-5 h-5 text-rose-400" />
                        {settings.botConfig.funButtonText}
                      </span>
                      <span className="text-xs bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full text-rose-300 font-sans">
                        بازی‌گونه 🔥
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                      شامل دکمه خیر فراری، گزینه‌های طنز و اعلام قبولی قرار به شما!
                    </p>
                  </button>

                  <button
                    onClick={() => handleSelectInviteType('formal')}
                    disabled={loadingType !== null}
                    className="relative group overflow-hidden bg-slate-800/60 hover:bg-sky-500/20 border border-sky-500/40 hover:border-sky-500 text-sky-200 hover:text-white p-4 rounded-2xl text-right transition-all duration-300 backdrop-blur-md shadow-lg shadow-sky-950/20 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base flex items-center gap-2 text-sky-300 group-hover:text-sky-200">
                        <Sparkles className="w-5 h-5 text-sky-400" />
                        {settings.botConfig.formalButtonText}
                      </span>
                      <span className="text-xs bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 rounded-full text-sky-300 font-sans">
                        محترمانه 👔
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 group-hover:text-slate-300 leading-normal">
                      شامل شعر باوقار فارسی، تعیین زمان و مکان و اعلام قبولی دعوت.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Generated Link & Share Card */}
          {generatedInvite && (
            <div className="flex gap-3 max-w-2xl animate-fade-in pt-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                <Check className="w-4 h-4" />
              </div>

              <div className="space-y-4 flex-1">
                <div className="bg-slate-800/95 border border-emerald-500/40 text-slate-100 p-5 rounded-2xl rounded-tl-none shadow-xl">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-700/80 pb-3">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      لینک اختصاصی دعوت آماده شد!
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                      کد: {generatedInvite.id}
                    </span>
                  </div>

                  {/* Formatted Text Preview */}
                  <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl text-xs text-slate-200 space-y-2 font-sans leading-relaxed whitespace-pre-wrap">
                    {getFullInviteText(generatedInvite)}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => handleCopyText(getFullInviteText(generatedInvite))}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'متن و لینک کپی شد! ✅' : 'کپی متن و لینک جذاب'}</span>
                    </button>

                    <button
                      onClick={() => handleSimulateForward(getFullInviteText(generatedInvite))}
                      className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-sky-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-600 active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>فوروارد برای مخاطب (ارسال)</span>
                    </button>
                  </div>

                  {forwardSuccess && (
                    <p className="text-[11px] text-emerald-400 text-center mt-2 animate-pulse">
                      پیام شبیه‌سازی فوروارد شد! مخاطب شما می‌تواند لینک را باز کند.
                    </p>
                  )}

                  {/* Quick Direct Open Button */}
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-slate-400">تست صفحه از دید مخاطب:</span>
                    <button
                      onClick={() => {
                        soundFx.playPop();
                        openInvitePage(generatedInvite.id);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 underline underline-offset-4"
                    >
                      <span>باز کردن مستقیم صفحه دعوت‌شونده</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Telegram Chat Input Bar at Bottom */}
        <form onSubmit={handleSendMessage} className="bg-slate-800/95 border-t border-slate-700/80 px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartBot}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 border border-sky-400/30 shrink-0 transition-all active:scale-95 shadow-md"
          >
            <Play className="w-3.5 h-3.5" />
            <span>استارت بات</span>
          </button>

          <input
            type="text"
            placeholder="دستور /start یا پیام خود را بنویسید..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition-colors"
          />

          <button
            type="submit"
            className="p-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shadow-md transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
