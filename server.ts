import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { defaultSettings, defaultDemoInvites } from './src/data/defaultData';
import { InviteSession, AppSettings, StatsOverview, TelegramBotUser } from './src/types';

const DATA_FILE = path.join(process.cwd(), 'data_store.json');

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Helper functions for JSON file persistence
function loadPersistedData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.appSettings) appSettings = data.appSettings;
      if (data.invitesStore && Array.isArray(data.invitesStore)) invitesStore = data.invitesStore;
      if (data.botUsersStore && Array.isArray(data.botUsersStore)) botUsersStore = data.botUsersStore;
      console.log('✅ Loaded persisted data from data_store.json');
    }
  } catch (err) {
    console.error('⚠️ Could not load data_store.json:', err);
  }
}

function savePersistedData() {
  try {
    const data = { appSettings, invitesStore, botUsersStore };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Could not save data_store.json:', err);
  }
}

// In-memory data persistence with JSON file backup
let invitesStore: InviteSession[] = [...defaultDemoInvites];
let appSettings: AppSettings = JSON.parse(JSON.stringify(defaultSettings));
let botUsersStore: TelegramBotUser[] = [];
let botUserSessions: Record<number, { pendingType?: 'fun' | 'formal' }> = {};

function trackBotUser(fromUser: any, chatId: number) {
  if (!chatId) return;
  const existing = botUsersStore.find((u) => u.chatId === chatId);
  const now = new Date().toISOString();
  const firstName = fromUser?.first_name || '';
  const lastName = fromUser?.last_name || '';
  const username = fromUser?.username || '';

  if (existing) {
    existing.lastSeen = now;
    if (firstName) existing.firstName = firstName;
    if (lastName) existing.lastName = lastName;
    if (username) existing.username = username;
  } else {
    botUsersStore.push({
      chatId,
      firstName,
      lastName,
      username,
      firstSeen: now,
      lastSeen: now,
    });
  }
  savePersistedData();
}

// Initialize persisted data from disk if available
loadPersistedData();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to compute stats
function calculateStats(): StatsOverview {
  const totalInvites = invitesStore.length;
  const totalViews = invitesStore.reduce((acc, inv) => acc + (inv.viewsCount || 0), 0);
  const totalAccepted = invitesStore.filter((inv) => inv.status === 'accepted').length;
  const totalDeclined = invitesStore.filter((inv) => inv.status === 'declined').length;
  const totalPending = invitesStore.filter((inv) => inv.status === 'pending').length;
  const funCount = invitesStore.filter((inv) => inv.type === 'fun').length;
  const formalCount = invitesStore.filter((inv) => inv.type === 'formal').length;
  const respondedCount = totalAccepted + totalDeclined;
  const acceptanceRate = respondedCount > 0 ? Math.round((totalAccepted / respondedCount) * 100) : 0;

  return {
    totalInvites,
    totalViews,
    totalAccepted,
    totalDeclined,
    totalPending,
    funCount,
    formalCount,
    acceptanceRate,
  };
}

// Telegram Bot Helper & Connection Manager
let telegramPollingTimer: any = null;
let lastUpdateId = 0;
let cachedBotUsername: string | null = null;

async function getBotUsername(token?: string): Promise<string | null> {
  const activeToken = (token || appSettings.botConfig.botToken || '').trim();
  if (activeToken) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${activeToken}/getMe`);
      const data = await res.json();
      if (data.ok && data.result?.username) {
        const exactUsername = data.result.username.trim().replace(/^@/, '');
        cachedBotUsername = exactUsername;
        if (appSettings.botConfig.botUsername !== exactUsername) {
          appSettings.botConfig.botUsername = exactUsername;
          savePersistedData();
        }
        return exactUsername;
      }
    } catch (err) {
      console.error('Error fetching bot username from Telegram API:', err);
    }
  }

  if (cachedBotUsername) return cachedBotUsername;
  if (appSettings.botConfig.botUsername && appSettings.botConfig.botUsername.trim()) {
    const cleanUsername = appSettings.botConfig.botUsername.trim().replace(/^@/, '');
    cachedBotUsername = cleanUsername;
    return cleanUsername;
  }
  return null;
}

async function pollTelegramUpdates() {
  const token = appSettings.botConfig.botToken?.trim();
  if (!token) return;

  await getBotUsername(token);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=3`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        await handleTelegramUpdate(update, token);
      }
    }
  } catch (err) {
    // Silence network errors when token is invalid or off
  }
}

