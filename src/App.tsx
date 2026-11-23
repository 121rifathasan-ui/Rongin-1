import React, { useState, useEffect, useRef } from 'react';
import { PostVideo, UserProfile, Conversation, AppNotification } from './types';
import { offlineStore, DEFAULT_USER, sanitizeAvatarUrl, toPublicProfile } from './lib/offlineStore';
import {
  syncPostToFirebase,
  syncViewToFirebase,
  syncUserToFirebase,
  updatePostInFirebase,
  deletePostFromFirebase,
  fetchUserFromFirebase,
  fetchAllUsersFromFirebase,
  fetchPostsFromFirebase,
  fetchFollowGraphFromFirebase,
  fetchPostLikesFromFirebase,
  syncFollowToFirebase,
  syncLikeToFirebase,
  syncDmMessageToFirebase,
  subscribeUserInbox,
  syncNotificationToFirebase,
  subscribeUserNotifications,
  markNotificationsReadInFirebase,
} from './lib/firebase';
import { VideoPlayer } from './components/VideoPlayer';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { CommentsDrawer } from './components/CommentsDrawer';
import { ShareModal } from './components/ShareModal';
import { ProfileView } from './components/ProfileView';
import { InboxView } from './components/InboxView';
import { DiscoverView } from './components/DiscoverView';
import { CameraStudioModal } from './components/CameraStudioModal';
import { OfflineBanner } from './components/OfflineBanner';
import { AuthModal } from './components/AuthModal';
import { uploadFileToCloudinary } from './lib/cloudinary';
import { Film, CheckCircle2 } from 'lucide-react';
import { useLanguage } from './lib/languageContext';

