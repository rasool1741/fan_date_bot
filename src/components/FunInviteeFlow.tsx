import React, { useState, useRef } from 'react';
import { Heart, Sparkles, AlertCircle, CheckCircle2, X, Frown, Gift, MapPin, Coffee, ArrowRight, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import { InviteSession, AppSettings } from '../types';
import { soundFx } from './SoundManager';

interface FunInviteeFlowProps {
  invite: InviteSession;
  settings: AppSettings;
  onRespond: (funResponses: any, status: 'accepted' | 'declined') => void;
}

export const FunInviteeFlow: React.FC<FunInviteeFlowProps> = ({ invite, settings, onRespond }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDateOption, setSelectedDateOption] = useState<string>('');
  const [selectedGiftOption, setSelectedGiftOption] = useState<string>('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [disabledClickedIndex, setDisabledClickedIndex] = useState<{ [key: number]: boolean }>({});
  const [disabledToast, setDisabledToast] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(invite.status === 'accepted');
  const [shareChoice, setShareChoice] = useState<'yes' | 'no' | null>(
    invite.funResponses?.shareNews || null
  );

  // Escaping "No" button state inside container arena
  const [isEscapingActive, setIsEscapingActive] = useState<boolean>(false);
  const [noPos, setNoPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [noEscapeCount, setNoEscapeCount] = useState<number>(0);
  const noButtonRef = useRef<HTMLButtonElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Playful escape messages floating when attempting to click "No"
  const escapeTaunts = [
    'ای بابا! دستت بهم نمیرسه 🏃‍♂️💨',
    'نمیتونی نمیتونی! 😜',
    'فقط بله رو باید بزنی! ❤️',
    'خیر وجود نداره عزیزم! 😍',
    'هرچی بزنی فرار می‌کنه! 😂 راهی جز بله نداری!',
  ];

  const handleEscapeNoButton = (e?: React.SyntheticEvent) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    soundFx.playEscape();
    setNoEscapeCount((prev) => prev + 1);

    if (arenaRef.current) {
      const rect = arenaRef.current.getBoundingClientRect();
      const btnW = noButtonRef.current ? noButtonRef.current.offsetWidth : 110;
      const btnH = noButtonRef.current ? noButtonRef.current.offsetHeight : 48;

      const padding = 12;
      const minX = padding;
      const maxX = Math.max(rect.width - btnW - padding, minX);
      const minY = padding;
      const maxY = Math.max(rect.height - btnH - padding, minY);

      const randomX = Math.floor(Math.random() * (maxX - minX)) + minX;
      const randomY = Math.floor(Math.random() * (maxY - minY)) + minY;

      setIsEscapingActive(true);
      setNoPos({ x: randomX, y: randomY });
    }
  };

  // Proximity tracking: flee when cursor or touch gets within 85px on step 1
  React.useEffect(() => {
    if (currentStep !== 1 || isCompleted) return;

    let lastFlee = 0;
    const handlePointerNear = (clientX: number, clientY: number) => {
      if (!noButtonRef.current || !arenaRef.current) return;
      const now = Date.now();
      if (now - lastFlee < 150) return;

      const btnRect = noButtonRef.current.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;

      const dist = Math.hypot(clientX - btnCenterX, clientY - btnCenterY);
      if (dist < 85) {
        lastFlee = now;
        handleEscapeNoButton();
      }
    };

    const onMouseMove = (e: MouseEvent) => handlePointerNear(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        handlePointerNear(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [currentStep, isCompleted]);

  const handleDisabledOptionClick = (idx: number, optText: string) => {
    soundFx.playError();
    setDisabledClickedIndex((prev) => ({ ...prev, [idx]: true }));
    setDisabledToast(`این گزینه قفله عزیزم! 😉 سیستم فقط گزینه واقعی رو قبول می‌کنه.`);
    setTimeout(() => setDisabledToast(null), 3500);
  };

  const handleAcceptStep1 = () => {
    soundFx.playPop();
    setCurrentStep(2);
    setDisabledClickedIndex({});
    setIsEscapingActive(false);
  };

  const handleSelectStep2Option = (optionText: string) => {
    soundFx.playPop();
    setSelectedDateOption(optionText);
    setCurrentStep(3);
    setDisabledClickedIndex({});
  };

  const handleSelectStep3Option = (optionText: string) => {
    soundFx.playPop();
    setSelectedGiftOption(optionText);
    setCurrentStep(4);
  };

  const funQ = settings.funQuestions;
  const customQs = funQ.customQuestions || [];
  const totalSteps = 4 + customQs.length;
  const finalStepIndex = 4 + customQs.length;

  const handleSelectCustomQOption = (qId: string, optionText: string) => {
    soundFx.playPop();
    setCustomAnswers((prev) => ({ ...prev, [qId]: optionText }));
    setCurrentStep((prev) => prev + 1);
    setDisabledClickedIndex({});
  };

  const handleFinalAnswer = (choice: 'yes' | 'no') => {
    setShareChoice(choice);
    setIsCompleted(true);

    if (choice === 'yes') {
      soundFx.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#f59e0b', '#10b981'],
      });
      onRespond(
        {
          dateChoice: selectedDateOption,
          giftChoice: selectedGiftOption,
          shareNews: 'yes',
          customAnswers,
        },
        'accepted'
      );
    } else {
      soundFx.playPop();
      onRespond(
        {
          dateChoice: selectedDateOption,
          giftChoice: selectedGiftOption,
          shareNews: 'no',
          customAnswers,
        },
        'declined'
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative">
      {/* Toast popup when clicking a disabled fantasy option */}
      {disabledToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-rose-900 text-rose-100 border border-rose-400/50 px-5 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{disabledToast}</span>
        </div>
      )}

      {/* Main Card Header */}
      <div className="bg-slate-900/90 border border-rose-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative background blur glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Inviter Info Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-400">دعوتنامه اختصاصی از طرف:</p>
              <h3 className="font-bold text-slate-100 text-base">
                {invite.inviterName} {invite.inviteeName ? `برای ${invite.inviteeName}` : ''}
              </h3>
            </div>
          </div>
          <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            دیت فان 🥳
          </span>
        </div>

        {/* STEP 1: Question 1 (Escaping No Button) */}
        {!isCompleted && currentStep === 1 && (
          <div className="space-y-8 py-4 text-center animate-fade-in relative min-h-[320px] flex flex-col justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                مرحله ۱ از ۴
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-relaxed">
                {funQ.step1Question}
              </h2>
              <p className="text-xs text-slate-400">
                لطفاً پاسخ خود را با لمس یکی از گزینه‌ها مشخص کنید 😉
              </p>
            </div>

            {/* Taunt Badge when escaping */}
            {noEscapeCount > 0 && (
              <div className="inline-block mx-auto animate-bounce bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-1.5 rounded-full text-xs font-bold">
                {escapeTaunts[(noEscapeCount - 1) % escapeTaunts.length]}
              </div>
            )}

            {/* Arena Buttons Area */}
            <div
              ref={arenaRef}
              className="relative w-full min-h-[220px] rounded-2xl bg-slate-950/40 border border-slate-800/80 p-4 flex flex-col items-center justify-center gap-6 select-none overflow-hidden"
            >
              {/* YES BUTTON (Prominent & Center) */}
              <button
                onClick={handleAcceptStep1}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-lg shadow-xl shadow-rose-500/30 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 z-10"
              >
                <Heart className="w-6 h-6 fill-white animate-bounce" />
                <span>بله با کمال میل 😍❤️</span>
              </button>

              {/* ESCAPING NO BUTTON */}
              <button
                ref={noButtonRef}
                type="button"
                onMouseEnter={handleEscapeNoButton}
                onMouseMove={handleEscapeNoButton}
                onTouchStart={handleEscapeNoButton}
                onTouchEnd={handleEscapeNoButton}
                onTouchMove={handleEscapeNoButton}
                onPointerDown={handleEscapeNoButton}
                onClick={handleEscapeNoButton}
                style={
                  isEscapingActive
                    ? {
                        position: 'absolute',
                        left: `${noPos.x}px`,
                        top: `${noPos.y}px`,
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        zIndex: 30,
                        touchAction: 'none',
                      }
                    : {
                        position: 'relative',
                        zIndex: 10,
                        touchAction: 'none',
                      }
                }
                className="px-6 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 font-bold text-sm shadow-xl cursor-pointer select-none transition-all active:scale-90"
              >
                <span>خیر 🙈</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Question 2 (All 4 Options look 100% IDENTICAL and staggered) */}
        {!isCompleted && currentStep === 2 && (
          <div className="space-y-6 py-2 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono">
                <Coffee className="w-3.5 h-3.5" />
                مرحله ۲ از ۴
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                {funQ.step2Question}
              </h2>
              <p className="text-[11px] text-slate-400">
                از بین گزینه‌های زیر انتخاب کن (همه‌شون شبیه هم هستن! 🤫)
              </p>
            </div>

            {/* Scattered Fantasy Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {funQ.step2Options.map((opt, idx) => {
                const isCrossed = disabledClickedIndex[idx];

                // Playful rotation angles for fantasy scattered look
                const rotations = ['sm:-rotate-1', 'sm:rotate-1', 'sm:-rotate-2', 'sm:rotate-2'];
                const rotateClass = rotations[idx % rotations.length];

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (opt.enabled) {
                        handleSelectStep2Option(opt.text);
                      } else {
                        handleDisabledOptionClick(idx, opt.text);
                      }
                    }}
                    className={`w-full p-4 rounded-2xl text-right transition-all duration-300 flex items-center justify-between border relative overflow-hidden group ${rotateClass} ${
                      isCrossed
                        ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 animate-shake shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-purple-500/30 hover:border-pink-400 text-slate-200 hover:scale-[1.02] shadow-lg shadow-purple-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-sm font-semibold">{opt.text}</span>
                    </div>

                    {isCrossed ? (
                      <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                        ❌
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full shrink-0 group-hover:text-pink-300 group-hover:border-pink-500/40">
                        انتخاب ✨
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Question 3 (All 4 Options look 100% IDENTICAL and staggered) */}
        {!isCompleted && currentStep === 3 && (
          <div className="space-y-6 py-2 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-mono">
                <Gift className="w-3.5 h-3.5" />
                مرحله ۳ از ۴
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                {funQ.step3Question}
              </h2>
              <p className="text-[11px] text-slate-400">
                هدیه دلخواهتو انتخاب کن (فقط یکیش قفل نیست! 🎉)
              </p>
            </div>

            {/* Scattered Fantasy Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {funQ.step3Options.map((opt, idx) => {
                const isCrossed = disabledClickedIndex[idx];

                const rotations = ['sm:rotate-1', 'sm:-rotate-2', 'sm:rotate-2', 'sm:-rotate-1'];
                const rotateClass = rotations[idx % rotations.length];

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (opt.enabled) {
                        handleSelectStep3Option(opt.text);
                      } else {
                        handleDisabledOptionClick(idx, opt.text);
                      }
                    }}
                    className={`w-full p-4 rounded-2xl text-right transition-all duration-300 flex items-center justify-between border relative overflow-hidden group ${rotateClass} ${
                      isCrossed
                        ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 animate-shake shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-pink-500/30 hover:border-rose-400 text-slate-200 hover:scale-[1.02] shadow-lg shadow-pink-950/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span className="text-sm font-semibold">{opt.text}</span>
                    </div>

                    {isCrossed ? (
                      <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                        ❌
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full shrink-0 group-hover:text-rose-300 group-hover:border-rose-500/40">
                        انتخاب ❤️
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* DYNAMIC CUSTOM QUESTIONS (Between Step 3 and Final Step) */}
        {!isCompleted && currentStep > 3 && currentStep < finalStepIndex && (() => {
          const qIndex = currentStep - 4;
          const currentCustomQ = customQs[qIndex];
          if (!currentCustomQ) return null;

          return (
            <div className="space-y-6 py-2 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono">
                  <Star className="w-3.5 h-3.5" />
                  مرحله {currentStep} از {totalSteps}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                  {currentCustomQ.title}
                </h2>
                <p className="text-[11px] text-slate-400">
                  یکی از گزینه‌ها را انتخاب کنید 🤫
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentCustomQ.options.map((opt, idx) => {
                  const isCrossed = disabledClickedIndex[idx];
                  const rotations = ['sm:rotate-1', 'sm:-rotate-1', 'sm:rotate-2', 'sm:-rotate-2'];
                  const rotateClass = rotations[idx % rotations.length];

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (opt.enabled) {
                          handleSelectCustomQOption(currentCustomQ.id, opt.text);
                        } else {
                          handleDisabledOptionClick(idx, opt.text);
                        }
                      }}
                      className={`w-full p-4 rounded-2xl text-right transition-all duration-300 flex items-center justify-between border relative overflow-hidden group ${rotateClass} ${
                        isCrossed
                          ? 'bg-rose-950/40 border-rose-500/70 text-rose-300 animate-shake shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-purple-500/30 hover:border-pink-400 text-slate-200 hover:scale-[1.02] shadow-lg shadow-purple-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span className="text-sm font-semibold">{opt.text}</span>
                      </div>

                      {isCrossed ? (
                        <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                          ❌
                        </div>
                      ) : (
                        <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-2.5 py-1 rounded-full shrink-0 group-hover:text-purple-300 group-hover:border-purple-500/40">
                          انتخاب ✨
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* STEP 4: Question 4 (Share News) */}
        {!isCompleted && currentStep === finalStepIndex && (
          <div className="space-y-6 py-4 text-center animate-fade-in">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                مرحله پایانی
              </div>
              <h2 className="text-xl font-bold text-white leading-relaxed">
                {funQ.step4Question}
              </h2>
              <p className="text-xs text-slate-400">
                با زدن بله، خبر قبول کردن این قرار زیبا به {invite.inviterName} اطلاع داده میشه!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleFinalAnswer('yes')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-base shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>بله، خبر خوشحالی رو بده! 🎉</span>
              </button>

              <button
                onClick={() => handleFinalAnswer('no')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Frown className="w-4 h-4 text-slate-400" />
                <span>فعلاً نه 😅</span>
              </button>
            </div>
          </div>
        )}

        {/* FINAL COMPLETED SCREEN */}
        {isCompleted && (
          <div className="space-y-6 py-6 text-center animate-fade-in">
            {shareChoice === 'yes' || invite.status === 'accepted' ? (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                  <Heart className="w-10 h-10 fill-emerald-400 animate-bounce" />
                </div>
                <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                  تبریییییک! قرار تایید شد 🎉❤️
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  خبر قبول دعوت شما برای <span className="text-rose-400 font-bold">{invite.inviterName}</span> ارسال شد. منتظر یک روز عالی باشید!
                </p>

                {/* Summary Card */}
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-right space-y-2 text-xs text-slate-300 max-w-md mx-auto">
                  <p className="font-bold text-rose-300 border-b border-slate-700 pb-2 mb-2">خلاصه گزینه‌های شما:</p>
                  <p>• نوع قرار: {selectedDateOption || invite.funResponses?.dateChoice || 'پیاده‌روی دو نفره'}</p>
                  <p>• هدیه دیت: {selectedGiftOption || invite.funResponses?.giftChoice || 'عزیزم تو خودت هدیه‌ای 🎁❤️'}</p>
                  <p className="text-emerald-400 font-medium pt-1">✅ وضعیت: دعوت با موفقیت پذیرفته شد.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                  <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">پاسخ ثبت شد 🌸</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  اطلاع‌رسانی عدم اشتراک خبر به {invite.inviterName} ثبت شد. ولی باز هم شانس دعوت مجدد وجود داره!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
