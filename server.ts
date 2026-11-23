import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
};

const verifyPassword = (password: string, stored: string): boolean => {
  if (!stored) return false;
  if (!stored.includes(':')) {
    return stored === password;
  }
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
};

const toPublicUser = (u: any) => {
  if (!u || typeof u !== 'object') return null;
  const p = u.privacySettings || {};
  const privacy = {
    hideUsername: p.hideUsername ?? false,
    hidePhone: p.hidePhone ?? true,
    hideEmail: p.hideEmail ?? true,
    hideBirthday: p.hideBirthday ?? true,
    hideAge: p.hideAge ?? true,
    hideGender: p.hideGender ?? false,
    hideLocation: p.hideLocation ?? false,
  };
  const {
    password: _p,
    passwordHash: _ph,
    contact: _c,
    email,
    phone,
    age,
    dateOfBirth,
    gender,
    location,
    ...publicFields
  } = u;
  return {
    ...publicFields,
    privacySettings: privacy,
    ...(privacy.hideEmail ? {} : email !== undefined ? { email } : {}),
    ...(privacy.hidePhone ? {} : phone !== undefined ? { phone } : {}),
    ...(privacy.hideAge ? {} : age !== undefined ? { age } : {}),
    ...(privacy.hideBirthday ? {} : dateOfBirth !== undefined ? { dateOfBirth } : {}),
    ...(privacy.hideGender ? {} : gender !== undefined ? { gender } : {}),
    ...(privacy.hideLocation ? {} : location !== undefined ? { location } : {}),
  };
};

const toSelfUser = (u: any) => {
  if (!u || typeof u !== 'object') return null;
  const { password: _p, passwordHash: _ph, ...safeSelf } = u;
  return safeSelf;
};

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Fast in-memory database with file persistence fallback
interface ServerStore {
  posts: any[];
  comments: Record<string, any[]>;
  users: Record<string, any>;
  conversations: any[];
  chatHistory: Record<string, any[]>;
  notifications: any[];
  reports?: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');

// Ensure data & uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

let store: ServerStore = {
  posts: [],
  comments: {},
  users: {},
  conversations: [],
  chatHistory: {},
  notifications: [],
  reports: [],
};

// Load saved data if exists
if (fs.existsSync(STORE_FILE)) {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    store = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse store.json, using defaults', e);
  }
}

const persistStore = () => {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    console.error('Failed to persist store', e);
  }
};

// Purge known fake seeded accounts/posts if still present in store.json
const FAKE_UIDS = new Set([
  'user_eyasin_gamer_01',
  'creator_raisul_kuakata',
  'creator_01',
  'creator_02',
  'creator_03',
  'creator_04',
]);
let storeCleaned = false;
for (const key of Object.keys(store.users || {})) {
  const u = store.users[key];
  if (
    FAKE_UIDS.has(u?.uid) &&
    (u?.uid !== 'user_eyasin_gamer_01' || (u?.username === 'h.m.eyasin.gamer' && u?.contact === '01700000000'))
  ) {
    delete store.users[key];
    storeCleaned = true;
  }
}
if (storeCleaned) {
  persistStore();
}

