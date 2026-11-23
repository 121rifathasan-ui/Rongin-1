import { PostVideo, UserProfile, DirectMessage, AppNotification, PostComment, Conversation, VideoReport } from '../types';
import { DEFAULT_USER, INITIAL_POSTS } from '../data/initialData';

export { DEFAULT_USER };

const FALLBACK_AVATAR_URL =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80';

export function sanitizeAvatarUrl(url?: string): string {
  if (!url || typeof url !== 'string') return FALLBACK_AVATAR_URL;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('blob:')) return FALLBACK_AVATAR_URL;
  return trimmed;
}

export function getResolvedPrivacy(user?: Partial<UserProfile> | null) {
  const p = user?.privacySettings || {};
  return {
    hideUsername: p.hideUsername ?? false,
    hidePhone: p.hidePhone ?? true,
    hideEmail: p.hideEmail ?? true,
    hideBirthday: p.hideBirthday ?? true,
    hideAge: p.hideAge ?? true,
    hideGender: p.hideGender ?? false,
    hideLocation: p.hideLocation ?? false,
  };
}

export function toPublicProfile(user: UserProfile): UserProfile {
  const privacy = getResolvedPrivacy(user);
  const {
    password: _p,
    contact: _c,
    email,
    phone,
    age,
    dateOfBirth,
    gender,
    location,
    ...publicFields
  } = user;

  const rawUsername =
    typeof publicFields.username === 'string' && publicFields.username.trim()
      ? publicFields.username.trim()
      : typeof email === 'string' && email.includes('@')
      ? email.split('@')[0]
      : `user_${String(publicFields.uid || 'member').slice(0, 6)}`;
  const safeUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_.]/g, '_') || 'user';
  const safeName =
    typeof publicFields.name === 'string' && publicFields.name.trim()
      ? publicFields.name.trim()
      : safeUsername;

  return {
    ...publicFields,
    name: safeName,
    username: safeUsername,
    avatarUrl: sanitizeAvatarUrl(publicFields.avatarUrl),
    privacySettings: privacy,
    ...(privacy.hideEmail ? {} : { email }),
    ...(privacy.hidePhone ? {} : { phone }),
    ...(privacy.hideAge ? {} : { age }),
    ...(privacy.hideBirthday ? {} : { dateOfBirth }),
    ...(privacy.hideGender ? {} : { gender }),
    ...(privacy.hideLocation ? {} : { location }),
  };
}

const FAKE_CREATOR_IDS = new Set([
  'creator_raisul_kuakata',
  'creator_01',
  'creator_02',
  'creator_03',
  'creator_04',
  'tiktok_official',
]);

const FAKE_POST_IDS = new Set([
  'post_raisul_01',
  'post_raisul_02',
  'post_raisul_03',
  'post_raisul_04',
  'post_raisul_05',
  'post_01',
  'post_02',
  'post_03',
  'post_04',
  'post_05',
]);

const FAKE_CONV_IDS = new Set(['conv_01', 'conv_02', 'conv_03']);
const FAKE_NOTIF_IDS = new Set(['notif_01', 'notif_02', 'notif_03', 'notif_04']);

export function isFakeAccount(acc?: Partial<UserProfile> | null): boolean {
  if (!acc || !acc.uid) return true;
  if (acc.uid === 'guest_user') return true;
  if (FAKE_CREATOR_IDS.has(acc.uid)) return true;
  // Remove untouched seeded default account only; keep any real edited/registered user account
  if (
    acc.uid === 'user_eyasin_gamer_01' &&
    acc.username === 'h.m.eyasin.gamer' &&
    (acc.contact || '') === '01700000000' &&
    (acc.name || '') === 'H M Eyasin Gamer'
  ) {
    return true;
  }
  return false;
}

export function isFakePost(post?: Partial<PostVideo> | null): boolean {
  if (!post || !post.id) return true;
  if (FAKE_POST_IDS.has(post.id)) return true;
  if (post.userId && FAKE_CREATOR_IDS.has(post.userId)) return true;
  if (typeof post.videoUrl === 'string' && post.videoUrl.includes('assets.mixkit.co')) return true;
  return false;
}