async function handleTelegramUpdate(update: any, token: string) {
  try {
    const origin = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || 'https://fan-date-bot.onrender.com';
    
    // Message handling
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = (update.message.text || '').trim();
      const fromUser = update.message.from;
      const firstName = fromUser?.first_name || 'کاربر گرامی';
      const senderName = [fromUser?.first_name, fromUser?.last_name].filter(Boolean).join(' ') || firstName;

      trackBotUser(fromUser, chatId);

      // Check if this is a deep link start with invite parameter: /start date-xxx
      const startParam = text.split(' ')[1];
      if (text.startsWith('/start') && startParam && startParam.startsWith('date-')) {
        delete botUserSessions[chatId];
        const inviteId = startParam;
        const invite = invitesStore.find((i) => i.id === inviteId);
        if (invite) {
          invite.inviteeChatId = chatId;
          savePersistedData();
        }
        const webAppUrl = `${origin}?invite=${inviteId}`;

        const inviteeDisplayName = invite?.inviteeName || firstName;
        const inviterDisplayName = invite?.inviterName || 'یک دوست';

        const inviteText = `سلام <b>${escapeHtml(inviteeDisplayName)}</b> عزیز! 🌹\n\n` +
          `یک دعوت‌نامه اختصاصی و ویژه از طرف <b>${escapeHtml(inviterDisplayName)}</b> برای شما ارسال شده است! ✨\n\n` +
          `جهت مشاهده متن کامل دعوت‌نامه و ارسال پاسخ، روی یکی از دکمه‌های زیر کلیک کنید:`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: inviteText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '💌 باز کردن در مینی‌اپ تلگرام 📱',
                    web_app: { url: webAppUrl },
                  },
                ],
                [
                  {
                    text: '🌐 باز کردن در مرورگر',
                    url: webAppUrl,
                  },
                ],
              ],
            },
          }),
        });
        return;
      }

      // Check if user is answering the "What is the invitee's name?" prompt
      if (botUserSessions[chatId]?.pendingType && !text.startsWith('/')) {
        const pendingType = botUserSessions[chatId].pendingType!;
        delete botUserSessions[chatId];

        let inviteeName = '';
        if (text !== 'رد' && text.toLowerCase() !== 'no' && text !== 'بی‌نام' && text !== 'skip') {
          inviteeName = text;
        }

        // Create new invite
        const id = 'date-' + Math.random().toString(36).substring(2, 9);
        const newInvite: InviteSession = {
          id,
          inviterName: senderName,
          inviteeName: inviteeName,
          inviterChatId: chatId,
          type: pendingType,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewsCount: 0,
        };

        invitesStore.unshift(newInvite);
        savePersistedData();

        const botUsername = await getBotUsername(token);
        const inviteLink = botUsername
          ? `https://t.me/${botUsername}?start=${id}`
          : `${origin}?invite=${id}`;

        const inviteeLabel = inviteeName ? ` ${escapeHtml(inviteeName)}` : '';
        const inviterLabel = senderName ? ` ${escapeHtml(senderName)}` : 'یک دوست';

        const messageText = `💌 <b>سلام${inviteeLabel} عزیز! 🌹</b>\n\n` +
          `یک دعوت‌نامه اختصاصی و هیجان‌انگیز برای یک دیدار خاص از طرف <b>${inviterLabel}</b> برای شما ارسال شده است! ✨\n\n` +
          `جهت مشاهده دعوت‌نامه و اعلام پاسخ، روی لینک زیر کلیک کنید:\n` +
          `👇👇👇\n${inviteLink}\n\n` +
          `<i>(می‌توانید این پیام را فوروارد کنید تا مخاطب با کلیک روی لینک وارد مینی‌اپ دیدار شود!)</i>`;

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '💌 دعوت دیدار (مینی‌اپ)',
                    web_app: { url: `${origin}?invite=${id}` },
                  },
                ],
              ],
            },
          }),
        });
        return;
      }

      // Standard /start welcome message or /app command
      if (text.startsWith('/start') || text.startsWith('/app') || text.includes('استارت')) {
        delete botUserSessions[chatId];
        const welcomeText = `<b>${escapeHtml(firstName)}</b> عزیز، خوش آمدی! 👋\n\n${escapeHtml(appSettings.botConfig.welcomeMessage)}`;
        
        // Register WebApp Chat Menu Button
        try {
          await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              menu_button: {
                type: 'web_app',
                text: '❤️👈🏻',
                web_app: { url: `${origin}?miniapp=true` },
              },
            }),
          });
        } catch (e) {
          // Ignore menu button setup errors if unsupported
        }

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: `🥳 ${appSettings.botConfig.funButtonText}`, callback_data: 'create_fun' },
                  { text: `👔 ${appSettings.botConfig.formalButtonText}`, callback_data: 'create_formal' },
                ],
                [
                  {
                    text: '💌 دعوت دیدار (مینی‌اپ)',
                    web_app: { url: `${origin}?miniapp=true` },
                  },
                ],
              ],
            },
          }),
        });
      }
    }

    // Callback Query handling (Inline buttons)
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat?.id || query.from?.id;
      const data = query.data;
      const fromUser = query.from;

      trackBotUser(fromUser, chatId);

      let type: 'fun' | 'formal' = 'fun';
      if (data === 'create_formal') type = 'formal';

      // Set session awaiting invitee name
      botUserSessions[chatId] = { pendingType: type };

      const promptText = `✍️ **لطفاً نام یا عنوان فرد دعوت‌شونده (مخاطب) را ارسال کنید:**\n\n` +
        `_(مثلاً: «مریم جان»، «علی عزیز» یا «جناب مهندس»، یا اگر نمی‌خواهید نامی درج شود کلمه «رد» را بفرستید)_`;

      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: promptText,
          parse_mode: 'Markdown',
        }),
      });

      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: query.id, text: 'نام مخاطب را بفرستید ✍️' }),
      });
    }
  } catch (err) {
    console.error('Error handling Telegram update:', err);
  }
}