// Seed verified playable showcase posts if store.posts is empty so new visitors always see videos
if (!Array.isArray(store.posts) || store.posts.length === 0) {
  const baseTs = Date.now();
  store.posts = [
    {
      id: 'starter_video_01',
      userId: 'rongin_showcase_01',
      username: 'rongin.nature',
      userDisplayName: 'Rongin Nature',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.jpg',
      caption: 'সাগরের গভীর নীল জলে শান্তির মুহূর্ত 🌊🐢 #nature #ocean #bangladesh #foryou',
      musicTitle: 'Ocean Waves Ambient',
      musicAuthor: 'Rongin Sound',
      musicCover: 'https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.jpg',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      saves: 0,
      views: 124,
      watchTime: 0,
      timestamp: baseTs - 1000 * 60 * 30,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      isVerified: true,
      tags: ['nature', 'ocean', 'bangladesh', 'foryou'],
      privacy: 'public',
    },
    {
      id: 'starter_video_02',
      userId: 'rongin_showcase_02',
      username: 'dhaka.vibes',
      userDisplayName: 'Dhaka Vibes',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.jpg',
      caption: 'সকালের রোদ আর সুন্দর মুহূর্ত ✨🌿 #rongin #vibes #trending #foryou',
      musicTitle: 'Morning Breeze Lo-Fi',
      musicAuthor: 'Bangla Beats',
      musicCover: 'https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.jpg',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      saves: 0,
      views: 98,
      watchTime: 0,
      timestamp: baseTs - 1000 * 60 * 90,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      isVerified: true,
      tags: ['rongin', 'vibes', 'trending', 'foryou'],
      privacy: 'public',
    },
    {
      id: 'starter_video_03',
      userId: 'rongin_showcase_03',
      username: 'wildlife.bd',
      userDisplayName: 'Wildlife Explorer',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/samples/elephants.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/samples/elephants.jpg',
      caption: 'প্রকৃতির বুকে বন্যপ্রাণীর অসাধারণ দৃশ্য 🐘🌴 #wildlife #explore #rongin',
      musicTitle: 'Forest Acoustic',
      musicAuthor: 'Rongin Studio',
      musicCover: 'https://res.cloudinary.com/demo/video/upload/samples/elephants.jpg',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      saves: 0,
      views: 76,
      watchTime: 0,
      timestamp: baseTs - 1000 * 60 * 150,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      isVerified: false,
      tags: ['wildlife', 'explore', 'rongin'],
      privacy: 'public',
    },
    {
      id: 'starter_video_04',
      userId: 'rongin_showcase_04',
      username: 'adventure.zone',
      userDisplayName: 'Adventure Zone',
      avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=160&auto=format&fit=crop&q=80',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/rafting.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/rafting.jpg',
      caption: 'নদীর স্রোতে অ্যাডভেঞ্চার রাইড! 🚣‍♂️💦 #adventure #travel #bangladesh #viral',
      musicTitle: 'High Energy Beat',
      musicAuthor: 'Travel Sound',
      musicCover: 'https://res.cloudinary.com/demo/video/upload/rafting.jpg',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      saves: 0,
      views: 64,
      watchTime: 0,
      timestamp: baseTs - 1000 * 60 * 210,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      isVerified: false,
      tags: ['adventure', 'travel', 'bangladesh', 'viral'],
      privacy: 'public',
    },
    {
      id: 'starter_video_05',
      userId: 'rongin_showcase_05',
      username: 'cute.pets.bd',
      userDisplayName: 'Cute Pets BD',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80',
      videoUrl: 'https://res.cloudinary.com/demo/video/upload/dog.mp4',
      thumbnailUrl: 'https://res.cloudinary.com/demo/video/upload/dog.jpg',
      caption: 'মিষ্টি বন্ধুর মজার খেলা 🐶❤️ #pets #cute #fun #foryou',
      musicTitle: 'Happy Day Tune',
      musicAuthor: 'Rongin Music',
      musicCover: 'https://res.cloudinary.com/demo/video/upload/dog.jpg',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      saves: 0,
      views: 52,
      watchTime: 0,
      timestamp: baseTs - 1000 * 60 * 270,
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      isVerified: false,
      tags: ['pets', 'cute', 'fun', 'foryou'],
      privacy: 'public',
    },
  ];
  persistStore();
}

const ALLOWED_MEDIA_EXT: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const isSafeMediaUrl = (url: unknown): boolean => {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/uploads/')
  );
};

// ================= API ENDPOINTS =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now(), cachedPosts: store.posts.length });
});

// Binary media upload fallback (when Cloudinary is unavailable)
app.post(
  '/api/upload',
  express.raw({ type: ['video/*', 'image/*', 'application/octet-stream'], limit: '50mb' }),
  (req, res) => {
    const rawType = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const ext = ALLOWED_MEDIA_EXT[rawType];
    if (!ext) {
      return res.status(400).json({ success: false, error: 'Unsupported media type' });
    }
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      return res.status(400).json({ success: false, error: 'Empty upload body' });
    }
    const filename = `${crypto.randomUUID()}${ext}`;
    const destPath = path.resolve(UPLOADS_DIR, filename);
    if (!destPath.startsWith(UPLOADS_DIR + path.sep)) {
      return res.status(400).json({ success: false, error: 'Invalid upload path' });
    }
    try {
      fs.writeFileSync(destPath, buf);
      return res.json({ success: true, url: `/uploads/${filename}` });
    } catch {
      return res.status(500).json({ success: false, error: 'Failed to save media' });
    }
  }
);

