import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  BarChart3,
  Users,
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Send,
  Sparkles,
  MessageSquare,
  Search,
  AlertCircle,
  Megaphone,
  Plus,
  ChevronDown,
  ChevronUp,
  GitBranch,
  User,
  CornerDownLeft,
  Lock,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { InviteSession, AppSettings, StatsOverview, TelegramBotUser } from '../types';
import { soundFx } from './SoundManager';
import { getRandomPoem } from '../data/poems';

interface AdminPanelProps {
  invites: InviteSession[];
  stats: StatsOverview;
  settings: AppSettings;
  activeSubTab: 'stats' | 'invites' | 'users' | 'broadcast' | 'questions' | 'bot' | 'security';
  setActiveSubTab: (tab: 'stats' | 'invites' | 'users' | 'broadcast' | 'questions' | 'bot' | 'security') => void;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  onResetSettings: () => Promise<void>;
  onDeleteInvite: (id: string) => Promise<void>;
  openInvitePage: (inviteId: string) => void;
  onLogout?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  invites,
  stats,
  settings,
  activeSubTab,
  setActiveSubTab,
  onUpdateSettings,
  onResetSettings,
  onDeleteInvite,
  openInvitePage,
  onLogout,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bot Users list state
  const [botUsers, setBotUsers] = useState<TelegramBotUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');

