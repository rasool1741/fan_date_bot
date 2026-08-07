import { AppSettings, InviteSession } from '../types';

export const defaultSettings: AppSettings = {
  funQuestions: {
    step1Question: 'آیا دعوت منو برای دیت قبول می‌کنی؟ 🌹✨',
    step2Question: 'دوس داری به صرف چی دعوت بشی؟ ☕️🍰',
    step2Options: [
      { text: 'شام لاکچری پنت‌هاوس برج میلاد 🏙', enabled: false },
      { text: 'سفر آخر هفته به پاریس ✈️🗼', enabled: false },
      { text: 'یک پیتزای ۲ متری با نوشابه 🍕', enabled: false },
      { text: 'پیاده‌روی دو نفره و گپ زدن 🚶‍♂️🚶‍♀️✨', enabled: true },
    ],
    step3Question: 'برای هدیه دیت چی دوس داری؟ 🎁❤️',
    step3Options: [
      { text: 'یک آیفون ۱۶ پرومکس بنفش 📱', enabled: false },
      { text: 'یک ماشین شاسی‌بلند قرمز 🚗', enabled: false },
      { text: 'سند یک ویلا تو شمال 🏡', enabled: false },
      { text: 'عزیزم تو خودت هدیه‌ای 🎁❤️', enabled: true },
    ],
    step4Question: 'بگو سوال کن خبر خوشحالی را بدم؟ 🎉😍',
  },
  formalQuestions: {
    poetry: `در تمنای تو امشب تا سحر بیدارم
ای خوش آن دم که ز وصل تو پیامی دارم...
بی قرارم که در این خلوت سرشار از مهر
افتخار هم‌کلامی با تو را بردارم ✨🌹`,
    introText: 'با کمال احترام و افتخار، از شما دعوت می‌شود تا در یک نشست دوستانه و صمیمی، افتخار همراهی بدهید.',
    questions: [
      {
        id: 'atmospherePreference',
        title: 'فضای پیشنهادی مورد علاقه شما جهت گفتگو:',
        options: ['کافه آرام و باوقار ☕️', 'رستوران سنتی و شیک 🍽', 'فضای باز و طبیعت زیبا 🌿', 'انتخاب با شماست ✨'],
      },
      {
        id: 'timePreference',
        title: 'بهترین زمان پیشنهادی شما برای این قرار:',
        options: ['عصر روزهای آخر هفته 🌅', 'شب‌های وسط هفته 🌙', 'آخر هفته تایم ناهار ☀️', 'هماهنگی تلفنی 📞'],
      },
    ],
  },
  botConfig: {
    welcomeMessage: 'سلام رفیق! 👋 به ربات هوشمند دعوت به دیت خوش اومدی. با این ربات میتونی خیلی جذاب و بازی‌گونه دوستت یا مخاطب خاصت رو به یک قرار عالی دعوت کنی! اول سبک دعوتت رو انتخاب کن:',
    funButtonText: '🥳 دعوت فان و بازی‌گونه',
    formalButtonText: '👔 دعوت رسمی و شیک',
    funInviteTemplate: `سلام عزیز دلم! 🔥 
یه دعوتنامه اختصاصی و بامزه برات فرستادم. 
فقط یه شرط داره: باید به سوالاتش صادقانه جواب بدی! 😉

برای باز کردن دعوتنامه روی لینک زیر بزن 👇
{LINK}`,
    formalInviteTemplate: `با سلام و احترام 🌸
دعوتنامه‌ای محترمانه جهت تجدید دیدار و هم‌کلامی برای شما ارسال گردیده است.

مشاهده متن کامل دعوتنامه و پاسخ: 👇
{LINK}`,
    botToken: '',
    botUsername: 'Fun_Date_bot',
    appUrl: '',
  },
  adminPassword: 'admin',
  adminSecretKey: 'mysecretkey123',
  adminRecoveryEmail: 'rasoolramazani@gmail.com',
};

export const defaultDemoInvites: InviteSession[] = [
  {
    id: 'demo-fun-1',
    inviterName: 'امیر',
    inviteeName: 'سارا',
    type: 'fun',
    status: 'accepted',
    funResponses: {
      dateChoice: 'پیاده‌روی دو نفره و گپ زدن 🚶‍♂️🚶‍♀️✨',
      giftChoice: 'عزیزم تو خودت هدیه‌ای 🎁❤️',
      shareNews: 'yes',
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    viewsCount: 3,
  },
  {
    id: 'demo-formal-1',
    inviterName: 'علی',
    inviteeName: 'مریم خانوم',
    type: 'formal',
    status: 'accepted',
    formalResponses: {
      atmospherePreference: 'کافه آرام و باوقار ☕️',
      timePreference: 'عصر روزهای آخر هفته 🌅',
      accepted: true,
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
    viewsCount: 2,
  },
  {
    id: 'demo-fun-2',
    inviterName: 'محمد',
    inviteeName: 'نازنین',
    type: 'fun',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    viewsCount: 1,
  },
];