// GET /api/posts
app.get('/api/posts', (req, res) => {
  const { feed, tag } = req.query;
  let result = [...store.posts];

  if (tag && typeof tag === 'string') {
    result = result.filter((p) => p.tags && p.tags.includes(tag.toLowerCase()));
  }

  if (feed === 'following') {
    result = result.filter((p) => p.isFollowing);
  }

  res.json({ success: true, posts: result });
});

// POST /api/posts
app.post('/api/posts', (req, res) => {
  const newPost = req.body;
  if (!newPost || !isSafeMediaUrl(newPost.videoUrl)) {
    return res.status(400).json({ error: 'Valid video URL is required' });
  }

  store.posts.unshift(newPost);
  persistStore();

  res.json({ success: true, post: newPost });
});

// PUT /api/posts/:id
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = store.posts.findIndex((p) => p.id === id);
  if (idx !== -1) {
    store.posts[idx] = { ...store.posts[idx], ...updates };
    persistStore();
    return res.json({ success: true, post: store.posts[idx] });
  }
  res.json({ success: true });
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  store.posts = store.posts.filter((p) => p.id !== id);
  persistStore();
  res.json({ success: true });
});

// POST & GET /api/reports
app.post('/api/reports', (req, res) => {
  const report = req.body;
  if (!report || !report.postId || !report.subject) {
    return res.status(400).json({ error: 'Report details are required' });
  }
  if (!store.reports) store.reports = [];
  store.reports.unshift(report);
  persistStore();
  res.json({ success: true, report });
});

app.get('/api/reports', (req, res) => {
  res.json({ success: true, reports: store.reports || [] });
});

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const post = store.posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.isLiked = !post.isLiked;
  post.likes = Math.max(0, post.likes + (post.isLiked ? 1 : -1));
  persistStore();

  res.json({ success: true, isLiked: post.isLiked, likes: post.likes });
});

// POST /api/posts/:id/save
app.post('/api/posts/:id/save', (req, res) => {
  const { id } = req.params;
  const post = store.posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.isSaved = !post.isSaved;
  post.saves = Math.max(0, post.saves + (post.isSaved ? 1 : -1));
  persistStore();

  res.json({ success: true, isSaved: post.isSaved, saves: post.saves });
});

// POST /api/posts/:id/view
app.post('/api/posts/:id/view', (req, res) => {
  const { id } = req.params;
  const { watchSec = 0, incrementView = false } = req.body;
  const post = store.posts.find((p) => p.id === id);

  if (post) {
    if (incrementView === true) {
      post.views = (post.views || 0) + 1;
    }
    post.watchTime = (post.watchTime || 0) + Number(watchSec || 0);
    persistStore();
    return res.json({ success: true, views: post.views, watchTime: post.watchTime });
  }

  res.json({ success: true });
});

