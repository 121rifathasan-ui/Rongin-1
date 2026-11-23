import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getDatabase, ref, set, get, child, update, remove, onValue } from 'firebase/database';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// User provided Firebase credentials
export const firebaseConfig = {
  apiKey: "AIzaSyDDtz_5d1XaWB2Sh8vJjZIr4zEpR2sRav8",
  authDomain: "shora-shori-shongbad.firebaseapp.com",
  databaseURL: "https://shora-shori-shongbad-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "shora-shori-shongbad",
  storageBucket: "shora-shori-shongbad.firebasestorage.app",
  messagingSenderId: "1037704729738",
  appId: "1:1037704729738:web:75e626565e48262ab80973",
  measurementId: "G-4EVR7EH8GX"
};

// Initialize Firebase safely (prevent multiple initialization)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(firebaseApp);
        } catch {}
      }
    })
    .catch(() => {});
}

export const auth = getAuth(firebaseApp);
export const realtimeDb = getDatabase(firebaseApp);
export const firestore = getFirestore(firebaseApp);

const sanitizePublicUserFields = (user: any) => {
  if (!user || typeof user !== 'object') return null;
  const p = user.privacySettings || {};
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
    mobile: _m,
    email,
    phone,
    age,
    dateOfBirth,
    gender,
    location,
    ...publicFields
  } = user;

  const fallbackPhone = phone ?? _m;
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
    privacySettings: privacy,
    ...(privacy.hideEmail ? {} : email !== undefined ? { email } : {}),
    ...(privacy.hidePhone ? {} : fallbackPhone !== undefined ? { phone: fallbackPhone } : {}),
    ...(privacy.hideAge ? {} : age !== undefined ? { age } : {}),
    ...(privacy.hideBirthday ? {} : dateOfBirth !== undefined ? { dateOfBirth } : {}),
    ...(privacy.hideGender ? {} : gender !== undefined ? { gender } : {}),
    ...(privacy.hideLocation ? {} : location !== undefined ? { location } : {}),
  };
};

/**
 * Sync public user profile fields to Firebase Realtime Database (respecting user privacySettings; never expose password/contact or hidden fields)
 */
export async function syncUserToFirebase(user: any): Promise<boolean> {
  if (!user || !user.uid || user.uid === 'guest_user') return false;
  try {
    const publicUser = sanitizePublicUserFields(user);
    const userRef = ref(realtimeDb, `users/${user.uid}`);
    await set(userRef, {
      ...publicUser,
      lastActive: Date.now()
    });
    return true;
  } catch (err) {
    console.warn('Firebase RTDB sync note (local fallback active):', err);
    return false;
  }
}

/**
 * Fetch a single user's public profile from Firebase Realtime Database
 */
