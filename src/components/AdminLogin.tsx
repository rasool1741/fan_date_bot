import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, Mail, ShieldAlert, Check, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { soundFx } from './SoundManager';

interface AdminLoginProps {
  correctPassword?: string;
  recoveryEmail?: string;
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  correctPassword = 'admin',
  recoveryEmail = 'rasoolramazani@gmail.com',
  onLoginSuccess,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playPop();

    const targetPass = (correctPassword || 'admin').trim();
    if (passwordInput.trim() === targetPass) {
      setErrorMsg(null);
      onLoginSuccess();
    } else {
      setErrorMsg('رمز عبور وارد شده اشتباه است. لطفاً دوباره تلاش کنید.');
    }
  };

  const copyRecoveryEmail = () => {
    soundFx.playPop();
    navigator.clipboard.writeText(recoveryEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 relative overflow-hidden animate-fade-in">
        {/* Background glow effects */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-purple-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-white">ورود به پنل مدیریت</h2>
            <p className="text-xs text-slate-400 mt-1">
              جهت دسترسی به آمار، لیست مخاطبین و تنظیمات، رمز عبور را وارد کنید.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-bold block">رمز عبور مدیر:</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="رمز عبور را وارد کنید..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pr-10 pl-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3.5 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>ورود به پنل مدیریت</span>
          </button>
        </form>

        {/* Forgot password section */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              soundFx.playPop();
              setShowForgotModal(true);
            }}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors inline-flex items-center gap-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>فراموشی رمز عبور؟</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-right relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                <span>بازیابی رمز عبور مدیر</span>
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              چنانچه رمز عبور ورود به پنل مدیریت را فراموش کرده‌اید، می‌توانید جهت بازیابی یا تنظیم رمز جدید، با ایمیل پشتیبانی و سورس برنامه تماس بگیرید:
            </p>

            <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-2xl space-y-3">
              <span className="text-[11px] text-slate-400 block font-medium">ایمیل بازیابی مدیر سیستم:</span>
              <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                <code className="text-sm font-bold text-purple-300 font-mono tracking-wide">{recoveryEmail}</code>
                <button
                  type="button"
                  onClick={copyRecoveryEmail}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1 shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`mailto:${recoveryEmail}?subject=${encodeURIComponent('درخواست بازیابی رمز عبور پنل مدیریت')}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-md"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>ارسال ایمیل مستقیم</span>
              </a>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
