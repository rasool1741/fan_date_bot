import React, { useState } from 'react';
import { Heart, Check, X, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';
import { InviteSession, AppSettings } from '../types';
import { soundFx } from './SoundManager';
import { getRandomPoem } from '../data/poems';

interface FormalInviteeFlowProps {
  invite: InviteSession;
  settings: AppSettings;
  onRespond: (formalResponses: any, status: 'accepted' | 'declined') => void;
}

export const FormalInviteeFlow: React.FC<FormalInviteeFlowProps> = ({ invite, settings, onRespond }) => {
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const [customNote, setCustomNote] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(invite.status !== 'pending');
  const [acceptedState, setAcceptedState] = useState<boolean>(invite.status === 'accepted');

  const formalQ = settings.formalQuestions;

  // Active Poem initialized with a random poem on load
  const [currentPoem] = useState<string>(() => getRandomPoem());

  const handleSelectOption = (qId: string, option: string) => {
    soundFx.playPop();
    setResponses((prev) => ({ ...prev, [qId]: option }));
  };

  const handleAccept = () => {
    soundFx.playVictory();
    setIsCompleted(true);
    setAcceptedState(true);

    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#ec4899', '#e11d48', '#f472b6', '#fda4af'],
    });

    onRespond(
      {
        ...responses,
        customNote: customNote.trim(),
        accepted: true,
      },
      'accepted'
    );
  };

  const handleDecline = () => {
    soundFx.playPop();
    setIsCompleted(true);
    setAcceptedState(false);

    onRespond(
      {
        ...responses,
        customNote: customNote.trim(),
        accepted: false,
      },
      'declined'
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-b from-slate-950 via-rose-950/40 to-slate-950 border-2 border-rose-500/40 rounded-3xl p-6 md:p-8 shadow-2xl shadow-rose-950/80 backdrop-blur-2xl relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-pink-500 to-red-600" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-900/40 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-pink-400/50 flex items-center justify-center text-pink-400 shadow-lg shadow-rose-500/20">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-rose-300/80 font-medium">دعوتنامه عاشقانه از طرف:</p>
              <h3 className="font-extrabold text-white text-base">
                {invite.inviterName} {invite.inviteeName ? `برای ${invite.inviteeName}` : ''}
              </h3>
            </div>
          </div>
          <span className="text-xs bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-pink-200 border border-pink-500/40 px-3.5 py-1.5 rounded-full font-bold shadow-md flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            دعوت رسمی و عاشقانه 💖
          </span>
        </div>

        {/* Poetry Card in Romantic Rose & Pink */}
        <div className="bg-gradient-to-r from-rose-950/80 via-pink-950/60 to-rose-950/80 border border-pink-500/30 p-6 rounded-2xl text-center mb-6 shadow-inner relative overflow-hidden">
          <Heart className="w-4 h-4 text-pink-400 fill-pink-400/40 absolute top-3 right-3 animate-pulse" />
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400/40 absolute bottom-3 left-3 animate-pulse" />

          <p className="font-serif text-sm md:text-base text-pink-100 leading-relaxed whitespace-pre-wrap italic pt-1 font-medium">
            "{currentPoem}"
          </p>
        </div>

        {/* Intro text */}
        <p className="text-xs md:text-sm text-pink-200/90 leading-relaxed text-center mb-6 font-medium">
          {formalQ.introText}
        </p>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Questions */}
            {formalQ.questions.map((q) => (
              <div key={q.id} className="space-y-3 bg-slate-900/80 border border-rose-900/40 p-4 rounded-2xl shadow-sm">
                <h4 className="text-sm font-bold text-pink-200 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400/60" />
                  {q.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, idx) => {
                    const isSelected = responses[q.id] === opt;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(q.id, opt)}
                        className={`p-3 rounded-xl text-xs font-medium text-right transition-all flex items-center justify-between border ${
                          isSelected
                            ? 'bg-gradient-to-r from-rose-600/40 via-pink-600/40 to-rose-600/40 border-pink-400 text-pink-100 font-bold shadow-lg shadow-rose-600/20'
                            : 'bg-slate-950/80 hover:bg-rose-950/40 border-rose-900/50 text-slate-300 hover:text-pink-200'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-pink-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Field for custom message or phone number for inviter */}
            <div className="bg-slate-900/80 border border-rose-900/40 p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-pink-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-400" />
                <span>ارسال شماره تماس یا پیام دلخواه برای دعوت‌کننده (اختیاری):</span>
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="مثلاً: سلام، ممنون از دعوتت! شماره تماس من 09121112233..."
                className="w-full bg-slate-950 border border-rose-900/60 focus:border-pink-500 rounded-xl px-3 py-2 text-pink-100 text-xs focus:outline-none leading-relaxed placeholder-rose-300/30"
              />
              <p className="text-[11px] text-rose-300/60">
                این پیام همراه با پاسخ شما به بات تلگرام دعوت‌کننده ارسال می‌شود.
              </p>
            </div>

            {/* Decision Buttons */}
            <div className="pt-4 border-t border-rose-900/40 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-rose-600/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-pink-200" />
                <span>قبول دعوت با کمال احترام ❤️</span>
              </button>

              <button
                onClick={handleDecline}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-rose-900/60 text-rose-300 hover:text-rose-100 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>عذرخواهی و عدم امکان حضور 🌺</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center animate-fade-in">
            {acceptedState ? (
              <div className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-pink-400 mx-auto flex items-center justify-center text-pink-400 shadow-xl shadow-rose-500/30">
                  <Heart className="w-10 h-10 fill-pink-400 animate-bounce" />
                </div>
                <h3 className="text-xl font-black text-pink-100">دعوت با عشق و سپاس فراوان پذیرفته شد ❤️</h3>
                <p className="text-xs text-rose-200/90 max-w-md mx-auto leading-relaxed font-medium">
                  مراتب قبول دعوت و ترجیحات شما به اطلاع <span className="font-bold text-pink-300">{invite.inviterName}</span> رسید. با تشکر از پاسخگویی محترمانه شما.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-rose-900/80 mx-auto flex items-center justify-center text-rose-400">
                  <X className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-rose-200">عدم امکان حضور ثبت گردید 🌺</h3>
                <p className="text-xs text-rose-300/70 max-w-md mx-auto">
                  پیام عذرخواهی و عدم امکان حضور شما با کمال احترام به {invite.inviterName} منتقل شد.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