// Authentication Endpoints
app.post('/api/auth/register', (req, res) => {
  const newUser = req.body;
  if (!newUser || !newUser.contact || !newUser.name) {
    return res.status(400).json({ success: false, error: 'সকল প্রয়োজনীয় তথ্য প্রদান করুন।' });
  }

  const cleanContact = (newUser.contact || '').trim().toLowerCase();

  // Strict constraint: ONE account per mobile number or email
  const existingUser = Object.values(store.users).find((u: any) => {
    const c = (u.contact || u.email || u.phone || '').trim().toLowerCase();
    return c === cleanContact;
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'এই মোবাইল নাম্বার অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে। প্রতি মোবাইল বা ইমেইল দিয়ে কেবল একটি আইডি খোলা সম্ভব।',
    });
  }

  const { password, ...rest } = newUser;
  const storedUser = {
    ...rest,
    passwordHash: password ? hashPassword(String(password)) : undefined,
  };
  store.users[newUser.username] = storedUser;
  persistStore();
  res.json({ success: true, user: toSelfUser(storedUser) });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'মোবাইল বা ইমেইল প্রদান করুন।' });
  }

  const cleanIdent = identifier.trim().toLowerCase();
  const matchedUser: any = Object.values(store.users).find((u: any) => {
    const c = (u.contact || u.email || u.phone || '').trim().toLowerCase();
    const uname = (u.username || '').trim().toLowerCase();
    return c === cleanIdent || uname === cleanIdent;
  });

  if (!matchedUser) {
    return res.status(404).json({ success: false, error: 'কোনো অ্যাকাউন্ট পাওয়া যায়নি।' });
  }

  const storedHashOrPass = matchedUser.passwordHash || matchedUser.password;
  if (storedHashOrPass && !verifyPassword(String(password || ''), storedHashOrPass)) {
    return res.status(401).json({ success: false, error: 'ভুল পাসওয়ার্ড।' });
  }

  res.json({ success: true, user: toSelfUser(matchedUser) });
});

app.post('/api/auth/change-password', (req, res) => {
  const { uid, username, currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 4) {
    return res.status(400).json({ success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' });
  }
  const targetUser: any =
    (username && store.users[username]) ||
    Object.values(store.users || {}).find(
      (u: any) => (uid && u?.uid === uid) || (username && (u?.username || '').toLowerCase() === String(username).toLowerCase())
    );
  if (!targetUser) {
    return res.json({ success: true });
  }
  const storedHashOrPass = targetUser.passwordHash || targetUser.password;
  if (storedHashOrPass && !verifyPassword(String(currentPassword || ''), storedHashOrPass)) {
    return res.status(401).json({ success: false, error: 'আগের পাসওয়ার্ডটি সঠিক নয়।' });
  }
  targetUser.passwordHash = hashPassword(String(newPassword));
  delete targetUser.password;
  persistStore();
  res.json({ success: true });
});

// GET & POST /api/posts/:id/comments
app.get('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, comments: store.comments[id] || [] });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const comment = req.body;

  if (!store.comments[id]) {
    store.comments[id] = [];
  }

  store.comments[id].unshift(comment);

  const post = store.posts.find((p) => p.id === id);
  if (post) {
    post.commentsCount = (post.commentsCount || 0) + 1;
  }

  persistStore();
  res.json({ success: true, comment });
});

// User Profile (Public endpoints ALWAYS strip contact, email, phone, age, password)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: Object.values(store.users || {}).map((u) => toPublicUser(u)).filter(Boolean),
  });
});

app.get('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const user =
    store.users[username] ||
    Object.values(store.users || {}).find(
      (u: any) => u?.uid === username || (u?.username || '').toLowerCase() === username.toLowerCase()
    ) ||
    null;
  res.json({ success: Boolean(user), user: toPublicUser(user) });
});

app.put('/api/users/profile', (req, res) => {
  const updated = req.body;
  if (updated && updated.username) {
    const existing = store.users[updated.username] ||
      Object.values(store.users || {}).find((u: any) => u?.uid === updated.uid) ||
      {};
    const { password: _p, ...safeUpdates } = updated;
    store.users[updated.username] = {
      ...existing,
      ...safeUpdates,
    };
    persistStore();
    return res.json({ success: true, user: toSelfUser(store.users[updated.username]) });
  }
  res.json({ success: true, user: toSelfUser(updated) });
});

// Conversations & Messages
app.get('/api/conversations', (req, res) => {
  res.json({ success: true, conversations: store.conversations });
});

app.post('/api/conversations/:id/messages', (req, res) => {
  const { id } = req.params;
  const message = req.body;

  if (!store.chatHistory[id]) {
    store.chatHistory[id] = [];
  }

  store.chatHistory[id].push(message);
  persistStore();

  res.json({ success: true, message });
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, notifications: store.notifications });
});

app.post('/api/notifications/read', (req, res) => {
  store.notifications.forEach((n) => {
    n.isRead = true;
  });
  persistStore();
  res.json({ success: true });
});

