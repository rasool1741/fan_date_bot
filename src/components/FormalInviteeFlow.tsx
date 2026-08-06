import React, { useState } from 'react';
import { Feather, Check, X, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
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
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#818cf8', '#c084fc', '#f472b6'],
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
      <div className="bg-slate-900/90 border border-sky-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Feather className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">دعوتنامه رسمی از طرف:</p>
              <h3 className="font-bold text-slate-100 text-base">
                {invite.inviterName} {invite.inviteeName ? `برای ${invite.inviteeName}` : ''}
              </h3>
            </div>
          </div>
          <span className="text-xs bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full font-medium">
            دعوت رسمی 👔
          </span>
        </div>

        {/* Poetry Card (Random on load, no shuffle button) */}
        <div className="bg-slate-950/80 border border-amber-500/20 p-6 rounded-2xl text-center mb-6 shadow-inner relative">
          <Sparkles className="w-5 h-5 text-amber-400 opacity-60 absolute top-3 right-3" />

          <p className="font-serif text-sm md:text-base text-amber-100 leading-relaxed whitespace-pre-wrap italic pt-1">
            "{currentPoem}"
          </p>
        </div>

        {/* Intro text */}
        <p className="text-xs md:text-sm text-slate-300 leading-relaxed text-center mb-6">
          {formalQ.introText}
        </p>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Questions */}
            {formalQ.questions.map((q) => (
              <div key={q.id} className="space-y-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl">
                <h4 className="text-sm font-bold text-sky-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
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
                            ? 'bg-sky-600/30 border-sky-400 text-sky-100 font-bold shadow-md'
                            : 'bg-slate-900/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Field for custom message or phone number for inviter */}
            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-sky-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>ارسال شماره تماس یا پیام دلخواه برای دعوت‌کننده (اختیاری):</span>
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="مثلاً: سلام، ممنون از دعوتت! شماره تماس من 09121112233..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                این پیام همراه با پاسخ شما به بات تلگرام دعوت‌کننده ارسال می‌شود.
              </p>
            </div>

            {/* Decision Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-sky-200" />
                <span>قبول دعوت با کمال احترام 🌸</span>
              </button>

              <button
                onClick={handleDecline}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <X className="w-4 h-4 text-slate-400" />
                <span>عذرخواهی و عدم امکان حضور 🌺</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4 text-center animate-fade-in">
            {acceptedState ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-sky-500/20 border-2 border-sky-400 mx-auto flex items-center justify-center text-sky-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-sky-200">دعوت با سپاس فراوان پذیرفته شد 🌸</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  مراتب قبول دعوت و ترجیحات شما به اطلاع <span className="font-bold text-sky-300">{invite.inviterName}</span> رسید. با تشکر از پاسخگویی محترمانه شما.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                  <X className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-200">عدم امکان حضور ثبت گردید 🌺</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
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