export default function App() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return offlineStore.getUserProfile();
  });
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [inboxTargetUser, setInboxTargetUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostVideo[]>(() => {
    const initialUser = offlineStore.getUserProfile();
    return offlineStore.getPosts(initialUser?.uid);
  });
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const initialUser = offlineStore.getUserProfile();
    return offlineStore.getConversations(initialUser?.uid);
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const initialUser = offlineStore.getUserProfile();
    return offlineStore.getNotifications(initialUser?.uid);
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => offlineStore.getTheme());

  // Navigation & Views
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'discover' | 'inbox' | 'profile'>('home');
  const [activeFeedTab, setActiveFeedTab] = useState<'following' | 'foryou'>('foryou');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  // Modals & Drawers
  const [activeCommentPost, setActiveCommentPost] = useState<PostVideo | null>(null);
  const [activeSharePost, setActiveSharePost] = useState<PostVideo | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Background Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  const feedContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync with theme
  useEffect(() => {
    offlineStore.setTheme(theme);
  }, [theme]);

  // Re-hydrate posts & per-user inbox/notifications whenever active user changes, plus clean legacy global keys
  useEffect(() => {
    try {
      localStorage.removeItem('tiktok_conversations');
      localStorage.removeItem('tiktok_notifications');
    } catch {}
    setPosts(offlineStore.getPosts(currentUser?.uid));
    setConversations(offlineStore.getConversations(currentUser?.uid));
    setNotifications(offlineStore.getNotifications(currentUser?.uid));

    if (!currentUser?.uid || currentUser.uid === 'guest_user') {
      return;
    }
    const unsubInbox = subscribeUserInbox(currentUser.uid, (remoteConvs) => {
      const merged = offlineStore.mergeRemoteInbox(currentUser.uid, remoteConvs);
      setConversations(merged);
    });
    const unsubNotifs = subscribeUserNotifications(currentUser.uid, (remoteNotifs) => {
      const merged = offlineStore.mergeRemoteNotifications(currentUser.uid, remoteNotifs);
      setNotifications(merged);
    });
    return () => {
      unsubInbox();
      unsubNotifs();
    };
  }, [currentUser?.uid]);

  // Background sync with Firebase RTDB and Express API for real cross-account/cross-session data
  useEffect(() => {
    let cancelled = false;
    const syncRemoteData = async () => {
      try {
        const [fbUsers, fbPosts, fbFollows, fbLikes] = await Promise.all([
          fetchAllUsersFromFirebase(),
          fetchPostsFromFirebase(),
          fetchFollowGraphFromFirebase(),
          fetchPostLikesFromFirebase(),
        ]);
        if (cancelled) return;

        if (fbUsers.length > 0) offlineStore.mergeRemoteUsers(fbUsers);
        if (Object.keys(fbFollows).length > 0) offlineStore.mergeRemoteFollowGraph(fbFollows);
        if (Object.keys(fbLikes).length > 0) offlineStore.mergeRemotePostLikes(fbLikes);

        // Also check local Express server store
        try {
          const [usersRes, postsRes] = await Promise.all([
            fetch('/api/users').then((r) => (r.ok ? r.json() : null)).catch(() => null),
            fetch('/api/posts').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          ]);
          if (usersRes?.users?.length) offlineStore.mergeRemoteUsers(usersRes.users);
          if (postsRes?.posts?.length) fbPosts.push(...postsRes.posts);
        } catch {}

        const updatedPosts = offlineStore.mergeRemotePosts(fbPosts, currentUser?.uid);
        if (!cancelled) {
          setPosts(updatedPosts);
          const refreshedUser = offlineStore.getUserProfile();
          if (refreshedUser) setCurrentUser(refreshedUser);
        }
      } catch {}
    };

    syncRemoteData();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    offlineStore.setTheme(nextTheme);
  };

  // Filter visible posts based on privacy, profile lock (mutual friends only), & active feed tab
  const lockedUserIds = new Set<string>(
    offlineStore
      .getRegisteredAccounts(currentUser?.uid)
      .filter((u) => Boolean(u.isProfileLocked))
      .map((u) => u.uid)
  );
  if (currentUser?.isProfileLocked) {
    lockedUserIds.add(currentUser.uid);
  }

  const visiblePosts = posts.filter((p) => {
    if (p.privacy === 'private') {
      return Boolean(currentUser && p.userId === currentUser.uid);
    }
    if (lockedUserIds.has(p.userId)) {
      if (!currentUser) return false;
      if (p.userId === currentUser.uid) return true;
      return offlineStore.areMutualFriends(currentUser.uid, p.userId);
    }
    return true;
  });

  const currentFeedPosts = visiblePosts.filter((p) => {
    if (activeFeedTab === 'following') {
      return p.isFollowing || (currentUser && p.userId === currentUser.uid);
    }
    return true;
  });

  // Pause and mute all feed videos immediately whenever user leaves Home feed or opens Camera/Auth modals
  const isFeedPlaybackAllowed = activeNavTab === 'home' && !isCameraOpen && !isAuthModalOpen;

  useEffect(() => {
    if (!isFeedPlaybackAllowed) {
      try {
        document.querySelectorAll<HTMLVideoElement>('video[data-feed-video="true"]').forEach((el) => {
          el.pause();
          el.muted = true;
        });
      } catch {}
    }
  }, [isFeedPlaybackAllowed]);

  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track active video reliably on scroll and scroll-snap settle
  const syncActiveIndexFromScroll = () => {
    const container = feedContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const height = container.clientHeight;
    if (!height) return;
    const newIndex = Math.max(0, Math.min(Math.round(scrollTop / height), currentFeedPosts.length - 1));

    if (newIndex !== activeVideoIndex) {
      setActiveVideoIndex(newIndex);
    }
  };

  const handleScroll = () => {
    syncActiveIndexFromScroll();
    if (scrollSettleTimerRef.current) {
      clearTimeout(scrollSettleTimerRef.current);
    }
    scrollSettleTimerRef.current = setTimeout(() => {
      syncActiveIndexFromScroll();
    }, 120);
  };

  // Keyboard navigation (ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeNavTab !== 'home' || activeCommentPost || activeSharePost || isCameraOpen || isAuthModalOpen) {
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(activeVideoIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(activeVideoIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoIndex, activeNavTab, activeCommentPost, activeSharePost, isCameraOpen, isAuthModalOpen, currentFeedPosts.length]);

  const scrollToIndex = (index: number) => {
    const container = feedContainerRef.current;
    if (!container) return;

    const targetIndex = Math.max(0, Math.min(index, currentFeedPosts.length - 1));
    const targetY = targetIndex * container.clientHeight;
    container.scrollTo({ top: targetY, behavior: 'smooth' });
    setActiveVideoIndex(targetIndex);
  };

  // Video Interaction Handlers (100% Real per-user state)
  const handleLike = (postId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const { posts: updated, isLiked, likesCount, notification } = offlineStore.toggleLike(postId, currentUser.uid);
    setPosts(updated);
    setNotifications(offlineStore.getNotifications(currentUser.uid));

    if (notification?.recipientUid) {
      syncNotificationToFirebase(notification.recipientUid, notification);
    }

    const refreshedCurrent = offlineStore.getUserProfile();
    if (refreshedCurrent) setCurrentUser(refreshedCurrent);

    if (viewingProfileUser) {
      setViewingProfileUser(offlineStore.hydrateUserStats(viewingProfileUser, currentUser.uid));
    }

    syncLikeToFirebase(postId, currentUser.uid, isLiked, likesCount);
    fetch(`/api/posts/${postId}/like`, { method: 'POST' }).catch(() => {});
  };

  const handleSave = (postId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const { posts: updated } = offlineStore.toggleSave(postId, currentUser.uid);
    setPosts(updated);

    fetch(`/api/posts/${postId}/save`, { method: 'POST' }).catch(() => {});
  };

  const handleFollowToggle = (creatorId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (creatorId === currentUser.uid) {
      return;
    }

    const { isFollowing, posts: updated, notification } = offlineStore.toggleFollowUser(currentUser.uid, creatorId);
    setPosts(updated);
    setNotifications(offlineStore.getNotifications(currentUser.uid));

    if (notification?.recipientUid) {
      syncNotificationToFirebase(notification.recipientUid, notification);
    }

    const refreshedCurrent = offlineStore.getUserProfile();
    if (refreshedCurrent) setCurrentUser(refreshedCurrent);

    if (viewingProfileUser && viewingProfileUser.uid === creatorId) {
      setViewingProfileUser(offlineStore.hydrateUserStats(viewingProfileUser, currentUser.uid));
    }

    syncFollowToFirebase(currentUser.uid, creatorId, isFollowing);
  };

  // Rule: Count view ONLY after 3 seconds of continuous playback
  const handleViewRecord = (postId: string, durationSec: number, incrementView: boolean = false) => {
    const updated = offlineStore.recordView(postId, durationSec, incrementView, currentUser?.uid);
    setPosts(updated);

    syncViewToFirebase(postId, durationSec, incrementView);

    fetch(`/api/posts/${postId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watchSec: durationSec, incrementView }),
    }).catch(() => {});
  };

  const handleAddComment = (postId: string, text: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const { comments: updatedComments, notification } = offlineStore.addComment(postId, text, currentUser);
    setPosts(offlineStore.getPosts(currentUser.uid));
    setNotifications(offlineStore.getNotifications(currentUser.uid));

    if (notification?.recipientUid) {
      syncNotificationToFirebase(notification.recipientUid, notification);
    }

    fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedComments[0]),
    }).catch(() => {});
  };

  const handleProfileClick = async (userId: string, username?: string) => {
    if (currentUser && (userId === currentUser.uid || (username && username === currentUser.username))) {
      setViewingProfileUser(null);
      setActiveNavTab('profile');
      return;
    }

    // 1. Find real registered profile locally
    let targetProfile = offlineStore.findRegisteredUser(userId, username, undefined, currentUser?.uid);

    // 2. Fallback strictly to real post metadata with zero fake stats
    if (!targetProfile) {
      const post = posts.find((p) => p.userId === userId || (username && p.username === username));
      if (post) {
        targetProfile = offlineStore.hydrateUserStats(
          {
            uid: post.userId,
            name: post.userDisplayName || post.username,
            username: post.username,
            avatarUrl: sanitizeAvatarUrl(post.avatarUrl),
            bio: '',
            following: 0,
            followers: 0,
            likes: 0,
            isVerified: post.isVerified,
          },
          currentUser?.uid
        );
      }
    }

    if (targetProfile) {
      const publicTarget = toPublicProfile(targetProfile);
      setViewingProfileUser(publicTarget);
      setActiveNavTab('profile');

      // 3. Silently enrich public metadata from Firebase RTDB in case the account was created on another browser/device
      const remoteUser = await fetchUserFromFirebase(publicTarget.uid);
      if (remoteUser) {
        offlineStore.mergeRemoteUsers([remoteUser]);
        setViewingProfileUser(toPublicProfile(offlineStore.hydrateUserStats(remoteUser, currentUser?.uid)));
      }
    }
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    const hydrated = offlineStore.hydrateUserStats(updatedUser, updatedUser.uid);
    setCurrentUser(hydrated);
    offlineStore.saveUserProfile(hydrated);
    setPosts(offlineStore.getPosts(hydrated.uid));
    syncUserToFirebase(hydrated);

    fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hydrated),
    }).catch(() => {});
  };

  const handleAuthSuccess = (user: UserProfile) => {
    const hydrated = offlineStore.hydrateUserStats(user, user.uid);
    setCurrentUser(hydrated);
    offlineStore.saveUserProfile(hydrated);
    syncUserToFirebase(hydrated);
    setPosts(offlineStore.getPosts(hydrated.uid));
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    offlineStore.logoutUser();
    setCurrentUser(null);
    setViewingProfileUser(null);
    setConversations([]);
    setNotifications([]);
    setActiveNavTab('home');
    setPosts(offlineStore.getPosts());
    setIsAuthModalOpen(true);
  };

  const handlePostSuccess = (newPost: PostVideo) => {
    const updated = offlineStore.addPost(newPost, currentUser?.uid);
    setPosts(updated);
    setActiveFeedTab('foryou');
    setActiveNavTab('home');
    setActiveVideoIndex(0);

    syncPostToFirebase(newPost);

    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost),
    }).catch(() => {});
  };

  const handleStartBackgroundUpload = async (uploadTask: {
    selectedFile: File | null;
    videoUrl: string;
    thumbnailUrl?: string;
    caption: string;
    musicTitle: string;
    musicAuthor: string;
    tags: string[];
    privacy: 'public' | 'friends' | 'private';
    currentUser: UserProfile;
  }) => {
    setUploadProgress(15);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 20;
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 15;
      });
    }, 450);

    let finalUrl = uploadTask.videoUrl;
    let finalThumbnailUrl = uploadTask.thumbnailUrl;

    try {
      if (uploadTask.selectedFile) {
        try {
          const res = await uploadFileToCloudinary(uploadTask.selectedFile, 'video');
          finalUrl = res.secureUrl;
          if (!finalThumbnailUrl && res.thumbnailUrl) {
            finalThumbnailUrl = res.thumbnailUrl;
          }
        } catch (cloudErr) {
          console.warn('Cloudinary upload failed, trying server upload fallback:', cloudErr);
          const mime = uploadTask.selectedFile.type || 'video/mp4';
          const upRes = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': mime },
            body: uploadTask.selectedFile,
          });
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData?.success && upData?.url) {
              finalUrl = upData.url;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Upload fallback error:', e);
    }

    clearInterval(progressTimer);
    setUploadProgress(100);

    const newPost: PostVideo = {
      id: `post_${Date.now()}`,
      userId: uploadTask.currentUser.uid,
      username: uploadTask.currentUser.username,
      userDisplayName: uploadTask.currentUser.name,
      avatarUrl: sanitizeAvatarUrl(uploadTask.currentUser.avatarUrl),
      videoUrl: finalUrl,
      thumbnailUrl: finalThumbnailUrl,
      caption: uploadTask.caption,
      musicTitle: uploadTask.musicTitle,
      musicAuthor: uploadTask.musicAuthor,
      musicCover:
        finalThumbnailUrl ||
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
      likes: 0,
      commentsCount: 0,
      shares: 0,
      saves: 0,
      views: 0,
      watchTime: 0,
      timestamp: Date.now(),
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      isVerified: uploadTask.currentUser.isVerified || false,
      tags: uploadTask.tags,
      privacy: uploadTask.privacy,
    };

    handlePostSuccess(newPost);

    setTimeout(() => {
      setUploadProgress(null);
      setUploadSuccessToast(t.videoPublishedToast);
      setTimeout(() => setUploadSuccessToast(null), 4500);
    }, 800);
  };

  const handleSendVideoToContacts = (post: PostVideo, targets: Conversation[]) => {
    if (!currentUser || currentUser.uid === 'guest_user') {
      setIsAuthModalOpen(true);
      return;
    }
    const sharedPostPayload = {
      id: post.id,
      videoUrl: post.videoUrl,
      thumbnailUrl: post.thumbnailUrl,
      caption: post.caption,
      username: post.username,
      avatarUrl: post.avatarUrl,
    };
    const msgText = `একটি ভিডিও শেয়ার করেছেন: ${post.caption ? post.caption.slice(0, 60) : `@${post.username}`}`;

    let latestConvs = conversations;
    targets.forEach((conv) => {
      const res = offlineStore.sendMessage(
        conv.id,
        msgText,
        currentUser,
        conv.participant,
        undefined,
        sharedPostPayload
      );
      latestConvs = res.updatedConvs;

      syncDmMessageToFirebase(res.threadId, res.newMsg, currentUser, conv.participant);

      fetch(`/api/conversations/${res.threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(res.newMsg),
      }).catch(() => {});
    });

    setConversations(latestConvs);
    const updatedPosts = offlineStore.incrementShareCount(post.id, currentUser?.uid);
    setPosts(updatedPosts);
  };

  const handleEditPost = (postId: string, updates: Partial<PostVideo>) => {
    const updated = offlineStore.updatePost(postId, updates, currentUser?.uid);
    setPosts(updated);
    updatePostInFirebase(postId, updates);
    fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  };

  const handleDeletePost = (postId: string) => {
    const updated = offlineStore.deletePost(postId, currentUser?.uid);
    setPosts(updated);
    if (currentUser) {
      setCurrentUser(offlineStore.hydrateUserStats(currentUser, currentUser.uid));
    }
    deletePostFromFirebase(postId);
    fetch(`/api/posts/${postId}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleSendMessage = (convId: string, text: string) => {
    setConversations(offlineStore.getConversations(currentUser?.uid));
    fetch(`/api/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, senderId: currentUser ? currentUser.uid : 'guest', timestamp: Date.now() }),
    }).catch(() => {});
  };

  const handleMarkNotificationsRead = () => {
    if (!currentUser?.uid) return;
    markNotificationsReadInFirebase(currentUser.uid, notifications);
    const updated = offlineStore.markNotificationsAsRead(currentUser.uid);
    setNotifications(updated);
    fetch('/api/notifications/read', { method: 'POST' }).catch(() => {});
  };

  const handleSelectPostFromOtherView = (post: PostVideo) => {
    setActiveFeedTab('foryou');
    setActiveNavTab('home');
    const targetIdx = visiblePosts.findIndex((p) => p.id === post.id);
    if (targetIdx !== -1) {
      setTimeout(() => {
        scrollToIndex(targetIdx);
      }, 120);
    }
  };

  // Combine existing conversations with other real registered users for Messenger sharing
  const shareContacts: Conversation[] = (() => {
    const byUid = new Map<string, Conversation>();
    conversations.forEach((c) => {
      if (c.participant?.uid && c.participant.uid !== currentUser?.uid) {
        byUid.set(c.participant.uid, c);
      }
    });
    const realAccounts = offlineStore.getRegisteredAccounts(currentUser?.uid);
    realAccounts.forEach((acc) => {
      if (acc.uid !== currentUser?.uid && !byUid.has(acc.uid)) {
        byUid.set(acc.uid, {
          id: currentUser ? offlineStore.getDmThreadId(currentUser.uid, acc.uid) : `conv_${acc.uid}`,
          participant: {
            uid: acc.uid,
            name: acc.name,
            username: acc.username,
            avatarUrl: sanitizeAvatarUrl(acc.avatarUrl),
            isOnline: true,
            isVerified: acc.isVerified,
          },
          lastMessage: {
            id: `msg_preview_${acc.uid}`,
            senderId: acc.uid,
            senderName: acc.name,
            senderAvatar: sanitizeAvatarUrl(acc.avatarUrl),
            recipientId: currentUser?.uid || 'me',
            text: '',
            timestamp: Date.now(),
            isRead: true,
          },
          unreadCount: 0,
        });
      }
    });
    return Array.from(byUid.values());
  })();

  const hydratedCurrentUser = currentUser
    ? offlineStore.hydrateUserStats(currentUser, currentUser.uid)
    : null;
  const hydratedViewingUser = viewingProfileUser
    ? toPublicProfile(offlineStore.hydrateUserStats(viewingProfileUser, currentUser?.uid))
    : null;

  const unreadInboxCount =
    conversations.reduce((acc, c) => acc + c.unreadCount, 0) +
    notifications.filter((n) => !n.isRead).length;

  return (
    <div className={`relative w-full h-[100dvh] overflow-hidden bg-black text-white ${theme === 'light' ? 'theme-light' : ''}`}>
      {/* Offline Status & PWA Install Banner */}
      <OfflineBanner />

      {/* Main Views */}
      <main className="w-full h-full">
        {/* TAB 1: HOME FEED */}
        {activeNavTab === 'home' && (
          <div className="relative w-full h-full">
            {/* Transparent Floating Top Header */}
            <TopHeader
              activeFeedTab={activeFeedTab}
              onSelectFeedTab={(tab) => {
                setActiveFeedTab(tab);
                setActiveVideoIndex(0);
                if (feedContainerRef.current) {
                  feedContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onSearchClick={() => setActiveNavTab('discover')}
            />

            {/* Vertical Video Snap Scroll Feed */}
            <div
              ref={feedContainerRef}
              onScroll={handleScroll}
              className="app-vertical-feed w-full h-full min-h-[100dvh] scrollbar-none"
            >
              {currentFeedPosts.length === 0 ? (
                <div className="w-full h-full min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center text-zinc-400 gap-3">
                  <Film className="w-12 h-12 text-[#fe2c55]" />
                  <h3 className="text-base font-bold text-white">{t.noVideosFound}</h3>
                  <p className="text-xs text-zinc-400 max-w-xs">
                    {activeFeedTab === 'following'
                      ? t.noFollowingVideos
                      : t.activateFeedDesc}
                  </p>
                  {activeFeedTab === 'following' ? (
                    <button
                      onClick={() => setActiveFeedTab('foryou')}
                      className="px-4 py-2 rounded-full bg-[#fe2c55] text-white text-xs font-bold shadow-lg"
                    >
                      {t.goToForYou}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          setIsAuthModalOpen(true);
                          return;
                        }
                        setIsCameraOpen(true);
                      }}
                      className="px-4 py-2 rounded-full bg-[#fe2c55] text-white text-xs font-bold shadow-lg"
                    >
                      {t.uploadNewVideo}
                    </button>
                  )}
                </div>
              ) : (
                currentFeedPosts.map((post, idx) => (
                  <VideoPlayer
                    key={post.id}
                    post={post}
                    isActive={idx === activeVideoIndex && isFeedPlaybackAllowed}
                    currentUser={hydratedCurrentUser}
                    onLike={handleLike}
                    onSave={handleSave}
                    onFollowToggle={handleFollowToggle}
                    onCommentClick={(p) => {
                      if (!currentUser) {
                        setIsAuthModalOpen(true);
                        return;
                      }
                      setActiveCommentPost(p);
                    }}
                    onShareClick={(p) => setActiveSharePost(p)}
                    onProfileClick={(userId, username) => handleProfileClick(userId, username)}
                    onViewRecord={handleViewRecord}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DISCOVER / SEARCH */}
        {activeNavTab === 'discover' && (
          <DiscoverView
            posts={visiblePosts}
            onSelectPost={handleSelectPostFromOtherView}
          />
        )}

        {/* TAB 3: INBOX (MESSAGING & NOTIFICATIONS) */}
        {activeNavTab === 'inbox' && (
          <InboxView
            currentUser={hydratedCurrentUser || DEFAULT_USER}
            conversations={conversations}
            notifications={notifications}
            onSendMessage={handleSendMessage}
            onMarkNotificationsRead={handleMarkNotificationsRead}
            initialChatUser={inboxTargetUser}
            onProfileClick={(userId, username) => handleProfileClick(userId, username)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onSelectSharedPost={(postId) => {
              const target = visiblePosts.find((p) => p.id === postId) || posts.find((p) => p.id === postId);
              if (target) handleSelectPostFromOtherView(target);
            }}
          />
        )}

        {/* TAB 4: PROFILE & CREATOR DASHBOARD */}
        {activeNavTab === 'profile' && (
          <ProfileView
            user={hydratedViewingUser || hydratedCurrentUser || DEFAULT_USER}
            posts={visiblePosts}
            viewerUid={hydratedCurrentUser?.uid}
            isOwnProfile={
              !hydratedViewingUser ||
              (hydratedCurrentUser ? hydratedViewingUser.uid === hydratedCurrentUser.uid : false)
            }
            isLoggedIn={!!hydratedCurrentUser}
            onBack={() => {
              setViewingProfileUser(null);
              setActiveNavTab('home');
            }}
            onOpenMessage={(targetUser) => {
              if (!hydratedCurrentUser) {
                setIsAuthModalOpen(true);
                return;
              }
              setInboxTargetUser(targetUser);
              setActiveNavTab('inbox');
            }}
            onFollowToggle={(targetUid) => {
              if (!hydratedCurrentUser) {
                setIsAuthModalOpen(true);
                return;
              }
              handleFollowToggle(targetUid);
            }}
            onUpdateProfile={handleUpdateProfile}
            onSelectPost={handleSelectPostFromOtherView}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onDeletePost={handleDeletePost}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeNavTab}
        onSelectTab={(tab) => {
          if (tab === 'inbox') {
            setInboxTargetUser(null);
          }
          if (tab === 'profile') {
            setViewingProfileUser(null);
            if (!currentUser) {
              setIsAuthModalOpen(true);
              return;
            }
          }
          setActiveNavTab(tab);
        }}
        onOpenUpload={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          setIsCameraOpen(true);
        }}
        unreadInboxCount={unreadInboxCount}
      />

      {/* Comments Drawer Modal */}
      {activeCommentPost && (
        <CommentsDrawer
          isOpen={!!activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          postId={activeCommentPost.id}
          comments={offlineStore.getComments(activeCommentPost.id)}
          currentUser={hydratedCurrentUser}
          onAddComment={handleAddComment}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Share Sheet Modal */}
      {activeSharePost && (
        <ShareModal
          isOpen={!!activeSharePost}
          onClose={() => setActiveSharePost(null)}
          post={activeSharePost}
          currentUser={hydratedCurrentUser}
          conversations={shareContacts}
          onSendToContacts={handleSendVideoToContacts}
          onDeletePost={handleDeletePost}
          onEditPost={handleEditPost}
          onRequireAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Camera & Studio Modal */}
      <CameraStudioModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        currentUser={hydratedCurrentUser}
        onStartBackgroundUpload={handleStartBackgroundUpload}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Non-Blocking Floating Background Upload Progress Card */}
      {uploadProgress !== null && (
        <div className="fixed bottom-20 right-4 z-40 bg-zinc-950/95 border border-zinc-700/80 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-md">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                className="stroke-zinc-800"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                className="stroke-[#fe2c55] transition-all duration-300"
                strokeWidth="3"
                strokeDasharray={100}
                strokeDashoffset={100 - uploadProgress}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute text-[10px] font-black text-white">
              {uploadProgress}%
            </span>
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-white block">
              {uploadProgress < 100 ? t.uploadingVideoProgress : t.processingVideoProgress}
            </span>
            <span className="text-[10px] text-zinc-400 font-semibold">
              {t.continueUsingApp}
            </span>
          </div>
        </div>
      )}

      {/* Video Uploaded Success Toast */}
      {uploadSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {uploadSuccessToast}
        </div>
      )}
    </div>
  );
}