// Start polling loop for Telegram Bot
if (telegramPollingTimer) clearInterval(telegramPollingTimer);
telegramPollingTimer = setInterval(pollTelegramUpdates, 4000);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test Telegram Bot Token
app.post('/api/bot/test', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ ok: false, error: 'توکن وارد نشده است.' });
  }

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
    const data = await telegramRes.json();
    if (data.ok && data.result?.username) {
      cachedBotUsername = data.result.username.trim().replace(/^@/, '');
      appSettings.botConfig.botUsername = cachedBotUsername;
      savePersistedData();
      res.json({ ok: true, bot: data.result });
    } else {
      res.status(400).json({ ok: false, error: data.description || 'توکن نامعتبر است.' });
    }
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'خطا در ارتباط با سرورهای تلگرام.' });
  }
});

async function sendTelegramMessage(chatId: string | number, text: string, options: any = {}) {
  const token = appSettings.botConfig.botToken?.trim();
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      }),
    });
  } catch (err) {
    console.error(`Error sending Telegram message to ${chatId}:`, err);
  }
}

async function sendTelegramNotificationToAdmin(text: string) {
  await sendTelegramMessage('86502422', text);
}

// Reset admin password to a random password and send notification to Telegram
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    let randStr = '';
    for (let i = 0; i < 4; i++) {
      randStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const newPassword = `${randStr}${randNum}`;

    appSettings.adminPassword = newPassword;
    savePersistedData();

    console.log(`[PASSWORD RESET] New random password generated: "${newPassword}" for Telegram ID: 86502422`);

    await sendTelegramNotificationToAdmin(
      `🔑 <b>رمز عبور جدید پنل مدیریت تولید شد:</b>\n\n<code>${newPassword}</code>\n\nجهت ورود به پنل مدیریت از این رمز عبور استفاده کنید.`
    );

    res.json({
      success: true,
      message: 'رمز عبور جدید با موفقیت تولید و به ربات تلگرام ارسال گردید.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'خطا در ریست رمز عبور.' });
  }
});

// Get settings
app.get('/api/settings', (req, res) => {
  res.json(appSettings);
});

