export type InviteType = 'fun' | 'formal';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface FunResponses {
  dateChoice?: string;
  giftChoice?: string;
  shareNews?: 'yes' | 'no';
  customAnswers?: Record<string, string>;
}

export interface FormalResponses {
  timePreference?: string;
  locationPreference?: string;
  atmospherePreference?: string;
  accepted?: boolean;
  customNote?: string;
  [key: string]: any;
}

export interface TelegramBotUser {
  chatId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  firstSeen: string;
  lastSeen: string;
}

export interface InviteSession {
  id: string;
  inviterName: string;
  inviteeName?: string;
  inviterChatId?: number | string;
  inviteeChatId?: number | string;
  type: InviteType;
  status: InviteStatus;
  funResponses?: FunResponses;
  formalResponses?: FormalResponses;
  createdAt: string;
  updatedAt: string;
  viewsCount: number;
}

export interface FunCustomQuestion {
  id: string;
  title: string;
  options: { text: string; enabled: boolean }[];
}

export interface FunQuestionConfig {
  step1Question: string; // آیا دعوت منو برای دیت قبول می‌کنی؟
  step2Question: string; // دوس داری به صرف چی دعوت بشی؟
  step2Options: { text: string; enabled: boolean }[];
  step3Question: string; // برای هدیه دیت چی دوس داری؟
  step3Options: { text: string; enabled: boolean }[];
  step4Question: string; // بگو سوال کن خبر خوشحالی را بدم؟
  customQuestions?: FunCustomQuestion[];
}

export interface FormalQuestionConfig {
  poetry: string;
  introText: string;
  questions: {
    id: string;
    title: string;
    options: string[];
  }[];
}

export interface BotConfig {
  welcomeMessage: string;
  funButtonText: string;
  formalButtonText: string;
  funInviteTemplate: string;
  formalInviteTemplate: string;
  botToken?: string;
  botUsername?: string;
  appUrl?: string;
}

export interface AppSettings {
  funQuestions: FunQuestionConfig;
  formalQuestions: FormalQuestionConfig;
  botConfig: BotConfig;
  adminPassword?: string;
  adminSecretKey?: string;
  adminRecoveryEmail?: string;
}

export interface StatsOverview {
  totalInvites: number;
  totalViews: number;
  totalAccepted: number;
  totalDeclined: number;
  totalPending: number;
  funCount: number;
  formalCount: number;
  acceptanceRate: number;
}