// Creator Analytics
app.get('/api/analytics', (req, res) => {
  const totalViews = store.posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalWatchSec = store.posts.reduce((acc, p) => acc + (p.watchTime || 0), 0);
  const totalEngagement = store.posts.reduce(
    (acc, p) => acc + (p.likes || 0) + (p.commentsCount || 0) + (p.shares || 0),
    0
  );

  res.json({
    success: true,
    stats: {
      views: totalViews,
      watchHours: (totalWatchSec / 3600).toFixed(1),
      engagement: totalEngagement,
      estimatedIncomeBdt: ((totalViews / 1000) * 5).toFixed(2),
    },
  });
});

// Translation Cache & Dynamic Multi-Language Endpoint
const TRANSLATION_CACHE_FILE = path.join(DATA_DIR, 'translations_cache.json');
let translationCache: Record<string, Record<string, string>> = {};
if (fs.existsSync(TRANSLATION_CACHE_FILE)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_FILE, 'utf-8'));
    if (parsed && typeof parsed === 'object') {
      translationCache = parsed;
    }
  } catch {
    translationCache = {};
  }
}

const MYMEMORY_LANG_MAP: Record<string, string> = {
  zh: 'zh-CN',
  no: 'nb',
  fil: 'tl',
};

const inFlightTranslations = new Map<string, Promise<Record<string, string>>>();

function isValidTranslatedText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^MYMEMORY WARNING:/i.test(trimmed)) return false;
  if (/^QUERY LENGTH LIMIT/i.test(trimmed)) return false;
  if (/^INVALID LANGUAGE PAIR/i.test(trimmed)) return false;
  if (/^PLEASE SELECT TWO DISTINCT LANGUAGES/i.test(trimmed)) return false;
  return true;
}

async function translateChunkMyMemory(
  targetLang: string,
  chunk: [string, string][]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!chunk.length) return result;

  const mmLang = MYMEMORY_LANG_MAP[targetLang] || targetLang;
  const joined = chunk.map(([, val]) => val.replace(/\r?\n/g, ' ').trim()).join('\n');

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      joined
    )}&langpair=${encodeURIComponent(`en|${mmLang}`)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (resp.ok) {
      const data: any = await resp.json();
      const translatedText: string = data?.responseData?.translatedText || '';
      if (
        !data?.quotaFinished &&
        Number(data?.responseStatus) === 200 &&
        isValidTranslatedText(translatedText)
      ) {
        if (chunk.length === 1) {
          result[chunk[0][0]] = translatedText.trim();
          return result;
        }
        const lines = translatedText.split(/\r?\n/);
        if (lines.length === chunk.length) {
          chunk.forEach(([k], idx) => {
            const val = (lines[idx] || '').trim();
            if (isValidTranslatedText(val)) {
              result[k] = val;
            }
          });
          return result;
        }
      }
    }
  } catch {}

  // If line count mismatched on a multi-item chunk, recursively split into smaller chunks
  if (chunk.length > 1) {
    const mid = Math.ceil(chunk.length / 2);
    const [left, right] = await Promise.all([
      translateChunkMyMemory(targetLang, chunk.slice(0, mid)),
      translateChunkMyMemory(targetLang, chunk.slice(mid)),
    ]);
    return { ...left, ...right };
  }

  return result;
}

async function translateEntriesMyMemory(
  targetLang: string,
  entries: [string, string][]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!entries.length) return result;

  // MyMemory allows max 500 chars per query; keep chunks <= 380 raw chars
  const chunks: [string, string][][] = [];
  let current: [string, string][] = [];
  let currentLen = 0;

  for (const [k, rawVal] of entries) {
    const cleanVal = rawVal.replace(/\r?\n/g, ' ').trim();
    if (!cleanVal) continue;
    if (cleanVal.length > 380) {
      if (current.length > 0) {
        chunks.push(current);
        current = [];
        currentLen = 0;
      }
      chunks.push([[k, cleanVal.slice(0, 380)]]);
      continue;
    }
    const addedLen = cleanVal.length + (current.length > 0 ? 1 : 0);
    if (current.length > 0 && currentLen + addedLen > 380) {
      chunks.push(current);
      current = [];
      currentLen = 0;
    }
    current.push([k, cleanVal]);
    currentLen += addedLen;
  }
  if (current.length > 0) {
    chunks.push(current);
  }

  // Run chunks in parallel batches of 5 for ~1s full-dictionary translation
  const batchSize = 5;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const settled = await Promise.all(batch.map((ch) => translateChunkMyMemory(targetLang, ch)));
    for (const map of settled) {
      Object.assign(result, map);
    }
  }
  return result;
}