// Update settings
app.post('/api/settings', async (req, res) => {
  if (req.body) {
    appSettings = { ...appSettings, ...req.body };
    if (appSettings.botConfig.botUsername) {
      appSettings.botConfig.botUsername = appSettings.botConfig.botUsername.trim().replace(/^@/, '');
      cachedBotUsername = appSettings.botConfig.botUsername;
    } else {
      cachedBotUsername = null;
    }
    if (appSettings.botConfig.botToken?.trim()) {
      await getBotUsername(appSettings.botConfig.botToken);
    } else {
      appSettings.botConfig.botToken = '';
      cachedBotUsername = null;
    }
    savePersistedData();
  }
  res.json({ success: true, settings: appSettings });
});

// Reset settings to default
app.post('/api/settings/reset', (req, res) => {
  appSettings = JSON.parse(JSON.stringify(defaultSettings));
  savePersistedData();
  res.json({ success: true, settings: appSettings });
});

// Get invites & stats (for Admin panel)
app.get('/api/invites', (req, res) => {
  const stats = calculateStats();
  res.json({ invites: invitesStore, stats });
});

// Create new invite
app.post('/api/invites', async (req, res) => {
  const { inviterName, inviteeName, type, inviterChatId } = req.body;

  const id = 'date-' + Math.random().toString(36).substring(2, 9);
  const newInvite: InviteSession = {
    id,
    inviterName: inviterName || 'کاربر عزیز',
    inviteeName: inviteeName || '',
    inviterChatId: inviterChatId || undefined,
    type: type === 'formal' ? 'formal' : 'fun',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewsCount: 0,
  };

  invitesStore.unshift(newInvite);
  savePersistedData();

  // Send newly created link to inviter and admin on Telegram
  const token = appSettings.botConfig.botToken?.trim();
  if (token) {
    try {
      const origin = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || 'https://fan-date-bot.onrender.com';
      const botUsername = await getBotUsername(token);
      const inviteLink = botUsername
        ? `https://t.me/${botUsername}?start=${id}`
        : `${origin}?invite=${id}`;

      const notifyMsg = `💌 <b>لینک دعوت جدید در مینی‌اپ ساخته شد!</b>\n\n` +
        `👤 <b>فرستنده:</b> ${escapeHtml(newInvite.inviterName)}\n` +
        `🎯 <b>مخاطب:</b> ${escapeHtml(newInvite.inviteeName || 'بدون نام')}\n` +
        `🎈 <b>نوع:</b> ${newInvite.type === 'formal' ? 'رسمی 👔' : 'صمیمانه 🥳'}\n\n` +
        `🔗 <b>لینک اختصاصی دعوت:</b>\n<a href="${inviteLink}">${inviteLink}</a>`;

      if (newInvite.inviterChatId) {
        await sendTelegramMessage(newInvite.inviterChatId, notifyMsg);
      }
    } catch (e) {
      console.error('Error posting invite to Telegram:', e);
    }
  }

  res.json({ success: true, invite: newInvite });
});

// Get invite details (for Invitee Guest view)
app.get('/api/invites/:id', (req, res) => {
  const invite = invitesStore.find((inv) => inv.id === req.params.id);
  if (!invite) {
    return res.status(404).json({ error: 'دعوت‌نامه یافت نشد!' });
  }

  // Increment view count
  invite.viewsCount = (invite.viewsCount || 0) + 1;
  invite.updatedAt = new Date().toISOString();
  savePersistedData();

  res.json({ invite, settings: appSettings });
});

// Get Telegram Bot Users
app.get('/api/bot/users', (req, res) => {
  res.json({ users: botUsersStore });
});

// Broadcast message to all Telegram Bot Users
app.post('/api/bot/broadcast', async (req, res) => {
  const { message } = req.body;
  const token = appSettings.botConfig.botToken?.trim();

  if (!token) {
    return res.status(400).json({ error: 'توکن ربات ثبت نشده است. ابتدا توکن ربات را در تنظیمات وارد کنید.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'متن پیام نمی‌تواند خالی باشد.' });
  }

  if (botUsersStore.length === 0) {
    return res.status(400).json({ error: 'هیچ کاربری در لیست کاربران ربات یافت نشد.' });
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const user of botUsersStore) {
    try {
      const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.chatId,
          text: message.trim(),
          parse_mode: 'Markdown',
        }),
      });
      const data = await telegramRes.json();
      if (data.ok) {
        totalSent++;
      } else {
        totalFailed++;
      }
    } catch (err) {
      totalFailed++;
    }
  }

  res.json({ success: true, totalSent, totalFailed, totalUsers: botUsersStore.length });
});