  // Tree View state
  const [expandedInviters, setExpandedInviters] = useState<Record<string, boolean>>({});
  const [inviteSearchQuery, setInviteSearchQuery] = useState<string>('');

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    totalSent?: number;
    totalFailed?: number;
    totalUsers?: number;
    error?: string;
  } | null>(null);

  // Editable settings form state
  const [formSettings, setFormSettings] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [testingToken, setTestingToken] = useState<boolean>(false);
  const [showAdminPass, setShowAdminPass] = useState<boolean>(false);
  const [copiedEmailSetting, setCopiedEmailSetting] = useState<boolean>(false);
  const [tokenStatus, setTokenStatus] = useState<{ ok: boolean; message: string; botInfo?: any } | null>(null);

  const isFormDirty = React.useRef(false);

  // Fetch bot users from backend
  const fetchBotUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/bot/users');
      if (res.ok) {
        const data = await res.json();
        setBotUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching bot users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users' || activeSubTab === 'broadcast' || activeSubTab === 'stats' || activeSubTab === 'invites') {
      fetchBotUsers();
    }
  }, [activeSubTab]);

  // Sync state when props change ONLY if user is not actively editing
  useEffect(() => {
    if (!isFormDirty.current) {
      setFormSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    soundFx.playPop();
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/bot/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: broadcastMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastResult({
          success: true,
          totalSent: data.totalSent,
          totalFailed: data.totalFailed,
          totalUsers: data.totalUsers,
        });
        setBroadcastMessage('');
      } else {
        setBroadcastResult({
          success: false,
          error: data.error || 'خطا در ارسال پیام همگانی.',
        });
      }
    } catch (err) {
      setBroadcastResult({
        success: false,
        error: 'خطا در شبکه یا عدم ارتباط با سرور.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredUsers = botUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.chatId.toString().includes(q) ||
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const handleSaveSettings = async () => {
    soundFx.playPop();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(formSettings);
      isFormDirty.current = false;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید متن تمامی سوالات و تنظیمات به حالت اولیه بازگردد؟')) {
      soundFx.playPop();
      await onResetSettings();
      isFormDirty.current = false;
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}?invite=${id}`;
    navigator.clipboard.writeText(link);
    soundFx.playPop();
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRandomizePoem = () => {
    soundFx.playPop();
    isFormDirty.current = true;
    const randomP = getRandomPoem();
    setFormSettings((prev) => ({
      ...prev,
      formalQuestions: {
        ...prev.formalQuestions,
        poetry: randomP,
      },
    }));
  };

  const handleTestToken = async () => {
    const token = formSettings.botConfig.botToken?.trim();
    if (!token) {
      setTokenStatus({ ok: false, message: 'لطفاً توکن بات را وارد کنید.' });
      return;
    }

    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTokenStatus({
          ok: true,
          message: `اتصال موفقیت‌آمیز بود! نام بات: @${data.bot.username || data.bot.first_name}`,
          botInfo: data.bot,
        });
        if (data.bot?.username) {
          setFormSettings((prev) => ({
            ...prev,
            botConfig: {
              ...prev.botConfig,
              botUsername: `@${data.bot.username.replace(/^@/, '')}`,
            },
          }));
        }
      } else {
        setTokenStatus({
          ok: false,
          message: data.error || 'توکن نامعتبر است یا ارتباط برقرار نشد.',
        });
      }
    } catch (err) {
      setTokenStatus({ ok: false, message: 'خطا در برقراری ارتباط با API تلگرام.' });
    } finally {
      setTestingToken(false);
    }
  };

  // Fun Questions Custom Adding
  const handleAddFunQuestion = () => {
    soundFx.playPop();
    isFormDirty.current = true;
    const currentCustom = formSettings.funQuestions.customQuestions || [];
    const newQ = {
      id: `fun_q_${Date.now()}`,
      title: 'عنوان سوال جدید دیت فان...',
      options: [
        { text: 'گزینه اصلی اول (فعال)', enabled: true },
        { text: 'گزینه دوم (قفل)', enabled: false },
        { text: 'گزینه سوم (قفل)', enabled: false },
        { text: 'گزینه چهارم (قفل)', enabled: false },
      ],
    };
    setFormSettings({
      ...formSettings,
      funQuestions: {
        ...formSettings.funQuestions,
        customQuestions: [...currentCustom, newQ],
      },
    });
  };

  const handleRemoveFunQuestion = (index: number) => {
    soundFx.playPop();
    isFormDirty.current = true;
    const currentCustom = [...(formSettings.funQuestions.customQuestions || [])];
    currentCustom.splice(index, 1);
    setFormSettings({
      ...formSettings,
      funQuestions: {
        ...formSettings.funQuestions,
        customQuestions: currentCustom,
      },
    });
  };

  const handleAddOptionToFunQuestion = (qIndex: number) => {
    isFormDirty.current = true;
    const currentCustom = [...(formSettings.funQuestions.customQuestions || [])];
    currentCustom[qIndex].options.push({
      text: `گزینه جدید ${currentCustom[qIndex].options.length + 1}`,
      enabled: false,
    });
    setFormSettings({
      ...formSettings,
      funQuestions: { ...formSettings.funQuestions, customQuestions: currentCustom },
    });
  };

  const handleRemoveOptionFromFunQuestion = (qIndex: number, optIndex: number) => {
    isFormDirty.current = true;
    const currentCustom = [...(formSettings.funQuestions.customQuestions || [])];
    if (currentCustom[qIndex].options.length > 1) {
      currentCustom[qIndex].options.splice(optIndex, 1);
      setFormSettings({
        ...formSettings,
        funQuestions: { ...formSettings.funQuestions, customQuestions: currentCustom },
      });
    }
  };

  // Formal Questions Adding/Removing
  const handleAddFormalQuestion = () => {
    soundFx.playPop();
    isFormDirty.current = true;
    const currentQuestions = formSettings.formalQuestions.questions || [];
    const newQ = {
      id: `formal_q_${Date.now()}`,
      title: 'عنوان سوال جدید دعوت رسمی...',
      options: ['گزینه اول', 'گزینه دوم', 'گزینه سوم', 'گزینه چهارم'],
    };
    setFormSettings({
      ...formSettings,
      formalQuestions: {
        ...formSettings.formalQuestions,
        questions: [...currentQuestions, newQ],
      },
    });
  };

  const handleRemoveFormalQuestion = (index: number) => {
    soundFx.playPop();
    isFormDirty.current = true;
    const currentQuestions = [...(formSettings.formalQuestions.questions || [])];
    currentQuestions.splice(index, 1);
    setFormSettings({
      ...formSettings,
      formalQuestions: {
        ...formSettings.formalQuestions,
        questions: currentQuestions,
      },
    });
  };

  const handleAddOptionToFormalQuestion = (qIndex: number) => {
    isFormDirty.current = true;
    const currentQuestions = [...(formSettings.formalQuestions.questions || [])];
    currentQuestions[qIndex].options.push(`گزینه جدید ${currentQuestions[qIndex].options.length + 1}`);
    setFormSettings({
      ...formSettings,
      formalQuestions: { ...formSettings.formalQuestions, questions: currentQuestions },
    });
  };

  const handleRemoveOptionFromFormalQuestion = (qIndex: number, optIndex: number) => {
    isFormDirty.current = true;
    const currentQuestions = [...(formSettings.formalQuestions.questions || [])];
    if (currentQuestions[qIndex].options.length > 1) {
      currentQuestions[qIndex].options.splice(optIndex, 1);
      setFormSettings({
        ...formSettings,
        formalQuestions: { ...formSettings.formalQuestions, questions: currentQuestions },
      });
    }
  };

  // Group Invites for Tree View
  const groupedInvites = useMemo(() => {
    const q = inviteSearchQuery.toLowerCase().trim();
    const filtered = invites.filter((inv) => {
      if (!q) return true;
      return (
        inv.id.toLowerCase().includes(q) ||
        inv.inviterName.toLowerCase().includes(q) ||
        (inv.inviteeName && inv.inviteeName.toLowerCase().includes(q))
      );
    });

    const groups: {
      inviterKey: string;
      inviterName: string;
      inviterChatId?: number | string;
      inviterBotUser?: TelegramBotUser;
      invites: InviteSession[];
    }[] = [];

    const map = new Map<string, typeof groups[0]>();

    filtered.forEach((inv) => {
      const key = inv.inviterChatId
        ? `chat_${inv.inviterChatId}`
        : `name_${inv.inviterName.trim().toLowerCase()}`;

      if (!map.has(key)) {
        const inviterBotUser = botUsers.find(
          (u) =>
            (inv.inviterChatId && u.chatId.toString() === inv.inviterChatId.toString()) ||
            (u.firstName && u.firstName.trim().toLowerCase() === inv.inviterName.trim().toLowerCase())
        );

        const newGroup = {
          inviterKey: key,
          inviterName: inv.inviterName,
          inviterChatId: inv.inviterChatId,
          inviterBotUser,
          invites: [],
        };
        map.set(key, newGroup);
        groups.push(newGroup);
      }
      map.get(key)!.invites.push(inv);
    });

    return groups;
  }, [invites, botUsers, inviteSearchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              پنل مدیریت پیشرفته
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت دعوت‌ها، کاربران تلگرام، تغییر سوالات، ارسال پیام همگانی و متون بات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('stats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'stats'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>آمار کلی</span>
          </button>

          <button
            onClick={() => setActiveSubTab('invites')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'invites'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>دعوت‌ها (درختی 🌳)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'users'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>کاربران بات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('broadcast')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'broadcast'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>پیام همگانی</span>
          </button>

          <button
            onClick={() => setActiveSubTab('questions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'questions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>ویرایش سوالات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bot')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'bot'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>تنظیمات بات</span>
          </button>

          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'security'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>رمز و امنیت 🔒</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl text-xs font-bold transition-all text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 border border-rose-500/30 shrink-0"
              title="خروج از حساب مدیریت"
            >
              خروج 🚪
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: STATS OVERVIEW */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right space-y-1">
              <p className="text-xs text-slate-400 font-medium">کل دعوت‌ها</p>
              <h3 className="text-2xl font-black text-white">{stats.totalInvites}</h3>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right space-y-1">
              <p className="text-xs text-slate-400 font-medium">قبول شده 🎉</p>
              <h3 className="text-2xl font-black text-emerald-400">{stats.totalAccepted}</h3>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right space-y-1">
              <p className="text-xs text-slate-400 font-medium">کاربران بات تلگرام</p>
              <h3 className="text-2xl font-black text-sky-400">{botUsers.length}</h3>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-right space-y-1">
              <p className="text-xs text-slate-400 font-medium">تعداد بازدید صفحات</p>
              <h3 className="text-2xl font-black text-purple-400">{stats.totalViews}</h3>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TREE VIEW OF INVITES */}
      {activeSubTab === 'invites' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-purple-400" />
                <span>نمای درختی دعوت‌ها (کاربران دعوت‌کننده و دعوت‌شوندگان)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ساختار درختی پیام‌های ارسال شده؛ مشخصات تلگرامی دعوت‌کننده و دعوت‌شوندگان در صورت استفاده از ربات نمایش داده می‌شود.
              </p>
            </div>
            <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
              تعداد کل دعوت‌ها: {invites.length}
            </span>
          </div>

          {/* Search filter for Tree View */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={inviteSearchQuery}
              onChange={(e) => setInviteSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام دعوت‌کننده، مخاطب، کد دعوت..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {groupedInvites.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm bg-slate-950/60 rounded-2xl border border-slate-800">
              هیچ دعوت‌نامه‌ای یافت نشد.
            </div>
          ) : (
            <div className="space-y-4">
              {groupedInvites.map((group) => {
                const isExpanded = expandedInviters[group.inviterKey] !== false; // default open
                const totalAccepted = group.invites.filter((i) => i.status === 'accepted').length;
                const totalPending = group.invites.filter((i) => i.status === 'pending').length;
                const totalDeclined = group.invites.filter((i) => i.status === 'declined').length;

                return (
                  <div
                    key={group.inviterKey}
                    className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
                  >
                    {/* Inviter Parent Branch Header */}
                    <div
                      onClick={() =>
                        setExpandedInviters((prev) => ({
                          ...prev,
                          [group.inviterKey]: !isExpanded,
                        }))
                      }
                      className="p-4 bg-slate-900/80 hover:bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              کاربر دعوت‌کننده: {group.inviterName}
                            </span>
                            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                              ({group.invites.length} دعوت)
                            </span>
                          </div>

                          {/* Telegram Bot User details if Inviter used Telegram */}
                          {group.inviterBotUser ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-sky-300 mt-1 font-medium">
                              <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span>
                                تلگرام: <b>{group.inviterBotUser.firstName} {group.inviterBotUser.lastName || ''}</b>
                                {group.inviterBotUser.username ? ` (@${group.inviterBotUser.username})` : ''} | Chat ID: <code className="bg-slate-900 px-1 py-0.5 rounded text-sky-300 font-mono">{group.inviterBotUser.chatId}</code>
                              </span>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {group.inviterChatId ? `شناسه چت تلگرام: ${group.inviterChatId}` : 'مستقیم از وب‌سایت ایجاد شده'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-bold">
                            {totalAccepted} قبول شد
                          </span>
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold">
                            {totalPending} در انتظار
                          </span>
                          {totalDeclined > 0 && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-lg font-bold">
                              {totalDeclined} رد شد
                            </span>
                          )}
                        </div>

                        <button className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Children Leaf Nodes (Invitee Cards Tree Branch) */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-950/60 relative">
                        {/* Tree Branch Indent Line */}
                        <div className="border-r-2 border-purple-500/30 pr-4 space-y-4 mr-2">
                          {group.invites.map((inv) => {
                            // Find invitee Telegram User
                            const inviteeBotUser = botUsers.find(
                              (u) =>
                                (inv.inviteeChatId && u.chatId.toString() === inv.inviteeChatId.toString()) ||
                                (inv.inviteeName && u.firstName && u.firstName.trim().toLowerCase() === inv.inviteeName.trim().toLowerCase())
                            );

                            return (
                              <div
                                key={inv.id}
                                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700 space-y-3 relative"
                              >
                                {/* Tree header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                  <div className="flex items-center gap-2">
                                    <CornerDownLeft className="w-4 h-4 text-purple-400 rotate-180 shrink-0" />
                                    <span className="font-bold text-slate-100 text-sm">
                                      🎯 دعوت برای: <span className="text-purple-300">{inv.inviteeName || 'نامشخص / عمومی'}</span>
                                    </span>
                                    <span
                                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                        inv.type === 'fun'
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                      }`}
                                    >
                                      {inv.type === 'fun' ? 'دیت فان 🥳' : 'دعوت رسمی 👔'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs px-2.5 py-1 rounded-xl font-bold ${
                                        inv.status === 'accepted'
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          : inv.status === 'declined'
                                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      }`}
                                    >
                                      {inv.status === 'accepted'
                                        ? 'قبول شد 🎉'
                                        : inv.status === 'declined'
                                        ? 'رد شد 🌸'
                                        : 'در انتظار پاسخ... ⏳'}
                                    </span>

                                    <button
                                      onClick={() => openInvitePage(inv.id)}
                                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold transition-colors"
                                    >
                                      نمایش صفحه
                                    </button>

                                    <button
                                      onClick={() => copyLink(inv.id)}
                                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                      title="کپی لینک"
                                    >
                                      {copiedId === inv.id ? (
                                        <Check className="w-4 h-4 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>

                                    <button
                                      onClick={() => onDeleteInvite(inv.id)}
                                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                                      title="حذف"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* TELEGRAM BOT USER PROFILE OF INVITEE */}
                                {inviteeBotUser ? (
                                  <div className="bg-sky-950/70 border border-sky-500/40 p-3 rounded-2xl text-xs space-y-1.5 my-2 shadow-inner">
                                    <div className="flex items-center justify-between text-sky-300 font-bold border-b border-sky-800/60 pb-1.5">
                                      <span className="flex items-center gap-1.5">
                                        <Send className="w-4 h-4 text-sky-400" />
                                        مشخصات تلگرام کاربر دعوت‌شونده (استفاده از بات):
                                      </span>
                                      <span className="text-[10px] bg-sky-500/20 px-2 py-0.5 rounded-full text-sky-200">
                                        متصل به بات ✅
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-200 text-xs pt-1 font-sans">
                                      <p>• <b>نام تلگرام:</b> {inviteeBotUser.firstName || ''} {inviteeBotUser.lastName || ''}</p>
                                      <p>• <b>یوزرنیم:</b> {inviteeBotUser.username ? `@${inviteeBotUser.username}` : 'ندارد'}</p>
                                      <p>• <b>شناسه چت (Chat ID):</b> <code className="bg-slate-900 px-1.5 py-0.5 rounded text-sky-300 font-mono font-bold">{inviteeBotUser.chatId}</code></p>
                                      <p>• <b>آخرین بازدید:</b> {new Date(inviteeBotUser.lastSeen).toLocaleString('fa-IR')}</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-slate-950/80 border border-slate-800/80 p-2.5 rounded-xl text-xs text-slate-400 my-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                                    <span>این کاربر هنوز ربات تلگرام را استارت نکرده است یا مستقیماً از وب‌سایت استفاده نموده.</span>
                                  </div>
                                )}

                                {/* Responses Details */}
                                {inv.funResponses && (
                                  <div className="bg-slate-950/80 p-3 rounded-xl text-xs space-y-1 text-slate-300 font-sans">
                                    <p className="font-bold text-rose-300">پاسخ‌های دیت فان:</p>
                                    <p>• نوع دعوت: {inv.funResponses.dateChoice || '-'}</p>
                                    <p>• هدیه انتخابی: {inv.funResponses.giftChoice || '-'}</p>
                                    <p>• خبر خوشحالی: {inv.funResponses.shareNews === 'yes' ? 'ارسال شد ✅' : 'خیر ❌'}</p>
                                    {inv.funResponses.customAnswers && Object.keys(inv.funResponses.customAnswers).length > 0 && (
                                      <div className="pt-1 text-purple-300 space-y-0.5 border-t border-slate-800 mt-1">
                                        <p className="font-bold">پاسخ سوالات سفارشی:</p>
                                        {Object.entries(inv.funResponses.customAnswers).map(([qId, ans]) => (
                                          <p key={qId}>• {ans}</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {inv.formalResponses && (
                                  <div className="bg-slate-950/80 p-3 rounded-xl text-xs space-y-1 text-slate-300 font-sans">
                                    <p className="font-bold text-sky-300">پاسخ‌های دعوت رسمی:</p>
                                    <p>• فضای پیشنهادی: {inv.formalResponses.atmospherePreference || '-'}</p>
                                    <p>• زمان پیشنهادی: {inv.formalResponses.timePreference || '-'}</p>
                                    {inv.formalResponses.customNote && (
                                      <p className="text-amber-300 font-medium">💬 پیام/شماره مخاطب: {inv.formalResponses.customNote}</p>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                  <span>کد دعوت: {inv.id}</span>
                                  <span>بازدید: {inv.viewsCount || 0} بار • {new Date(inv.createdAt).toLocaleTimeString('fa-IR')}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: TELEGRAM BOT USERS LIST */}
      {activeSubTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-400" />
                <span>لیست اعضای استفاده‌کننده از ربات تلگرام</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                لیست تمام کاربرانی که حداقل یک بار ربات تلگرام را استارت زده‌اند.
              </p>
            </div>
            <button
              onClick={fetchBotUsers}
              disabled={loadingUsers}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span>{loadingUsers ? 'بروزرسانی...' : 'بروزرسانی لیست'}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس آیدی تلگرام، نام، شناسه چت..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              هیچ کاربر تلگرامی هنوز ثبت نشده است یا با عبارت جستجو تطابق ندارد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.chatId}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{u.firstName || 'کاربر بدون نام'} {u.lastName || ''}</span>
                      {u.username && (
                        <span className="text-xs text-sky-400 font-mono">@{u.username}</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Chat ID: <span className="text-amber-300 font-bold">{u.chatId}</span>
                    </p>
                  </div>

                  <div className="text-left text-[10px] text-slate-500 space-y-0.5">
                    <p>ثبت‌نام: {new Date(u.firstSeen).toLocaleDateString('fa-IR')}</p>
                    <p>آخرین بازدید: {new Date(u.lastSeen).toLocaleTimeString('fa-IR')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: BROADCAST MESSAGE */}
      {activeSubTab === 'broadcast' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-400" />
              ارسال پیام همگانی (Broadcast) به تمام اعضای ربات تلگرام
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              با استفاده از این فرم، می‌توانید یک پیام جدید برای تمام کاربرانی که بات تلگرام را استارت زده‌اند ({botUsers.length} نفر) به طور همزمان ارسال کنید.
            </p>
          </div>

          <form onSubmit={handleBroadcastSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">متن پیام همگانی:</label>
              <textarea
                rows={5}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="متن اطلاع‌رسانی، تخفیف، آپدیت یا پیام عمومی خود را اینجا بنویسید..."
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isBroadcasting ? 'در حال ارسال پیام...' : 'ارسال پیام همگانی به همه 🚀'}</span>
              </button>

              {broadcastResult && (
                <div
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    broadcastResult.success
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {broadcastResult.success
                    ? `پیام با موفقیت به ${broadcastResult.totalSent} نفر ارسال شد!`
                    : broadcastResult.error}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 5: EDIT QUESTIONS & CONTENT */}
      {activeSubTab === 'questions' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                تعیین سوالات و جواب‌ها (کاملاً سفارشی)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                شما می‌توانید عنوان سوالات، گزینه‌ها و همچنین سوال جدید به طرح دیت فان یا دعوت رسمی اضافه کنید (+).
              </p>
            </div>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازنشانی پیش‌فرض</span>
            </button>
          </div>

          {/* Fun Date Questions Form */}
          <div className="space-y-6 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Heart className="w-4 h-4 fill-rose-500" />
              سوالات و گزینه‌های دیت فان (Fun Date)
            </h4>

            {/* Step 1 Question */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">سوال ۱ (دعوت اولیه با دکمه فراری خیر):</label>
              <input
                type="text"
                value={formSettings.funQuestions.step1Question}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    funQuestions: { ...formSettings.funQuestions, step1Question: e.target.value },
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Step 2 Question & Options */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-300 font-bold block">سوال ۲ (نوع قرار):</label>
              <input
                type="text"
                value={formSettings.funQuestions.step2Question}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    funQuestions: { ...formSettings.funQuestions, step2Question: e.target.value },
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 mb-2"
              />

              <p className="text-[11px] text-slate-400 mb-1 font-medium">
                متن گزینه‌ها (علامت‌زدن «گزینه فعال واقعی»):
              </p>
              <div className="space-y-2">
                {formSettings.funQuestions.step2Options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        isFormDirty.current = true;
                        const newOpts = formSettings.funQuestions.step2Options.map((o, i) => ({
                          ...o,
                          enabled: i === idx,
                        }));
                        setFormSettings({
                          ...formSettings,
                          funQuestions: { ...formSettings.funQuestions, step2Options: newOpts },
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        opt.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {opt.enabled ? 'گزینه اصلی ✅' : 'گزینه قفل ❌'}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        isFormDirty.current = true;
                        const newOpts = [...formSettings.funQuestions.step2Options];
                        newOpts[idx].text = e.target.value;
                        setFormSettings({
                          ...formSettings,
                          funQuestions: { ...formSettings.funQuestions, step2Options: newOpts },
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 Question & Options */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <label className="text-xs text-slate-300 font-bold block">سوال ۳ (انتخاب هدیه دیت):</label>
              <input
                type="text"
                value={formSettings.funQuestions.step3Question}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    funQuestions: { ...formSettings.funQuestions, step3Question: e.target.value },
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 mb-2"
              />

              <p className="text-[11px] text-slate-400 mb-1 font-medium">
                متن گزینه‌های هدیه (علامت‌زدن «گزینه فعال واقعی»):
              </p>
              <div className="space-y-2">
                {formSettings.funQuestions.step3Options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        isFormDirty.current = true;
                        const newOpts = formSettings.funQuestions.step3Options.map((o, i) => ({
                          ...o,
                          enabled: i === idx,
                        }));
                        setFormSettings({
                          ...formSettings,
                          funQuestions: { ...formSettings.funQuestions, step3Options: newOpts },
                        });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        opt.enabled
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {opt.enabled ? 'گزینه اصلی ❤️' : 'گزینه قفل ❌'}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        isFormDirty.current = true;
                        const newOpts = [...formSettings.funQuestions.step3Options];
                        newOpts[idx].text = e.target.value;
                        setFormSettings({
                          ...formSettings,
                          funQuestions: { ...formSettings.funQuestions, step3Options: newOpts },
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Fun Questions List */}
            {formSettings.funQuestions.customQuestions && formSettings.funQuestions.customQuestions.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <p className="text-xs text-purple-300 font-bold">سوالات سفارشی اضافه شده به دیت فان:</p>
                {formSettings.funQuestions.customQuestions.map((customQ, qIdx) => (
                  <div key={customQ.id || qIdx} className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-200">سوال سفارشی {qIdx + 1}:</label>
                      <button
                        type="button"
                        onClick={() => handleRemoveFunQuestion(qIdx)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف سوال</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={customQ.title}
                      onChange={(e) => {
                        isFormDirty.current = true;
                        const updated = [...(formSettings.funQuestions.customQuestions || [])];
                        updated[qIdx].title = e.target.value;
                        setFormSettings({
                          ...formSettings,
                          funQuestions: { ...formSettings.funQuestions, customQuestions: updated },
                        });
                      }}
                      placeholder="عنوان سوال سفارشی دیت فان..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                    />

                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] text-slate-400 font-medium">گزینه‌های این سوال:</p>
                      {customQ.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              isFormDirty.current = true;
                              const updated = [...(formSettings.funQuestions.customQuestions || [])];
                              updated[qIdx].options = updated[qIdx].options.map((o, i) => ({
                                ...o,
                                enabled: i === optIdx,
                              }));
                              setFormSettings({
                                ...formSettings,
                                funQuestions: { ...formSettings.funQuestions, customQuestions: updated },
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors ${
                              opt.enabled
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {opt.enabled ? 'گزینه اصلی ✅' : 'قفل ❌'}
                          </button>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              isFormDirty.current = true;
                              const updated = [...(formSettings.funQuestions.customQuestions || [])];
                              updated[qIdx].options[optIdx].text = e.target.value;
                              setFormSettings({
                                ...formSettings,
                                funQuestions: { ...formSettings.funQuestions, customQuestions: updated },
                              });
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-purple-500"
                          />

                          <button
                            type="button"
                            onClick={() => handleRemoveOptionFromFunQuestion(qIdx, optIdx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs shrink-0"
                            title="حذف گزینه"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddOptionToFunQuestion(qIdx)}
                        className="text-[11px] text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/30 flex items-center gap-1 mt-1 font-bold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>افزودن گزینه جدید به این سوال</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PLUS BUTTON TO ADD NEW FUN QUESTION */}
            <button
              type="button"
              onClick={handleAddFunQuestion}
              className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>افزودن سوال جدید به دیت فان (+)</span>
            </button>

            {/* Step 4 Question */}
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">سوال پایانی (ارسال خبر خوشحالی):</label>
              <input
                type="text"
                value={formSettings.funQuestions.step4Question}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    funQuestions: { ...formSettings.funQuestions, step4Question: e.target.value },
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Formal Date Questions Form */}
          <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                شعر، مقدمه و سوالات دعوت رسمی (Formal Date)
              </h4>

              <button
                type="button"
                onClick={handleRandomizePoem}
                className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>انتخاب شعر رندوم از ۵۰ شعر عاشقانه 🎲</span>
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">متن شعر دعوتنامه رسمی:</label>
              <textarea
                rows={4}
                value={formSettings.formalQuestions.poetry}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    formalQuestions: { ...formSettings.formalQuestions, poetry: e.target.value },
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 leading-relaxed font-serif"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">متن مقدمه دعوت رسمی:</label>
              <input
                type="text"
                value={formSettings.formalQuestions.introText}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    formalQuestions: { ...formSettings.formalQuestions, introText: e.target.value },
                  });
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* List of Formal Questions */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <p className="text-xs text-sky-300 font-bold">سوالات و گزینه‌های دیت محترمانه / رسمی:</p>
              {formSettings.formalQuestions.questions?.map((q, qIdx) => (
                <div key={q.id || qIdx} className="bg-slate-900/80 p-4 rounded-xl border border-sky-500/30 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-200">سوال رسمی {qIdx + 1}:</label>
                    <button
                      type="button"
                      onClick={() => handleRemoveFormalQuestion(qIdx)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف سوال</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={q.title}
                    onChange={(e) => {
                      isFormDirty.current = true;
                      const updated = [...(formSettings.formalQuestions.questions || [])];
                      updated[qIdx].title = e.target.value;
                      setFormSettings({
                        ...formSettings,
                        formalQuestions: { ...formSettings.formalQuestions, questions: updated },
                      });
                    }}
                    placeholder="عنوان سوال رسمی..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  />

                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-400 font-medium">گزینه‌های انتخابی این سوال:</p>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="text-[11px] text-sky-400 font-mono w-5 shrink-0 text-center">{optIdx + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            isFormDirty.current = true;
                            const updated = [...(formSettings.formalQuestions.questions || [])];
                            updated[qIdx].options[optIdx] = e.target.value;
                            setFormSettings({
                              ...formSettings,
                              formalQuestions: { ...formSettings.formalQuestions, questions: updated },
                            });
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionFromFormalQuestion(qIdx, optIdx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-xs shrink-0"
                          title="حذف گزینه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddOptionToFormalQuestion(qIdx)}
                      className="text-[11px] text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1 rounded-lg border border-sky-500/30 flex items-center gap-1 mt-1 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>افزودن گزینه جدید به این سوال</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PLUS BUTTON TO ADD NEW FORMAL QUESTION */}
            <button
              type="button"
              onClick={handleAddFormalQuestion}
              className="w-full py-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
            >
              <Plus className="w-4 h-4 text-sky-400" />
              <span>افزودن سوال جدید به دعوت رسمی (+)</span>
            </button>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تغییرات سوالات'}</span>
            </button>

            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                تغییرات با موفقیت ثبت شد! ✅
              </span>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: TELEGRAM BOT CONFIG */}
      {activeSubTab === 'bot' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-400" />
              تنظیمات بات تلگرام و متون ارسالی
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تنظیمات اتصال به Telegram Bot API و سفارشی‌سازی متن خوش‌آمدگویی و قالب‌های ارسال لینک دعوت
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">توکن بات تلگرام (جهت اتصال مستقیم به Telegram Bot API):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formSettings.botConfig.botToken || ''}
                  onChange={(e) => {
                    isFormDirty.current = true;
                    setFormSettings({
                      ...formSettings,
                      botConfig: { ...formSettings.botConfig, botToken: e.target.value },
                    });
                  }}
                  placeholder="مثلاً: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  onClick={handleTestToken}
                  disabled={testingToken}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingToken ? 'animate-spin' : ''}`} />
                  <span>تست اتصال</span>
                </button>
              </div>

              {tokenStatus && (
                <div
                  className={`mt-2 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    tokenStatus.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {tokenStatus.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{tokenStatus.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1 font-medium">آیدی بات تلگرام (Username):</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">https://t.me/</span>
                <input
                  type="text"
                  value={formSettings.botConfig.botUsername || ''}
                  onChange={(e) => {
                    isFormDirty.current = true;
                    setFormSettings({
                      ...formSettings,
                      botConfig: { ...formSettings.botConfig, botUsername: e.target.value },
                    });
                  }}
                  placeholder="Fun_Date_bot"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">متن خوش‌آمدگویی بات (/start):</label>
              <textarea
                rows={3}
                value={formSettings.botConfig.welcomeMessage}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    botConfig: { ...formSettings.botConfig, welcomeMessage: e.target.value },
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">قالب متن ارسالی برای لینک «دیت فان»:</label>
              <textarea
                rows={3}
                value={formSettings.botConfig.funInviteTemplate}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    botConfig: { ...formSettings.botConfig, funInviteTemplate: e.target.value },
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                نکته: عبارت <code className="text-purple-400 font-bold">{'{LINK}'}</code> به صورت خودکار با لینک اختصاصی جایگزین می‌شود.
              </p>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">قالب متن ارسالی برای لینک «دعوت رسمی»:</label>
              <textarea
                rows={3}
                value={formSettings.botConfig.formalInviteTemplate}
                onChange={(e) => {
                  isFormDirty.current = true;
                  setFormSettings({
                    ...formSettings,
                    botConfig: { ...formSettings.botConfig, formalInviteTemplate: e.target.value },
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تنظیمات بات'}</span>
            </button>

            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                تنظیمات بات با موفقیت ثبت شد! ✅
              </span>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 7: SECURITY & PASSWORD SETTINGS */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>تنظیمات امنیت و رمز عبور ورود به پنل مدیریت</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              تعیین رمز عبور جهت محدودسازی دسترسی عمومی به پنل مدیریت و مشاهده اطلاعات ایمیل بازیابی.
            </p>
          </div>

          <div className="space-y-5">
            {/* Password edit */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <label className="text-xs text-slate-300 font-bold block flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>رمز عبور مدیر سیستم:</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  value={formSettings.adminPassword || ''}
                  onChange={(e) => {
                    isFormDirty.current = true;
                    setFormSettings({
                      ...formSettings,
                      adminPassword: e.target.value,
                    });
                  }}
                  placeholder="رمز عبور مدیر را وارد کنید (مثلاً: admin123)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-3 pl-10 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                  title={showAdminPass ? 'مخفی کردن' : 'نمایش'}
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                این رمز عبور برای ورود به بخش مدیریت برنامه استفاده می‌شود.
              </p>
            </div>

            {/* Recovery Email view/edit */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/30 space-y-3">
              <label className="text-xs text-slate-300 font-bold block flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <span>ایمیل پشتیبانی و بازیابی رمز عبور (در سورس برنامه):</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={formSettings.adminRecoveryEmail || 'rasoolramazani@gmail.com'}
                  onChange={(e) => {
                    isFormDirty.current = true;
                    setFormSettings({
                      ...formSettings,
                      adminRecoveryEmail: e.target.value,
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-purple-300 text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playPop();
                    navigator.clipboard.writeText(formSettings.adminRecoveryEmail || 'rasoolramazani@gmail.com');
                    setCopiedEmailSetting(true);
                    setTimeout(() => setCopiedEmailSetting(false), 2000);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1"
                >
                  {copiedEmailSetting ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmailSetting ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                در صورت فراموشی رمز عبور توسط مدیر، در صفحه ورود پیغام پشتیبانی جهت تماس با ایمیل فوق (<code className="text-purple-300 font-mono">rasoolramazani@gmail.com</code>) به کاربر نمایش داده می‌شود.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره رمز عبور و تنظیمات امنیت'}</span>
            </button>

            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-bold animate-pulse">
                تنظیمات امنیت با موفقیت ثبت شد! ✅
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