async function translateEntriesGoogleFallback(
  targetLang: string,
  entries: [string, string][]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (!entries.length) return result;

  const chunkSize = 30;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const joined = chunk.map(([, val]) => val.replace(/\r?\n/g, ' ').trim()).join('\n');
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
        targetLang
      )}&dt=t&q=${encodeURIComponent(joined)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const contentType = resp.headers.get('content-type') || '';
      if (resp.ok && contentType.includes('json')) {
        const data: any = await resp.json();
        const translatedJoined = Array.isArray(data?.[0])
          ? data[0].map((seg: any) => seg?.[0] || '').join('')
          : '';
        const lines = translatedJoined.split(/\r?\n/);
        if (lines.length === chunk.length) {
          chunk.forEach(([k], idx) => {
            const tVal = (lines[idx] || '').trim();
            if (tVal) result[k] = tVal;
          });
        }
      }
    } catch {}
  }
  return result;
}

app.post('/api/translate', async (req, res) => {
  const { targetLang, texts } = req.body || {};
  if (
    !targetLang ||
    typeof targetLang !== 'string' ||
    !/^[a-z]{2,3}(-[a-z0-9]{2,4})?$/i.test(targetLang.trim()) ||
    !texts ||
    typeof texts !== 'object' ||
    Array.isArray(texts)
  ) {
    return res.status(400).json({ success: false, error: 'Invalid translation request' });
  }

  const cleanLang = targetLang.trim().toLowerCase();
  const safeEntries = Object.entries(texts as Record<string, unknown>)
    .filter(
      (pair): pair is [string, string] =>
        typeof pair[0] === 'string' &&
        pair[0].length > 0 &&
        pair[0].length <= 80 &&
        typeof pair[1] === 'string' &&
        pair[1].trim().length > 0 &&
        pair[1].length <= 500
    )
    .slice(0, 500);

  if (cleanLang === 'en') {
    return res.json({ success: true, translations: Object.fromEntries(safeEntries) });
  }

  const cached = translationCache[cleanLang] || {};
  const missingEntries = safeEntries.filter(([k]) => !cached[k]);

  if (missingEntries.length > 0) {
    let task = inFlightTranslations.get(cleanLang);
    if (!task) {
      task = (async () => {
        const mmResult = await translateEntriesMyMemory(cleanLang, missingEntries);
        const stillMissing = missingEntries.filter(([k]) => !mmResult[k]);
        const gResult =
          stillMissing.length > 0
            ? await translateEntriesGoogleFallback(cleanLang, stillMissing)
            : {};
        return { ...mmResult, ...gResult };
      })().finally(() => {
        inFlightTranslations.delete(cleanLang);
      });
      inFlightTranslations.set(cleanLang, task);
    }

    const fresh = await task;
    if (Object.keys(fresh).length > 0) {
      translationCache[cleanLang] = { ...(translationCache[cleanLang] || {}), ...fresh };
      try {
        fs.writeFileSync(TRANSLATION_CACHE_FILE, JSON.stringify(translationCache));
      } catch {}
    }
  }

  const resolvedMap: Record<string, string> = {};
  const langCache = translationCache[cleanLang] || {};
  for (const [k] of safeEntries) {
    if (langCache[k]) {
      resolvedMap[k] = langCache[k];
    }
  }

  const translatedCount = Object.keys(resolvedMap).length;
  if (translatedCount === 0) {
    return res.status(502).json({
      success: false,
      error: 'Translation service temporarily unavailable',
      translations: {},
    });
  }

  return res.json({
    success: true,
    translations: resolvedMap,
  });
});

// ================= VITE MIDDLEWARE & SERVE =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TikTok Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