export async function fetchUserFromFirebase(uid: string): Promise<any | null> {
  if (!uid || uid === 'guest_user') return null;
  try {
    const userRef = ref(realtimeDb, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return sanitizePublicUserFields(snapshot.val());
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch all real users' public profiles from Firebase Realtime Database
 */
export async function fetchAllUsersFromFirebase(): Promise<any[]> {
  try {
    const usersRef = ref(realtimeDb, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      return Object.values(val || {})
        .filter((u: any) => u && u.uid && u.uid !== 'guest_user')
        .map((u: any) => sanitizePublicUserFields(u))
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Check if a mobile or email is already registered in Firebase Realtime Database
 */
export async function checkIdentifierExistsInFirebase(identifier: string): Promise<boolean> {
  try {
    const dbRef = ref(realtimeDb);
    const snapshot = await get(child(dbRef, 'users'));
    if (snapshot.exists()) {
      const usersObj = snapshot.val();
      const cleanIdent = identifier.trim().toLowerCase();
      for (const key in usersObj) {
        const u = usersObj[key];
        if (
          (u.contact && u.contact.trim().toLowerCase() === cleanIdent) ||
          (u.email && u.email.trim().toLowerCase() === cleanIdent) ||
          (u.phone && u.phone.trim().toLowerCase() === cleanIdent)
        ) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sync new post to Firebase
 */
export async function syncPostToFirebase(post: any): Promise<boolean> {
  try {
    const postRef = ref(realtimeDb, `posts/${post.id}`);
    await set(postRef, post);
    return true;
  } catch (err) {
    console.warn('Firebase post sync note:', err);
    return false;
  }
}

/**
 * Fetch all real posts from Firebase Realtime Database
 */
export async function fetchPostsFromFirebase(): Promise<any[]> {
  try {
    const postsRef = ref(realtimeDb, 'posts');
    const snapshot = await get(postsRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      return Object.values(val || {}).filter((p: any) => p && p.id && p.videoUrl);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Sync follow relationship to Firebase Realtime Database
 */
export async function syncFollowToFirebase(followerUid: string, targetUid: string, isFollowing: boolean): Promise<boolean> {
  if (!followerUid || !targetUid || followerUid === targetUid) return false;
  try {
    const followRef = ref(realtimeDb, `follows/${followerUid}/${targetUid}`);
    if (isFollowing) {
      await set(followRef, true);
    } else {
      await remove(followRef);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch full follow graph from Firebase Realtime Database
 */
export async function fetchFollowGraphFromFirebase(): Promise<Record<string, string[]>> {
  try {
    const followsRef = ref(realtimeDb, 'follows');
    const snapshot = await get(followsRef);
    if (!snapshot.exists()) return {};
    const raw = snapshot.val() || {};
    const graph: Record<string, string[]> = {};
    for (const followerUid of Object.keys(raw)) {
      const targets = raw[followerUid];
      if (targets && typeof targets === 'object') {
        graph[followerUid] = Object.keys(targets).filter((k) => Boolean(targets[k]) && k !== followerUid);
      }
    }
    return graph;
  } catch {
    return {};
  }
}

/**
 * Sync post like by user to Firebase Realtime Database
 */
export async function syncLikeToFirebase(postId: string, userUid: string, isLiked: boolean, likesCount: number): Promise<boolean> {
  if (!postId || !userUid) return false;
  try {
    const likerRef = ref(realtimeDb, `postLikes/${postId}/${userUid}`);
    if (isLiked) {
      await set(likerRef, true);
    } else {
      await remove(likerRef);
    }
    const postRef = ref(realtimeDb, `posts/${postId}`);
    await update(postRef, { likes: likesCount });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch post likers map from Firebase Realtime Database
 */
export async function fetchPostLikesFromFirebase(): Promise<Record<string, string[]>> {
  try {
    const likesRef = ref(realtimeDb, 'postLikes');
    const snapshot = await get(likesRef);
    if (!snapshot.exists()) return {};
    const raw = snapshot.val() || {};
    const map: Record<string, string[]> = {};
    for (const postId of Object.keys(raw)) {
      const users = raw[postId];
      if (users && typeof users === 'object') {
        map[postId] = Object.keys(users).filter((uid) => Boolean(users[uid]));
      }
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Update post in Firebase Realtime Database
 */
export async function updatePostInFirebase(postId: string, updates: Record<string, any>): Promise<boolean> {
  try {
    const postRef = ref(realtimeDb, `posts/${postId}`);
    await update(postRef, {
      ...updates,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.warn('Firebase post update note:', err);
    return false;
  }
}

/**
 * Delete post from Firebase Realtime Database
 */
export async function deletePostFromFirebase(postId: string): Promise<boolean> {
  try {
    const postRef = ref(realtimeDb, `posts/${postId}`);
    await remove(postRef);
    return true;
  } catch (err) {
    console.warn('Firebase post delete note:', err);
    return false;
  }
}

/**
 * Submit video report to Firebase (RTDB + Firestore so external admin/viewer apps can read it)
 */
export async function submitReportToFirebase(report: {
  id: string;
  postId: string;
  postUrl: string;
  postCaption: string;
  reportedUserId: string;
  reportedUsername: string;
  reporterUserId: string;
  reporterUsername: string;
  subject: string;
  details: string;
  status: string;
  createdAt: number;
}): Promise<boolean> {
  let saved = false;
  try {
    const reportRef = ref(realtimeDb, `reports/${report.id}`);
    await set(reportRef, report);
    saved = true;
  } catch (err) {
    console.warn('Firebase RTDB report submit note:', err);
  }

  try {
    await setDoc(doc(firestore, 'reports', report.id), report);
    saved = true;
  } catch (err) {
    console.warn('Firebase Firestore report submit note:', err);
  }

  return saved;
}

/**
 * Sync video view count & watch time to Firebase
 */
export async function syncViewToFirebase(postId: string, watchSec: number, incrementView: boolean): Promise<void> {
  try {
    const postRef = ref(realtimeDb, `posts/${postId}`);
    const snapshot = await get(postRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const currentViews = data.views || 0;
      const currentWatch = data.watchTime || 0;
      await update(postRef, {
        views: incrementView ? currentViews + 1 : currentViews,
        watchTime: currentWatch + watchSec,
        lastViewed: Date.now()
      });
    }
  } catch {
    // Graceful offline fallback
  }
}

/**
 * Sign in with Google using Firebase Authentication Popup
 */
export async function signInWithGoogle(): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    // Check if user already has a saved profile in Firebase RTDB so we don't overwrite edited details!
    const existingRemote = await fetchUserFromFirebase(fbUser.uid);
    if (existingRemote) {
      await syncUserToFirebase({ lastActive: Date.now(), uid: fbUser.uid });
      return { success: true, user: existingRemote };
    }

    const cleanUsername = (fbUser.email ? fbUser.email.split('@')[0] : 'user_' + fbUser.uid.slice(0, 6))
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    const userProfile = {
      uid: fbUser.uid,
      name: fbUser.displayName || 'Google User',
      username: cleanUsername,
      avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160',
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      bio: '',
      following: 0,
      followers: 0,
      likes: 0,
      category: 'Creator',
      contact: fbUser.email || fbUser.phoneNumber || '',
      email: fbUser.email || '',
      age: 20,
      isVerified: false
    };

    await syncUserToFirebase(userProfile);
    return { success: true, user: userProfile };
  } catch (err: any) {
    console.warn('Google sign-in error:', err);
    if (err.code === 'auth/popup-blocked') {
      return { success: false, error: 'ব্রাউজারে পপআপ ব্লক করা আছে। দয়া করে পপআপ অ্যালাউ করুন।' };
    }
    if (err.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Google সাইন ইন উইন্ডো বন্ধ করা হয়েছে।' };
    }
    return { success: false, error: err.message || 'Google সাইন ইন ব্যর্থ হয়েছে।' };
  }
}

function cleanUndefined(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        out[key] = cleanUndefined(val);
      } else {
        out[key] = val;
      }
    }
  }
  return out;
}

/**
 * Sync a 1-on-1 Direct Message to Firebase RTDB (strictly isolated per threadId and per-user inbox)
 */
export async function syncDmMessageToFirebase(
  threadId: string,
  msg: any,
  sender: { uid: string; name: string; username: string; avatarUrl: string; isVerified?: boolean },
  recipient: { uid: string; name: string; username: string; avatarUrl: string; isVerified?: boolean }
): Promise<boolean> {
  if (!threadId || !msg?.id || !sender?.uid || !recipient?.uid) return false;
  try {
    const safeMsg = cleanUndefined(msg);
    await set(ref(realtimeDb, `dmThreads/${threadId}/messages/${msg.id}`), safeMsg);

    // Sender's inbox entry
    await set(
      ref(realtimeDb, `userInboxes/${sender.uid}/${recipient.uid}`),
      cleanUndefined({
        id: threadId,
        participant: {
          uid: recipient.uid,
          name: recipient.name,
          username: recipient.username,
          avatarUrl: recipient.avatarUrl,
          isOnline: true,
          isVerified: Boolean(recipient.isVerified),
        },
        lastMessage: safeMsg,
        unreadCount: 0,
      })
    );

    // Recipient's inbox entry (increment unread count)
    const recInboxRef = ref(realtimeDb, `userInboxes/${recipient.uid}/${sender.uid}`);
    let prevUnread = 0;
    try {
      const snap = await get(recInboxRef);
      if (snap.exists()) {
        prevUnread = Number(snap.val()?.unreadCount || 0);
      }
    } catch {}

    await set(
      recInboxRef,
      cleanUndefined({
        id: threadId,
        participant: {
          uid: sender.uid,
          name: sender.name,
          username: sender.username,
          avatarUrl: sender.avatarUrl,
          isOnline: true,
          isVerified: Boolean(sender.isVerified),
        },
        lastMessage: safeMsg,
        unreadCount: prevUnread + 1,
      })
    );
    return true;
  } catch (err) {
    console.warn('Firebase DM sync note:', err);
    return false;
  }
}

/**
 * Mark incoming 1-on-1 DM messages as seen in Firebase RTDB
 */
export async function markDmSeenInFirebase(
  threadId: string,
  viewerUid: string,
  partnerUid: string,
  messages: any[]
): Promise<void> {
  if (!threadId || !viewerUid || !partnerUid) return;
  try {
    await update(ref(realtimeDb, `userInboxes/${viewerUid}/${partnerUid}`), {
      unreadCount: 0,
    });
    const toMark = messages.filter(
      (m) => m.senderId === partnerUid && m.recipientId === viewerUid && (!m.isRead || m.status !== 'seen')
    );
    await Promise.all(
      toMark.map((m) =>
        update(ref(realtimeDb, `dmThreads/${threadId}/messages/${m.id}`), {
          isRead: true,
          status: 'seen',
        })
      )
    );
  } catch {}
}

/**
 * Real-time listener for a user's private inbox list
 */
export function subscribeUserInbox(
  userUid: string,
  onUpdate: (convs: any[]) => void
): () => void {
  if (!userUid || userUid === 'guest_user') return () => {};
  try {
    const inboxRef = ref(realtimeDb, `userInboxes/${userUid}`);
    return onValue(
      inboxRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }
        const val = snapshot.val() || {};
        const list = Object.values(val)
          .filter((c: any) => c && c.participant?.uid && c.participant.uid !== userUid)
          .sort((a: any, b: any) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0));
        onUpdate(list);
      },
      () => {}
    );
  } catch {
    return () => {};
  }
}

/**
 * Real-time listener for a 1-on-1 DM thread's messages
 */
export function subscribeDmThread(
  threadId: string,
  onUpdate: (msgs: any[]) => void
): () => void {
  if (!threadId) return () => {};
  try {
    const threadRef = ref(realtimeDb, `dmThreads/${threadId}/messages`);
    return onValue(
      threadRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }
        const val = snapshot.val() || {};
        const list = Object.values(val)
          .filter((m: any) => m && m.id)
          .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
        onUpdate(list);
      },
      () => {}
    );
  } catch {
    return () => {};
  }
}

/**
 * Sync a private notification strictly into the recipient user's node in Firebase RTDB
 */
export async function syncNotificationToFirebase(
  targetUserUid: string,
  notif: any
): Promise<boolean> {
  if (
    !targetUserUid ||
    targetUserUid === 'guest_user' ||
    !notif?.id ||
    notif.actor?.uid === targetUserUid
  ) {
    return false;
  }
  try {
    const safeNotif = cleanUndefined({
      ...notif,
      recipientUid: targetUserUid,
    });
    await set(ref(realtimeDb, `userNotifications/${targetUserUid}/${notif.id}`), safeNotif);
    return true;
  } catch (err) {
    console.warn('Firebase notification sync note:', err);
    return false;
  }
}

/**
 * Real-time listener for a user's strictly private notification inbox
 */
export function subscribeUserNotifications(
  userUid: string,
  onUpdate: (notifs: any[]) => void
): () => void {
  if (!userUid || userUid === 'guest_user') return () => {};
  try {
    const notifRef = ref(realtimeDb, `userNotifications/${userUid}`);
    return onValue(
      notifRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }
        const val = snapshot.val() || {};
        const list = Object.values(val)
          .filter(
            (n: any) =>
              n &&
              n.id &&
              n.recipientUid === userUid &&
              n.actor?.uid !== userUid
          )
          .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
        onUpdate(list);
      },
      () => {}
    );
  } catch {
    return () => {};
  }
}

/**
 * Mark private notifications as read in Firebase RTDB for a user
 */
export async function markNotificationsReadInFirebase(
  userUid: string,
  notifs: any[]
): Promise<void> {
  if (!userUid || userUid === 'guest_user' || !Array.isArray(notifs)) return;
  try {
    const unread = notifs.filter((n) => n && n.id && !n.isRead);
    await Promise.all(
      unread.map((n) =>
        update(ref(realtimeDb, `userNotifications/${userUid}/${n.id}`), {
          isRead: true,
        })
      )
    );
  } catch {}
}