// Respond to invite
app.post('/api/invites/:id/respond', async (req, res) => {
  const invite = invitesStore.find((inv) => inv.id === req.params.id);
  if (!invite) {
    return res.status(404).json({ error: 'دعوت‌نامه یافت نشد!' });
  }

  const { funResponses, formalResponses, status, inviteeChatId } = req.body;

  if (inviteeChatId) {
    invite.inviteeChatId = inviteeChatId;
  }
  if (funResponses) {
    invite.funResponses = { ...invite.funResponses, ...funResponses };
  }
  if (formalResponses) {
    invite.formalResponses = { ...invite.formalResponses, ...formalResponses };
  }
  if (status) {
    invite.status = status;
  }

  invite.updatedAt = new Date().toISOString();
  savePersistedData();

  // Notify Inviter & Admin on Telegram
  const token = appSettings.botConfig.botToken?.trim();
  if (token) {
    try {
      let notifyText = '';
      const inviteeLabel = invite.inviteeName ? ` (${escapeHtml(invite.inviteeName)})` : '';
      const inviterLabel = invite.inviterName ? ` (ارسال شده توسط ${escapeHtml(invite.inviterName)})` : '';

      if (invite.status === 'accepted') {
        if (invite.type === 'fun') {
          notifyText = `🎉 <b>خبر فوق‌العاده! دعوت‌نامه قبول شد!</b>\n\n` +
            `مخاطب<b>${inviteeLabel}</b> دعوت را با کمال میل <b>قبول کرد!</b> ❤️${inviterLabel}\n\n` +
            `📌 <b>نوع قرار:</b> ${escapeHtml(invite.funResponses?.dateChoice || 'پیاده‌روی دو نفره')}\n` +
            `🎁 <b>هدیه انتخابی:</b> ${escapeHtml(invite.funResponses?.giftChoice || 'حضور گرم شما')}\n\n` +
            `امیدواریم بهترین لحظات را در کنار هم داشته باشید! ✨`;
        } else {
          notifyText = `🌸 <b>خبر جدید! دعوت رسمی پذیرفته شد!</b>\n\n` +
            `مخاطب<b>${inviteeLabel}</b> دعوت رسمی را با احترام <b>پذیرفت.</b> ✨${inviterLabel}\n\n` +
            `☕️ <b>فضای پیشنهادی:</b> ${escapeHtml(invite.formalResponses?.atmospherePreference || 'کافه آرام')}\n` +
            `⏰ <b>زمان پیشنهادی:</b> ${escapeHtml(invite.formalResponses?.timePreference || 'عصر روز تعطیل')}\n\n` +
            `با آرزوی اوقاتی خوش و خاطره‌انگیز.`;
        }
      } else if (invite.status === 'declined') {
        notifyText = `🌺 <b>خبر جدید: پاسخ به دعوت‌نامه (رد شد)</b>\n\n` +
          `مخاطب<b>${inviteeLabel}</b> دعوت‌نامه را <b>رد کرد</b> (عدم امکان حضور).${inviterLabel}`;
      }

      if (invite.formalResponses?.customNote) {
        notifyText += `\n\n💬 <b>پیام/شماره تماس مخاطب:</b>\n${escapeHtml(invite.formalResponses.customNote)}`;
      }

      if (notifyText && invite.inviterChatId) {
        await sendTelegramMessage(invite.inviterChatId, notifyText);
      }
    } catch (err) {
      console.error('Error sending Telegram response notification:', err);
    }
  }

  res.json({ success: true, invite });
});

// Delete invite
app.delete('/api/invites/:id', (req, res) => {
  invitesStore = invitesStore.filter((inv) => inv.id !== req.params.id);
  savePersistedData();
  res.json({ success: true });
});

// Telegram Bot Webhook endpoint (Simulated or Real connection)
app.post('/api/bot/webhook', (req, res) => {
  const update = req.body;
  console.log('Received Telegram update:', update);
  res.json({ ok: true, status: 'processed' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Server running on http://localhost:${PORT}`);
  });
}

startServer();
