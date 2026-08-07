import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, Mail, ShieldAlert, Check, Copy, RefreshCw, Key } from 'lucide-react';
import { soundFx } from './SoundManager';

interface AdminLoginProps {
  correctPassword?: string;
  recoveryEmail?: string;
  onLoginSuccess: () => void;
  onBackToMiniApp?: () => void;
  onPasswordReset?: (newPass: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  correctPassword = 'admin',
  recoveryEmail = 'rasoolramazani@gmail.com',
  onLoginSuccess,
  onBackToMiniApp,
  onPasswordReset,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

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

  const handleResetPasswordDirectly = async () => {
    soundFx.playPop();
    setIsResetting(true);
    setResetSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResetSuccessMsg('رمز عبور جدید با موفقیت به ربات تلگرام ارسال گردید.');
      } else {
        setErrorMsg(data.error || 'خطا در ریست رمز عبور. لطفاً مجدداً تلاش کنید.');
      }
    } catch (err) {
      setErrorMsg('ارتباط با سرور برقرار نشد.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 dir-rtl" dir="rtl">
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

        {/* Success Notification */}
        {resetSuccessMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resetSuccessMsg}</span>
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>ورود به پنل مدیریت</span>
          </button>
        </form>

        {/* Forgot password section & Back to Mini App */}
        <div className="pt-2 text-center border-t border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetPasswordDirectly}
            className="text-xs text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isResetting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>در حال ارسال به تلگرام...</span>
              </>
            ) : (
              <>
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>ارسال رمز عبور جدید به ربات تلگرام</span>
              </>
            )}
          </button>

          {onBackToMiniApp && (
            <button
              type="button"
              onClick={onBackToMiniApp}
              className="text-xs text-slate-400 hover:text-white font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>بازگشت به مینی‌اپ 💌</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