const DELETED_POST_IDS_KEY = 'rongin_deleted_post_ids';
function getDeletedPostIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_POST_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.filter((x) => typeof x === 'string'));
    }
  } catch {}
  return new Set();
}
function markPostIdDeleted(postId: string) {
  try {
    const set = getDeletedPostIds();
    set.add(postId);
    localStorage.setItem(DELETED_POST_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

const STORAGE_KEYS = {
  USER: 'tiktok_user_profile',
  ACCOUNTS: 'tiktok_registered_accounts_list',
  DEVICE_ACCOUNT_UIDS: 'rongin_device_account_uids',
  POSTS: 'tiktok_cached_posts',
  FOLLOW_GRAPH: 'rongin_follow_graph',
  POST_LIKERS: 'rongin_post_likers',
  POST_SAVERS: 'rongin_post_savers',
  CONVERSATIONS: 'tiktok_conversations',
  NOTIFICATIONS: 'tiktok_notifications',
  COMMENTS: 'tiktok_comments_cache',
  OFFLINE_QUEUE: 'tiktok_offline_sync_queue',
  THEME: 'tiktok_theme_mode',
};

export const offlineStore = {
  // ================= REAL FOLLOW GRAPH =================
  getFollowGraph(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FOLLOW_GRAPH);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return {};
  },

  saveFollowGraph(graph: Record<string, string[]>) {
    try {
      localStorage.setItem(STORAGE_KEYS.FOLLOW_GRAPH, JSON.stringify(graph));
    } catch {}
  },

  mergeRemoteFollowGraph(remoteGraph: Record<string, string[]>) {
    if (!remoteGraph || typeof remoteGraph !== 'object') return;
    const local = this.getFollowGraph();
    const merged: Record<string, string[]> = { ...local };
    for (const followerUid of Object.keys(remoteGraph)) {
      if (FAKE_CREATOR_IDS.has(followerUid)) continue;
      const remoteTargets = Array.isArray(remoteGraph[followerUid]) ? remoteGraph[followerUid] : [];
      const existingTargets = new Set(merged[followerUid] || []);
      for (const t of remoteTargets) {
        if (t && t !== followerUid && !FAKE_CREATOR_IDS.has(t)) {
          existingTargets.add(t);
        }
      }
      merged[followerUid] = Array.from(existingTargets);
    }
    this.saveFollowGraph(merged);
  },

  isFollowingUser(viewerUid: string | undefined, targetUid: string): boolean {
    if (!viewerUid || !targetUid || viewerUid === targetUid) return false;
    const graph = this.getFollowGraph();
    const list = graph[viewerUid] || [];
    return list.includes(targetUid);
  },

  areMutualFriends(uidA?: string, uidB?: string): boolean {
    if (!uidA || !uidB || uidA === 'guest_user' || uidB === 'guest_user') return false;
    if (uidA === uidB) return true;
    return this.isFollowingUser(uidA, uidB) && this.isFollowingUser(uidB, uidA);
  },

  canViewUserProfile(targetUser?: Partial<UserProfile> | null, viewerUid?: string): boolean {
    if (!targetUser) return true;
    if (!targetUser.isProfileLocked) return true;
    if (viewerUid && targetUser.uid === viewerUid) return true;
    return this.areMutualFriends(viewerUid, targetUser.uid);
  },

  getFollowersCount(targetUid: string): number {
    if (!targetUid || targetUid === 'guest_user') return 0;
    const graph = this.getFollowGraph();
    let count = 0;
    for (const followerUid of Object.keys(graph)) {
      if (followerUid === targetUid) continue;
      const targets = graph[followerUid];
      if (Array.isArray(targets) && targets.includes(targetUid)) {
        count += 1;
      }
    }
    return count;
  },

  getFollowingCount(userUid: string): number {
    if (!userUid || userUid === 'guest_user') return 0;
    const graph = this.getFollowGraph();
    const targets = graph[userUid];
    if (!Array.isArray(targets)) return 0;
    return targets.filter((id) => id && id !== userUid && !FAKE_CREATOR_IDS.has(id)).length;
  },

  toggleFollowUser(
    followerUid: string,
    targetUid: string
  ): {
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
    posts: PostVideo[];
    notification: AppNotification | null;
  } {
    if (!followerUid || !targetUid || followerUid === targetUid || followerUid === 'guest_user') {
      return {
        isFollowing: false,
        followersCount: this.getFollowersCount(targetUid),
        followingCount: this.getFollowingCount(followerUid),
        posts: this.getPosts(followerUid),
        notification: null,
      };
    }

    const graph = this.getFollowGraph();
    const currentList = Array.isArray(graph[followerUid]) ? [...graph[followerUid]] : [];
    const exists = currentList.includes(targetUid);
    const nextFollowing = !exists;

    if (nextFollowing) {
      graph[followerUid] = Array.from(new Set([...currentList, targetUid]));
    } else {
      graph[followerUid] = currentList.filter((id) => id !== targetUid);
    }

    this.saveFollowGraph(graph);

    let createdNotif: AppNotification | null = null;
    if (nextFollowing) {
      const followerUser = this.findRegisteredUser(followerUid, undefined, undefined, followerUid);
      if (followerUser) {
        createdNotif = this.addNotification(targetUid, {
          id: `notif_follow_${followerUid}__${targetUid}`,
          recipientUid: targetUid,
          type: 'follow',
          actor: {
            uid: followerUser.uid,
            name: followerUser.name,
            username: followerUser.username,
            avatarUrl: sanitizeAvatarUrl(followerUser.avatarUrl),
          },
          content: 'started following you.',
          timestamp: Date.now(),
          isRead: false,
        });
      }
    }

    return {
      isFollowing: nextFollowing,
      followersCount: this.getFollowersCount(targetUid),
      followingCount: this.getFollowingCount(followerUid),
      posts: this.getPosts(followerUid),
      notification: createdNotif,
    };
  },

  // ================= REAL LIKES & SAVES MAP =================
  getPostLikersMap(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.POST_LIKERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return {};
  },

  savePostLikersMap(map: Record<string, string[]>) {
    try {
      localStorage.setItem(STORAGE_KEYS.POST_LIKERS, JSON.stringify(map));
    } catch {}
  },

  mergeRemotePostLikes(remoteMap: Record<string, string[]>) {
    if (!remoteMap || typeof remoteMap !== 'object') return;
    const local = this.getPostLikersMap();
    const merged: Record<string, string[]> = { ...local };
    for (const postId of Object.keys(remoteMap)) {
      if (FAKE_POST_IDS.has(postId)) continue;
      const remoteUids = Array.isArray(remoteMap[postId]) ? remoteMap[postId] : [];
      const set = new Set(merged[postId] || []);
      for (const uid of remoteUids) {
        if (uid && uid !== 'guest_user') set.add(uid);
      }
      merged[postId] = Array.from(set);
    }
    this.savePostLikersMap(merged);
  },

  getPostSaversMap(): Record<string, string[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.POST_SAVERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return {};
  },

  savePostSaversMap(map: Record<string, string[]>) {
    try {
      localStorage.setItem(STORAGE_KEYS.POST_SAVERS, JSON.stringify(map));
    } catch {}
  },

  getRawPosts(): PostVideo[] {
    try {
      const deletedIds = getDeletedPostIds();
      const stored = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (stored) {
        const parsed: PostVideo[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validPosts = parsed.filter(
            (p) => !isFakePost(p) && !deletedIds.has(p.id) && Boolean(p.videoUrl)
          );
          if (validPosts.length > 0) {
            if (validPosts.length !== parsed.length) {
              this.savePosts(validPosts);
            }
            return validPosts;
          }
        }
      }
      const seeded = INITIAL_POSTS.filter((p) => !deletedIds.has(p.id));
      if (seeded.length > 0) {
        this.savePosts(seeded);
      }
      return seeded;
    } catch {
      return INITIAL_POSTS;
    }
  },

  getTotalLikesForUser(userUid: string, username?: string): number {
    if (!userUid || userUid === 'guest_user') return 0;
    const posts = this.getPosts();
    return posts
      .filter((p) => p.userId === userUid || (username && (p.username || '').toLowerCase() === username.toLowerCase()))
      .reduce((sum, p) => sum + Math.max(0, p.likes || 0), 0);
  },

  hydrateUserStats(user: UserProfile, viewerUid?: string): UserProfile {
    if (!user || user.uid === 'guest_user') {
      return { ...DEFAULT_USER };
    }
    const safeUsername =
      typeof user.username === 'string' && user.username.trim()
        ? user.username.trim()
        : `user_${String(user.uid).slice(0, 6)}`;
    const safeName =
      typeof user.name === 'string' && user.name.trim()
        ? user.name.trim()
        : safeUsername;
    return {
      ...user,
      name: safeName,
      username: safeUsername,
      avatarUrl: sanitizeAvatarUrl(user.avatarUrl),
      following: this.getFollowingCount(user.uid),
      followers: this.getFollowersCount(user.uid),
      likes: this.getTotalLikesForUser(user.uid, safeUsername),
      isFollowing: viewerUid ? this.isFollowingUser(viewerUid, user.uid) : false,
    };
  },

  // ================= ACCOUNTS & AUTHENTICATION =================
  getRegisteredAccounts(viewerUid?: string): UserProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const realAccounts = parsed.filter((acc: UserProfile) => !isFakeAccount(acc));
          if (realAccounts.length !== parsed.length) {
            this.saveRegisteredAccounts(realAccounts);
          }
          return realAccounts.map((acc: UserProfile) => this.hydrateUserStats(acc, viewerUid));
        }
      }
    } catch {}
    return [];
  },

  saveRegisteredAccounts(accounts: UserProfile[]) {
    try {
      const realOnly = accounts.filter((acc) => !isFakeAccount(acc));
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(realOnly));
    } catch {}
  },

  getDeviceAccountUids(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DEVICE_ACCOUNT_UIDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string' && id !== 'guest_user');
      }
    } catch {}
    return [];
  },

  addDeviceAccountUid(uid: string) {
    if (!uid || uid === 'guest_user') return;
    try {
      const existing = this.getDeviceAccountUids();
      const updated = [uid, ...existing.filter((id) => id !== uid)].slice(0, 15);
      localStorage.setItem(STORAGE_KEYS.DEVICE_ACCOUNT_UIDS, JSON.stringify(updated));
    } catch {}
  },

  removeDeviceAccountUid(uid: string) {
    try {
      const existing = this.getDeviceAccountUids();
      const updated = existing.filter((id) => id !== uid);
      localStorage.setItem(STORAGE_KEYS.DEVICE_ACCOUNT_UIDS, JSON.stringify(updated));
    } catch {}
  },

  getDeviceSavedAccounts(): UserProfile[] {
    const accounts = this.getRegisteredAccounts();
    const deviceUids = new Set(this.getDeviceAccountUids());
    // Backward compatibility: include accounts on this device that have a local session/password credential
    return accounts
      .filter((acc) => !isFakeAccount(acc) && (deviceUids.has(acc.uid) || Boolean(acc.password || acc.contact)))
      .map((acc) => {
        const { password: _p, passwordHash: _ph, ...safe } = acc as any;
        return this.hydrateUserStats(safe, acc.uid);
      });
  },

  switchToDeviceAccount(uid: string): UserProfile | null {
    const accounts = this.getRegisteredAccounts(uid);
    const target = accounts.find((acc) => acc.uid === uid && !isFakeAccount(acc));
    if (!target) return null;
    const hydrated = this.hydrateUserStats(target, target.uid);
    this.saveUserProfile(hydrated);
    return hydrated;
  },

  changePassword(
    uid: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' };
    }
    const accounts = this.getRegisteredAccounts();
    const target = accounts.find((acc) => acc.uid === uid);
    if (!target) {
      return { success: false, error: 'অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' };
    }
    if (target.password && target.password !== currentPassword) {
      return { success: false, error: 'আগের পাসওয়ার্ডটি সঠিক নয়।' };
    }
    const updatedAccounts = accounts.map((acc) =>
      acc.uid === uid ? { ...acc, password: newPassword } : acc
    );
    this.saveRegisteredAccounts(updatedAccounts);
    return { success: true };
  },

  findRegisteredUser(uid?: string, username?: string, contact?: string, viewerUid?: string): UserProfile | null {
    const accounts = this.getRegisteredAccounts(viewerUid);
    const cleanUid = (uid || '').trim();
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanContact = (contact || '').trim().toLowerCase();

    const found = accounts.find((acc) => {
      if (cleanUid && acc.uid === cleanUid) return true;
      if (cleanUsername && (acc.username || '').toLowerCase() === cleanUsername) return true;
      if (cleanContact) {
        const c = (acc.contact || acc.email || acc.phone || '').trim().toLowerCase();
        if (c === cleanContact) return true;
      }
      return false;
    });

    const result = found ? this.hydrateUserStats(found, viewerUid) : null;
    if (!result) return null;
    // Never expose contact, email, phone, age, or password when another user looks up this profile
    if (viewerUid && viewerUid !== result.uid) {
      return toPublicProfile(result);
    }
    if (!viewerUid) {
      return toPublicProfile(result);
    }
    return result;
  },

  mergeRemoteUsers(remoteUsers: UserProfile[]) {
    if (!Array.isArray(remoteUsers) || remoteUsers.length === 0) return;
    const local = this.getRegisteredAccounts();
    const byUid = new Map<string, UserProfile>();
    local.forEach((u) => byUid.set(u.uid, u));

    let changed = false;
    for (const remote of remoteUsers) {
      if (!remote || isFakeAccount(remote)) continue;
      const safeRemote = toPublicProfile(remote);
      const existing = byUid.get(safeRemote.uid);
      if (!existing) {
        byUid.set(safeRemote.uid, safeRemote);
        changed = true;
      } else {
        const selfUid = this.getUserProfile()?.uid;
        if (selfUid !== safeRemote.uid) {
          const nextLocked = safeRemote.isProfileLocked ?? existing.isProfileLocked;
          if (nextLocked !== existing.isProfileLocked) {
            changed = true;
          }
          const merged: UserProfile = {
            ...existing,
            ...safeRemote,
            avatarUrl: sanitizeAvatarUrl(safeRemote.avatarUrl || existing.avatarUrl),
            password: existing.password,
            contact: existing.contact,
          };
          byUid.set(safeRemote.uid, merged);
        } else {
          const merged: UserProfile = {
            ...safeRemote,
            ...existing,
            avatarUrl: sanitizeAvatarUrl(existing.avatarUrl || safeRemote.avatarUrl),
          };
          byUid.set(safeRemote.uid, merged);
        }
      }
    }

    if (changed) {
      this.saveRegisteredAccounts(Array.from(byUid.values()));
    }
  },

  registerAccount(data: {
    name: string;
    contact: string;
    age: number;
    password: string;
  }): { success: boolean; user?: UserProfile; error?: string } {
    const cleanContact = data.contact.trim().toLowerCase();
    const cleanName = data.name.trim();

    if (!cleanName) {
      return { success: false, error: 'অনুগ্রহ করে আপনার নাম প্রদান করুন।' };
    }
    if (!cleanContact) {
      return { success: false, error: 'মোবাইল নাম্বার অথবা ইমেইল প্রদান করুন।' };
    }
    if (!data.age || data.age < 12) {
      return { success: false, error: 'অ্যাকাউন্ট খোলার জন্য ন্যূনতম বয়স ১২ বছর হতে হবে।' };
    }
    if (!data.password || data.password.length < 4) {
      return { success: false, error: 'পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।' };
    }

    const accounts = this.getRegisteredAccounts();
    const existing = accounts.find((acc) => {
      const c = (acc.contact || acc.email || acc.phone || '').trim().toLowerCase();
      return c === cleanContact;
    });

    if (existing) {
      return {
        success: false,
        error: 'এই মোবাইল নাম্বার অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে। প্রতি মোবাইল বা ইমেইল দিয়ে কেবল একটি আইডি খোলা সম্ভব। অনুগ্রহ করে লগইন করুন।',
      };
    }

    const baseSlug =
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15) || 'user';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${baseSlug}_${randomSuffix}`;
    const isEmail = cleanContact.includes('@');

    const newUser: UserProfile = {
      uid: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      username,
      contact: cleanContact,
      email: isEmail ? cleanContact : undefined,
      phone: !isEmail ? cleanContact : undefined,
      age: data.age,
      password: data.password,
      avatarUrl: FALLBACK_AVATAR_URL,
      bio: '',
      isVerified: false,
      following: 0,
      followers: 0,
      likes: 0,
      category: 'Creator',
    };

    const updatedAccounts = [newUser, ...accounts];
    this.saveRegisteredAccounts(updatedAccounts);
    this.saveUserProfile(newUser);

    return { success: true, user: newUser };
  },

  loginAccount(
    contactOrEmail: string,
    password: string
  ): { success: boolean; user?: UserProfile; error?: string } {
    const cleanIdent = contactOrEmail.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();

    const matched = accounts.find((acc) => {
      const c = (acc.contact || acc.email || acc.phone || '').trim().toLowerCase();
      const u = (acc.username || '').toLowerCase();
      return c === cleanIdent || u === cleanIdent;
    });

    if (!matched) {
      return {
        success: false,
        error: 'এই মোবাইল নম্বর বা ইমেইল দিয়ে কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি। দয়া করে সঠিক তথ্য দিন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।',
      };
    }

    if (matched.password && matched.password !== password) {
      return { success: false, error: 'ভুল পাসওয়ার্ড দেওয়া হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
    }

    const hydrated = this.hydrateUserStats(matched, matched.uid);
    this.saveUserProfile(hydrated);
    return { success: true, user: hydrated };
  },

  logoutUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {}
  },

  // Current Logged-in User Profile
  getUserProfile(): UserProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      if (!stored) return null;
      const parsed: UserProfile = JSON.parse(stored);
      if (isFakeAccount(parsed)) {
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }
      const cleanAvatar = sanitizeAvatarUrl(parsed.avatarUrl);
      const baseUser = cleanAvatar !== parsed.avatarUrl ? { ...parsed, avatarUrl: cleanAvatar } : parsed;
      return this.hydrateUserStats(baseUser, baseUser.uid);
    } catch {
      return null;
    }
  },

  saveUserProfile(user: UserProfile) {
    if (!user || isFakeAccount(user)) return;
    try {
      this.addDeviceAccountUid(user.uid);
      const { password: _omitPass, ...sessionSafe } = user;
      const cleanSessionUser: UserProfile = {
        ...sessionSafe,
        avatarUrl: sanitizeAvatarUrl(user.avatarUrl),
      };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(cleanSessionUser));

      // Also update or insert in registered accounts list (preserving stored password if not supplied)
      const accounts = this.getRegisteredAccounts();
      const exists = accounts.some((acc) => acc.uid === cleanSessionUser.uid);
      const updatedAccounts = exists
        ? accounts.map((acc) =>
            acc.uid === cleanSessionUser.uid
              ? { ...acc, ...cleanSessionUser, password: user.password || acc.password }
              : acc
          )
        : [user, ...accounts];
      this.saveRegisteredAccounts(updatedAccounts);

      // Keep user's posts in sync with updated profile avatar, display name & username
      const rawPosts = this.getRawPosts();
      let postsChanged = false;
      const updatedPosts = rawPosts.map((post) => {
        if (post.userId === cleanSessionUser.uid) {
          if (
            post.avatarUrl !== cleanSessionUser.avatarUrl ||
            post.userDisplayName !== cleanSessionUser.name ||
            post.username !== cleanSessionUser.username
          ) {
            postsChanged = true;
            return {
              ...post,
              avatarUrl: cleanSessionUser.avatarUrl,
              userDisplayName: cleanSessionUser.name,
              username: cleanSessionUser.username,
            };
          }
        }
        return post;
      });
      if (postsChanged) {
        this.savePosts(updatedPosts);
      }
    } catch (e) {
      console.error('Failed to cache user', e);
    }
  },

  // ================= POSTS =================
  getPosts(viewerUid?: string): PostVideo[] {
    const rawPosts = this.getRawPosts();
    const likersMap = this.getPostLikersMap();
    const saversMap = this.getPostSaversMap();
    const graph = this.getFollowGraph();
    const viewerFollows = viewerUid ? graph[viewerUid] || [] : [];

    return rawPosts.map((p) => {
      const likers = Array.isArray(likersMap[p.id]) ? likersMap[p.id] : [];
      const savers = Array.isArray(saversMap[p.id]) ? saversMap[p.id] : [];
      const isOwner = Boolean(viewerUid && p.userId === viewerUid);

      return {
        ...p,
        avatarUrl: sanitizeAvatarUrl(p.avatarUrl),
        likes: likers.length,
        isLiked: viewerUid ? likers.includes(viewerUid) : false,
        saves: savers.length,
        isSaved: viewerUid ? savers.includes(viewerUid) : false,
        isFollowing: viewerUid && !isOwner ? viewerFollows.includes(p.userId) : false,
      };
    });
  },

  savePosts(posts: PostVideo[]) {
    try {
      const realOnly = posts.filter((p) => !isFakePost(p));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(realOnly));
    } catch (e) {
      console.error('Failed to cache posts', e);
    }
  },

  mergeRemotePosts(remotePosts: PostVideo[], viewerUid?: string): PostVideo[] {
    if (!Array.isArray(remotePosts) || remotePosts.length === 0) {
      return this.getPosts(viewerUid);
    }
    const deletedIds = getDeletedPostIds();
    const local = this.getRawPosts();
    const byId = new Map<string, PostVideo>();
    local.forEach((p) => byId.set(p.id, p));

    let changed = false;
    for (const remote of remotePosts) {
      if (!remote || isFakePost(remote) || deletedIds.has(remote.id) || !remote.videoUrl) continue;
      if (remote.videoUrl.startsWith('blob:')) continue;
      if (!byId.has(remote.id)) {
        byId.set(remote.id, {
          ...remote,
          avatarUrl: sanitizeAvatarUrl(remote.avatarUrl),
        });
        changed = true;
      }
    }

    if (changed) {
      const merged = Array.from(byId.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.savePosts(merged);
    }
    return this.getPosts(viewerUid);
  },

  addPost(newPost: PostVideo, viewerUid?: string): PostVideo[] {
    const raw = this.getRawPosts();
    const updated = [{ ...newPost, likes: 0, saves: 0, isLiked: false, isSaved: false }, ...raw];
    this.savePosts(updated);
    this.queueAction({ type: 'upload_post', payload: newPost });
    return this.getPosts(viewerUid || newPost.userId);
  },

  toggleLike(
    postId: string,
    userUid?: string
  ): { posts: PostVideo[]; isLiked: boolean; likesCount: number; notification: AppNotification | null } {
    const uid = userUid || this.getUserProfile()?.uid;
    if (!uid || uid === 'guest_user') {
      return { posts: this.getPosts(), isLiked: false, likesCount: 0, notification: null };
    }

    const likersMap = this.getPostLikersMap();
    const currentLikers = Array.isArray(likersMap[postId]) ? [...likersMap[postId]] : [];
    const alreadyLiked = currentLikers.includes(uid);
    const nextLiked = !alreadyLiked;

    if (nextLiked) {
      likersMap[postId] = Array.from(new Set([...currentLikers, uid]));
    } else {
      likersMap[postId] = currentLikers.filter((id) => id !== uid);
    }
    this.savePostLikersMap(likersMap);

    const likesCount = likersMap[postId].length;
    const rawPosts = this.getRawPosts().map((post) =>
      post.id === postId ? { ...post, likes: likesCount } : post
    );
    this.savePosts(rawPosts);

    let createdNotif: AppNotification | null = null;
    if (nextLiked) {
      const targetPost = rawPosts.find((p) => p.id === postId);
      const actor = this.findRegisteredUser(uid, undefined, undefined, uid);
      if (targetPost && actor && targetPost.userId && targetPost.userId !== uid) {
        createdNotif = this.addNotification(targetPost.userId, {
          id: `notif_like_${uid}__${postId}`,
          recipientUid: targetPost.userId,
          type: 'like',
          actor: {
            uid: actor.uid,
            name: actor.name,
            username: actor.username,
            avatarUrl: sanitizeAvatarUrl(actor.avatarUrl),
          },
          post: {
            id: targetPost.id,
            caption: targetPost.caption,
            thumbnailUrl: targetPost.thumbnailUrl,
          },
          content: 'liked your video.',
          timestamp: Date.now(),
          isRead: false,
        });
      }
    }

    this.queueAction({ type: 'toggle_like', payload: { postId, isLiked: nextLiked, userUid: uid } });
    return { posts: this.getPosts(uid), isLiked: nextLiked, likesCount, notification: createdNotif };
  },

  toggleSave(postId: string, userUid?: string): { posts: PostVideo[]; isSaved: boolean } {
    const uid = userUid || this.getUserProfile()?.uid;
    if (!uid || uid === 'guest_user') {
      return { posts: this.getPosts(), isSaved: false };
    }

    const saversMap = this.getPostSaversMap();
    const currentSavers = Array.isArray(saversMap[postId]) ? [...saversMap[postId]] : [];
    const alreadySaved = currentSavers.includes(uid);
    const nextSaved = !alreadySaved;

    if (nextSaved) {
      saversMap[postId] = Array.from(new Set([...currentSavers, uid]));
    } else {
      saversMap[postId] = currentSavers.filter((id) => id !== uid);
    }
    this.savePostSaversMap(saversMap);

    const rawPosts = this.getRawPosts().map((post) =>
      post.id === postId ? { ...post, saves: saversMap[postId].length } : post
    );
    this.savePosts(rawPosts);
    this.queueAction({ type: 'toggle_save', payload: { postId, isSaved: nextSaved } });
    return { posts: this.getPosts(uid), isSaved: nextSaved };
  },

  toggleFollow(creatorId: string, followerUid?: string): { posts: PostVideo[]; isFollowing: boolean } {
    const uid = followerUid || this.getUserProfile()?.uid;
    if (!uid || uid === 'guest_user' || uid === creatorId) {
      return { posts: this.getPosts(uid), isFollowing: false };
    }
    const res = this.toggleFollowUser(uid, creatorId);
    return { posts: res.posts, isFollowing: res.isFollowing };
  },

  recordView(postId: string, watchTimeSec: number = 0, incrementView: boolean = false, viewerUid?: string): PostVideo[] {
    const rawPosts = this.getRawPosts();
    const updated = rawPosts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          views: incrementView ? (post.views || 0) + 1 : (post.views || 0),
          watchTime: (post.watchTime || 0) + watchTimeSec,
        };
      }
      return post;
    });
    this.savePosts(updated);
    return this.getPosts(viewerUid);
  },

  // ================= COMMENTS =================
  getComments(postId: string): PostComment[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.COMMENTS}_${postId}`);
      if (stored) {
        const parsed: PostComment[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((c) => !FAKE_CREATOR_IDS.has(c.userId));
          if (clean.length !== parsed.length) {
            this.saveComments(postId, clean);
          }
          return clean;
        }
      }
    } catch {}
    return [];
  },

  saveComments(postId: string, comments: PostComment[]) {
    try {
      localStorage.setItem(`${STORAGE_KEYS.COMMENTS}_${postId}`, JSON.stringify(comments));
    } catch {}
  },

  addComment(
    postId: string,
    text: string,
    user: UserProfile
  ): { comments: PostComment[]; notification: AppNotification | null } {
    const comments = this.getComments(postId);
    const newComment: PostComment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      postId,
      userId: user.uid,
      username: user.username,
      userAvatar: sanitizeAvatarUrl(user.avatarUrl),
      text,
      likes: 0,
      isLiked: false,
      timestamp: Date.now(),
    };
    const updated = [newComment, ...comments];
    this.saveComments(postId, updated);

    const rawPosts = this.getRawPosts();
    const updatedPosts = rawPosts.map((p) =>
      p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
    );
    this.savePosts(updatedPosts);

    let createdNotif: AppNotification | null = null;
    const targetPost = rawPosts.find((p) => p.id === postId);
    if (targetPost && targetPost.userId && targetPost.userId !== user.uid) {
      createdNotif = this.addNotification(targetPost.userId, {
        id: `notif_cmt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        recipientUid: targetPost.userId,
        type: 'comment',
        actor: {
          uid: user.uid,
          name: user.name,
          username: user.username,
          avatarUrl: sanitizeAvatarUrl(user.avatarUrl),
        },
        post: {
          id: targetPost.id,
          caption: targetPost.caption,
          thumbnailUrl: targetPost.thumbnailUrl,
        },
        content: `commented: "${text.slice(0, 60)}"`,
        timestamp: Date.now(),
        isRead: false,
      });
    }

    return { comments: updated, notification: createdNotif };
  },

  // ================= DIRECT MESSAGES & CONVERSATIONS (1-on-1 Per-Pair & Per-User) =================
  getDmThreadId(uid1: string, uid2: string): string {
    const clean1 = String(uid1 || '').replace(/[.#$[\]/]/g, '_');
    const clean2 = String(uid2 || '').replace(/[.#$[\]/]/g, '_');
    const pair = [clean1, clean2].sort();
    return `dm_${pair[0]}__${pair[1]}`;
  },

  getConversations(userUid?: string): Conversation[] {
    if (!userUid || userUid === 'guest_user') return [];
    try {
      const inboxKey = `rongin_inbox_${userUid}`;
      const stored = localStorage.getItem(inboxKey);
      if (!stored) return [];
      const parsed: Conversation[] = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      const realConvs = parsed
        .filter(
          (c) =>
            c &&
            c.participant?.uid &&
            c.participant.uid !== userUid &&
            !FAKE_CONV_IDS.has(c.id) &&
            !FAKE_CREATOR_IDS.has(c.participant.uid)
        )
        .map((c) => ({
          ...c,
          id: this.getDmThreadId(userUid, c.participant.uid),
          participant: {
            ...c.participant,
            avatarUrl: sanitizeAvatarUrl(c.participant.avatarUrl),
          },
        }))
        .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));

      return realConvs;
    } catch {
      return [];
    }
  },

  saveConversations(convs: Conversation[], userUid?: string) {
    if (!userUid || userUid === 'guest_user') return;
    try {
      const inboxKey = `rongin_inbox_${userUid}`;
      const realOnly = convs.filter(
        (c) =>
          c &&
          c.participant?.uid &&
          c.participant.uid !== userUid &&
          !FAKE_CONV_IDS.has(c.id) &&
          !FAKE_CREATOR_IDS.has(c.participant.uid)
      );
      localStorage.setItem(inboxKey, JSON.stringify(realOnly));
    } catch {}
  },

  mergeRemoteInbox(userUid: string, remoteConvs: Conversation[]): Conversation[] {
    if (!userUid || userUid === 'guest_user' || !Array.isArray(remoteConvs)) {
      return this.getConversations(userUid);
    }
    const local = this.getConversations(userUid);
    const byPartnerUid = new Map<string, Conversation>();
    local.forEach((c) => byPartnerUid.set(c.participant.uid, c));

    for (const remote of remoteConvs) {
      if (
        !remote ||
        !remote.participant?.uid ||
        remote.participant.uid === userUid ||
        FAKE_CREATOR_IDS.has(remote.participant.uid)
      ) {
        continue;
      }
      const existing = byPartnerUid.get(remote.participant.uid);
      const threadId = this.getDmThreadId(userUid, remote.participant.uid);
      if (!existing || (remote.lastMessage?.timestamp || 0) >= (existing.lastMessage?.timestamp || 0)) {
        byPartnerUid.set(remote.participant.uid, {
          ...remote,
          id: threadId,
          participant: {
            ...remote.participant,
            avatarUrl: sanitizeAvatarUrl(remote.participant.avatarUrl),
          },
        });
      }
    }

    const merged = Array.from(byPartnerUid.values()).sort(
      (a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0)
    );
    this.saveConversations(merged, userUid);
    return merged;
  },

  getOrCreateConversation(
    currentUser: UserProfile,
    participant: {
      uid: string;
      name: string;
      username: string;
      avatarUrl: string;
      isOnline?: boolean;
      isVerified?: boolean;
    }
  ): Conversation {
    const threadId = this.getDmThreadId(currentUser.uid, participant.uid);
    const convs = this.getConversations(currentUser.uid);
    const existing = convs.find(
      (c) => c.participant.uid === participant.uid || c.id === threadId
    );
    if (existing) {
      return {
        ...existing,
        id: threadId,
        participant: {
          ...existing.participant,
          name: participant.name || existing.participant.name,
          username: participant.username || existing.participant.username,
          avatarUrl: sanitizeAvatarUrl(participant.avatarUrl || existing.participant.avatarUrl),
          isVerified: participant.isVerified ?? existing.participant.isVerified,
        },
      };
    }

    const newConv: Conversation = {
      id: threadId,
      participant: {
        uid: participant.uid,
        name: participant.name,
        username: participant.username,
        avatarUrl: sanitizeAvatarUrl(participant.avatarUrl),
        isOnline: participant.isOnline ?? true,
        isVerified: participant.isVerified ?? false,
      },
      lastMessage: {
        id: `msg_init_${threadId}`,
        senderId: participant.uid,
        senderName: participant.name,
        senderAvatar: sanitizeAvatarUrl(participant.avatarUrl),
        recipientId: currentUser.uid,
        text: 'কথোপকথন শুরু করুন',
        timestamp: Date.now(),
        isRead: true,
        status: 'seen',
      },
      unreadCount: 0,
    };

    const updated = [newConv, ...convs];
    this.saveConversations(updated, currentUser.uid);
    return newConv;
  },

  sendMessage(
    conversationId: string,
    text: string,
    sender: UserProfile,
    recipientInfo?: {
      uid: string;
      name: string;
      username: string;
      avatarUrl: string;
      isOnline?: boolean;
      isVerified?: boolean;
    },
    mediaUrl?: string,
    sharedPost?: DirectMessage['sharedPost']
  ): { updatedConvs: Conversation[]; newMsg: DirectMessage; threadId: string } {
    const partnerUid = recipientInfo?.uid || conversationId;
    const threadId = this.getDmThreadId(sender.uid, partnerUid);

    const newMsg: DirectMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      senderId: sender.uid,
      senderName: sender.name,
      senderAvatar: sanitizeAvatarUrl(sender.avatarUrl),
      recipientId: partnerUid,
      text,
      mediaUrl,
      sharedPost,
      timestamp: Date.now(),
      isRead: false,
      status: 'sent',
    };

    // 1. Append to strict pairwise 1-on-1 DM thread history
    const historyKey = `rongin_dm_history_${threadId}`;
    const existingHistory: DirectMessage[] = (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(historyKey) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const nextHistory = [...existingHistory, newMsg];
    try {
      localStorage.setItem(historyKey, JSON.stringify(nextHistory));
    } catch {}

    // 2. Update Sender's private inbox
    const senderConvs = this.getConversations(sender.uid);
    let foundInSender = false;
    let updatedSenderConvs = senderConvs.map((c) => {
      if (c.participant.uid === partnerUid || c.id === threadId) {
        foundInSender = true;
        return {
          ...c,
          id: threadId,
          participant: recipientInfo
            ? {
                uid: recipientInfo.uid,
                name: recipientInfo.name,
                username: recipientInfo.username,
                avatarUrl: sanitizeAvatarUrl(recipientInfo.avatarUrl),
                isOnline: recipientInfo.isOnline ?? c.participant.isOnline ?? true,
                isVerified: recipientInfo.isVerified ?? c.participant.isVerified,
              }
            : c.participant,
          lastMessage: newMsg,
          unreadCount: 0,
        };
      }
      return c;
    });

    if (!foundInSender && recipientInfo) {
      updatedSenderConvs = [
        {
          id: threadId,
          participant: {
            uid: recipientInfo.uid,
            name: recipientInfo.name,
            username: recipientInfo.username,
            avatarUrl: sanitizeAvatarUrl(recipientInfo.avatarUrl),
            isOnline: recipientInfo.isOnline ?? true,
            isVerified: recipientInfo.isVerified ?? false,
          },
          lastMessage: newMsg,
          unreadCount: 0,
        },
        ...senderConvs,
      ];
    }
    updatedSenderConvs.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
    this.saveConversations(updatedSenderConvs, sender.uid);

    // 3. Update Recipient's private inbox (so if recipient logs in on same or synced device, they see ONLY messages from sender)
    if (partnerUid && partnerUid !== sender.uid) {
      const recipientConvs = this.getConversations(partnerUid);
      let foundInRecipient = false;
      let updatedRecipientConvs = recipientConvs.map((c) => {
        if (c.participant.uid === sender.uid || c.id === threadId) {
          foundInRecipient = true;
          return {
            ...c,
            id: threadId,
            participant: {
              uid: sender.uid,
              name: sender.name,
              username: sender.username,
              avatarUrl: sanitizeAvatarUrl(sender.avatarUrl),
              isOnline: true,
              isVerified: sender.isVerified ?? false,
            },
            lastMessage: newMsg,
            unreadCount: (c.unreadCount || 0) + 1,
          };
        }
        return c;
      });

      if (!foundInRecipient) {
        updatedRecipientConvs = [
          {
            id: threadId,
            participant: {
              uid: sender.uid,
              name: sender.name,
              username: sender.username,
              avatarUrl: sanitizeAvatarUrl(sender.avatarUrl),
              isOnline: true,
              isVerified: sender.isVerified ?? false,
            },
            lastMessage: newMsg,
            unreadCount: 1,
          },
          ...recipientConvs,
        ];
      }
      updatedRecipientConvs.sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
      this.saveConversations(updatedRecipientConvs, partnerUid);
    }

    return { updatedConvs: updatedSenderConvs, newMsg, threadId };
  },

  markMessagesAsSeen(viewerUid: string, partnerUid: string): DirectMessage[] {
    if (!viewerUid || !partnerUid || viewerUid === partnerUid) return [];
    const threadId = this.getDmThreadId(viewerUid, partnerUid);
    const historyKey = `rongin_dm_history_${threadId}`;
    const stored = localStorage.getItem(historyKey);
    const history: DirectMessage[] = stored ? JSON.parse(stored) : [];

    // Only mark messages sent BY partner TO viewer as seen
    let historyChanged = false;
    const updated = history
      .filter(
        (m) =>
          (m.senderId === viewerUid && m.recipientId === partnerUid) ||
          (m.senderId === partnerUid && m.recipientId === viewerUid)
      )
      .map((m) => {
        if (m.senderId === partnerUid && m.recipientId === viewerUid && (!m.isRead || m.status !== 'seen')) {
          historyChanged = true;
          return {
            ...m,
            isRead: true,
            status: 'seen' as const,
          };
        }
        return m;
      });

    if (historyChanged) {
      try {
        localStorage.setItem(historyKey, JSON.stringify(updated));
      } catch {}
    }

    // Clear unread badge in viewer's inbox
    const convs = this.getConversations(viewerUid);
    const updatedConvs = convs.map((c) => {
      if (c.participant.uid === partnerUid || c.id === threadId) {
        const lastMsg =
          c.lastMessage && c.lastMessage.senderId === partnerUid
            ? { ...c.lastMessage, isRead: true, status: 'seen' as const }
            : c.lastMessage;
        return {
          ...c,
          unreadCount: 0,
          lastMessage: lastMsg,
        };
      }
      return c;
    });
    this.saveConversations(updatedConvs, viewerUid);

    return updated;
  },

  mergeRemoteDmMessages(userUid: string, partnerUid: string, remoteMsgs: DirectMessage[]): DirectMessage[] {
    if (!userUid || !partnerUid || userUid === partnerUid) return [];
    const threadId = this.getDmThreadId(userUid, partnerUid);
    const historyKey = `rongin_dm_history_${threadId}`;
    const local = this.getChatHistory(userUid, partnerUid);
    const byId = new Map<string, DirectMessage>();
    local.forEach((m) => byId.set(m.id, m));

    for (const rm of remoteMsgs) {
      if (!rm || !rm.id) continue;
      // Strict 1-on-1 isolation check
      const belongsToPair =
        (rm.senderId === userUid && rm.recipientId === partnerUid) ||
        (rm.senderId === partnerUid && rm.recipientId === userUid);
      if (!belongsToPair) continue;

      const existing = byId.get(rm.id);
      if (!existing) {
        byId.set(rm.id, rm);
      } else if ((rm.isRead || rm.status === 'seen') && (!existing.isRead || existing.status !== 'seen')) {
        byId.set(rm.id, { ...existing, isRead: true, status: 'seen' });
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    try {
      localStorage.setItem(historyKey, JSON.stringify(merged));
    } catch {}
    return merged;
  },

  getChatHistory(userUid: string, partnerUid: string): DirectMessage[] {
    if (!userUid || !partnerUid || userUid === partnerUid) return [];
    const threadId = this.getDmThreadId(userUid, partnerUid);
    const historyKey = `rongin_dm_history_${threadId}`;
    try {
      const stored = localStorage.getItem(historyKey);
      if (!stored) return [];
      const parsed: DirectMessage[] = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(
          (m) =>
            m &&
            ((m.senderId === userUid && m.recipientId === partnerUid) ||
              (m.senderId === partnerUid && m.recipientId === userUid))
        )
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } catch {
      return [];
    }
  },

  updatePost(postId: string, updates: Partial<PostVideo>, viewerUid?: string): PostVideo[] {
    const posts = this.getRawPosts().map((p) => (p.id === postId ? { ...p, ...updates } : p));
    this.savePosts(posts);
    return this.getPosts(viewerUid);
  },

  incrementShareCount(postId: string, viewerUid?: string): PostVideo[] {
    const posts = this.getRawPosts().map((p) =>
      p.id === postId ? { ...p, shares: (p.shares || 0) + 1 } : p
    );
    this.savePosts(posts);
    return this.getPosts(viewerUid);
  },

  saveReportLocally(report: VideoReport) {
    try {
      const key = 'rongin_video_reports';
      const existing: VideoReport[] = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift(report);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  },

  deletePost(postId: string, viewerUid?: string): PostVideo[] {
    markPostIdDeleted(postId);
    const posts = this.getRawPosts().filter((p) => p.id !== postId);
    this.savePosts(posts);
    return this.getPosts(viewerUid);
  },

  // ================= STRICTLY PRIVATE PER-USER NOTIFICATIONS =================
  getNotifications(userUid?: string): AppNotification[] {
    if (!userUid || userUid === 'guest_user') return [];
    try {
      const key = `rongin_notifications_${userUid}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const parsed: AppNotification[] = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      const privateNotifs = parsed
        .filter(
          (n) =>
            n &&
            !FAKE_NOTIF_IDS.has(n.id) &&
            !FAKE_CREATOR_IDS.has(n.actor?.uid) &&
            n.recipientUid === userUid &&
            n.actor?.uid !== userUid
        )
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      if (privateNotifs.length !== parsed.length) {
        localStorage.setItem(key, JSON.stringify(privateNotifs));
      }
      return privateNotifs;
    } catch {
      return [];
    }
  },

  addNotification(targetUserUid: string, notif: AppNotification): AppNotification | null {
    if (
      !targetUserUid ||
      targetUserUid === 'guest_user' ||
      targetUserUid === notif.actor?.uid ||
      FAKE_CREATOR_IDS.has(targetUserUid)
    ) {
      return null;
    }
    const fullNotif: AppNotification = {
      ...notif,
      recipientUid: targetUserUid,
      actor: {
        ...notif.actor,
        avatarUrl: sanitizeAvatarUrl(notif.actor?.avatarUrl),
      },
    };
    const existing = this.getNotifications(targetUserUid).filter((n) => {
      if (n.id === fullNotif.id) return false;
      if (fullNotif.type === 'follow' && n.type === 'follow' && n.actor?.uid === fullNotif.actor.uid) {
        return false;
      }
      if (
        fullNotif.type === 'like' &&
        n.type === 'like' &&
        n.actor?.uid === fullNotif.actor.uid &&
        n.post?.id === fullNotif.post?.id
      ) {
        return false;
      }
      return true;
    });
    const updated = [fullNotif, ...existing].slice(0, 50);
    try {
      localStorage.setItem(`rongin_notifications_${targetUserUid}`, JSON.stringify(updated));
    } catch {}
    return fullNotif;
  },

  markNotificationsAsRead(userUid?: string): AppNotification[] {
    if (!userUid || userUid === 'guest_user') return [];
    const notifs = this.getNotifications(userUid);
    const updated = notifs.map((n) => ({ ...n, isRead: true }));
    try {
      localStorage.setItem(`rongin_notifications_${userUid}`, JSON.stringify(updated));
    } catch {}
    return updated;
  },

  mergeRemoteNotifications(userUid: string, remoteNotifs: AppNotification[]): AppNotification[] {
    if (!userUid || userUid === 'guest_user' || !Array.isArray(remoteNotifs)) {
      return this.getNotifications(userUid);
    }
    const local = this.getNotifications(userUid);
    const byId = new Map<string, AppNotification>();
    local.forEach((n) => byId.set(n.id, n));

    for (const rn of remoteNotifs) {
      if (
        !rn ||
        !rn.id ||
        rn.recipientUid !== userUid ||
        rn.actor?.uid === userUid ||
        FAKE_CREATOR_IDS.has(rn.actor?.uid)
      ) {
        continue;
      }
      const existing = byId.get(rn.id);
      if (!existing) {
        byId.set(rn.id, {
          ...rn,
          actor: {
            ...rn.actor,
            avatarUrl: sanitizeAvatarUrl(rn.actor?.avatarUrl),
          },
        });
      } else {
        byId.set(rn.id, {
          ...(rn.timestamp >= existing.timestamp ? rn : existing),
          isRead: Boolean(existing.isRead || rn.isRead),
        });
      }
    }

    const merged = Array.from(byId.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 50);
    try {
      localStorage.setItem(`rongin_notifications_${userUid}`, JSON.stringify(merged));
    } catch {}
    return merged;
  },

  // ================= OFFLINE SYNC QUEUE =================
  queueAction(action: { type: string; payload: any }) {
    try {
      const queue = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
      queue.push({ ...action, timestamp: Date.now() });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch {}
  },

  getSyncQueue() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    } catch {
      return [];
    }
  },

  clearSyncQueue() {
    try {
      localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
    } catch {}
  },

  // ================= THEME MODE =================
  getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  },

  setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
};
