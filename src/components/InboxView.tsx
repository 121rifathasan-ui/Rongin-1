import React, { useState, useEffect, useRef } from 'react';
import { Conversation, AppNotification, UserProfile, DirectMessage } from '../types';
import {
  MessageSquare,
  Bell,
  Search,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  Play,
  LogIn,
} from 'lucide-react';
import { offlineStore, sanitizeAvatarUrl } from '../lib/offlineStore';
import {
  syncDmMessageToFirebase,
  markDmSeenInFirebase,
  subscribeUserInbox,
  subscribeDmThread,
} from '../lib/firebase';
import { useLanguage } from '../lib/languageContext';

interface InboxViewProps {
  currentUser: UserProfile;
  conversations: Conversation[];
  notifications: AppNotification[];
  onSendMessage: (convId: string, text: string, recipient?: any) => void;
  onMarkNotificationsRead: () => void;
  initialChatUser?: UserProfile | null;
  onProfileClick?: (userId: string, username: string) => void;
  onSelectSharedPost?: (postId: string) => void;
  onOpenAuth?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  currentUser,
  conversations: initialConvs,
  notifications,
  onSendMessage,
  onMarkNotificationsRead,
  initialChatUser,
  onProfileClick,
  onSelectSharedPost,
  onOpenAuth,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'messages' | 'notifications'>('messages');
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    offlineStore.getConversations(currentUser.uid)
  );
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifFilter, setNotifFilter] = useState<'all' | 'like' | 'comment' | 'follow'>('all');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isGuest = !currentUser?.uid || currentUser.uid === 'guest_user';

  // Keep per-user conversations fresh when user or initialConvs changes
  useEffect(() => {
    if (isGuest) {
      setConversations([]);
      setActiveConv(null);
      setChatMessages([]);
      return;
    }
    setConversations(offlineStore.getConversations(currentUser.uid));
  }, [currentUser.uid, initialConvs, isGuest]);

  // Real-time Firebase RTDB listener for this user's private inbox
  useEffect(() => {
    if (isGuest) return;
    const unsubscribe = subscribeUserInbox(currentUser.uid, (remoteConvs) => {
      const merged = offlineStore.mergeRemoteInbox(currentUser.uid, remoteConvs);
      setConversations(merged);
    });
    return () => unsubscribe();
  }, [currentUser.uid, isGuest]);

  // Real-time Firebase RTDB listener for the currently open 1-on-1 DM thread
  useEffect(() => {
    if (isGuest || !activeConv?.participant?.uid) return;
    const partnerUid = activeConv.participant.uid;
    const threadId = offlineStore.getDmThreadId(currentUser.uid, partnerUid);

    // Load local 1-on-1 history immediately
    const localHistory = offlineStore.getChatHistory(currentUser.uid, partnerUid);
    setChatMessages(localHistory);

    const seenUpdated = offlineStore.markMessagesAsSeen(currentUser.uid, partnerUid);
    if (seenUpdated.length > 0) {
      setChatMessages(seenUpdated);
      setConversations(offlineStore.getConversations(currentUser.uid));
      markDmSeenInFirebase(threadId, currentUser.uid, partnerUid, seenUpdated);
    }

    const unsubscribe = subscribeDmThread(threadId, (remoteMsgs) => {
      const merged = offlineStore.mergeRemoteDmMessages(currentUser.uid, partnerUid, remoteMsgs);
      const hasUnseenIncoming = merged.some(
        (m) => m.senderId === partnerUid && m.recipientId === currentUser.uid && (!m.isRead || m.status !== 'seen')
      );
      if (hasUnseenIncoming) {
        const marked = offlineStore.markMessagesAsSeen(currentUser.uid, partnerUid);
        setChatMessages(marked);
        setConversations(offlineStore.getConversations(currentUser.uid));
        markDmSeenInFirebase(threadId, currentUser.uid, partnerUid, marked);
      } else {
        setChatMessages(merged);
      }
    });

    return () => unsubscribe();
  }, [activeConv?.participant?.uid, currentUser.uid, isGuest]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length, activeConv?.id]);

  const openConversation = (conv: Conversation) => {
    if (isGuest) return;
    const normalized = offlineStore.getOrCreateConversation(currentUser, conv.participant);
    setActiveConv(normalized);
    const history = offlineStore.getChatHistory(currentUser.uid, conv.participant.uid);
    setChatMessages(history);
    const updated = offlineStore.markMessagesAsSeen(currentUser.uid, conv.participant.uid);
    if (updated.length > 0) {
      setChatMessages(updated);
    }
    setConversations(offlineStore.getConversations(currentUser.uid));
  };

  useEffect(() => {
    if (initialChatUser && !isGuest && initialChatUser.uid !== currentUser.uid) {
      const conv = offlineStore.getOrCreateConversation(currentUser, {
        uid: initialChatUser.uid,
        name: initialChatUser.name,
        username: initialChatUser.username,
        avatarUrl: sanitizeAvatarUrl(initialChatUser.avatarUrl),
        isOnline: true,
        isVerified: initialChatUser.isVerified,
      });
      setConversations(offlineStore.getConversations(currentUser.uid));
      openConversation(conv);
    }
  }, [initialChatUser, currentUser.uid, isGuest]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !messageInput.trim() || !activeConv) return;

    const text = messageInput.trim();
    setMessageInput('');

    const { updatedConvs, newMsg, threadId } = offlineStore.sendMessage(
      activeConv.id,
      text,
      currentUser,
      activeConv.participant
    );
    setConversations(updatedConvs);
    setChatMessages((prev) => [...prev, newMsg]);

    // Sync to Firebase RTDB so the exact recipient receives it in real time
    syncDmMessageToFirebase(threadId, newMsg, currentUser, activeConv.participant);
    onSendMessage(threadId, text, activeConv.participant);
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.participant?.name || '').toLowerCase().includes(q) ||
      (c.participant?.username || '').toLowerCase().includes(q) ||
      (c.lastMessage?.text || '').toLowerCase().includes(q)
    );
  });

  // Search other registered accounts on the app to start a new 1-on-1 DM (like TikTok/Messenger)
  const existingPartnerUids = new Set(conversations.map((c) => c.participant.uid));
  const searchablePeople = searchQuery.trim()
    ? offlineStore
        .getRegisteredAccounts(currentUser.uid)
        .filter(
          (u) =>
            u.uid !== currentUser.uid &&
            !existingPartnerUids.has(u.uid) &&
            ((u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
              (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()))
        )
    : [];

  // Strictly private notifications belonging ONLY to currentUser.uid
  const privateNotifications = notifications.filter(
    (n) => n && n.recipientUid === currentUser.uid && n.actor?.uid !== currentUser.uid
  );

  const filteredNotifs = privateNotifications.filter((n) => {
    if (notifFilter === 'all') return true;
    return n.type === notifFilter;
  });

  const unreadNotifsCount = privateNotifications.filter((n) => !n.isRead).length;

  const formatNotifContent = (n: AppNotification) => {
    if (n.type === 'follow') {
      return t.startedFollowingYou;
    }
    if (n.type === 'like') {
      return t.likedYourVideo;
    }
    return n.content;
  };

  const timeAgo = (timestamp: number) => {
    const diffMin = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMin < 1) return t.justNow;
    if (diffMin < 60) return `${diffMin}${t.minAgo}`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}${t.hourAgo}`;
    return `${Math.floor(diffHours / 24)}${t.dayAgo}`;
  };

  if (isGuest) {
    return (
      <div className="w-full h-full min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center pb-24">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
          <MessageSquare className="w-7 h-7 text-[#fe2c55]" />
        </div>
        <h3 className="text-base font-extrabold text-white mb-1.5">
          {t.loginToUseMessenger}
        </h3>
        <p className="text-xs text-zinc-400 max-w-xs mb-5 leading-relaxed">
          {t.loginMessengerDesc}
        </p>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-6 py-2.5 rounded-full bg-[#fe2c55] hover:bg-[#e0264b] text-xs font-extrabold text-white flex items-center gap-2 shadow-lg active:scale-95 transition"
          >
            <LogIn className="w-4 h-4" />
            {t.loginOrCreateAccount}
          </button>
        )}
      </div>
    );
  }

  // Active 1-on-1 Chat Screen
  if (activeConv) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-slide-left">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-950 border-b border-zinc-800 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                setActiveConv(null);
                setConversations(offlineStore.getConversations(currentUser.uid));
              }}
              className="p-1.5 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div
              className="relative cursor-pointer shrink-0"
              onClick={() => onProfileClick?.(activeConv.participant.uid, activeConv.participant.username)}
            >
              <img
                src={sanitizeAvatarUrl(activeConv.participant.avatarUrl)}
                alt={activeConv.participant.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div
              className="cursor-pointer min-w-0"
              onClick={() => onProfileClick?.(activeConv.participant.uid, activeConv.participant.username)}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">
                  {activeConv.participant.name}
                </span>
                {activeConv.participant.isVerified && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#20D5EC] flex items-center justify-center text-black shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-zinc-400 block truncate">
                @{activeConv.participant.username}
              </span>
            </div>
          </div>
          <div className="text-[11px] font-bold text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 shrink-0">
            {t.ronginDm}
          </div>
        </div>

        {/* Strictly Isolated 1-on-1 Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-black via-zinc-950 to-black">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
              <img
                src={sanitizeAvatarUrl(activeConv.participant.avatarUrl)}
                alt={activeConv.participant.name}
                className="w-16 h-16 rounded-full object-cover border border-zinc-800 mb-3"
                referrerPolicy="no-referrer"
              />
              <p className="text-sm font-bold text-white">{activeConv.participant.name}</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                @{activeConv.participant.username} — {t.startConversationPrompt}
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.uid;
              const isSeen = msg.status === 'seen' || msg.isRead;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <img
                      src={sanitizeAvatarUrl(activeConv.participant.avatarUrl)}
                      alt={activeConv.participant.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-zinc-700"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                      isMe
                        ? 'bg-gradient-to-r from-[#fe2c55] to-[#f72585] text-white rounded-br-xs'
                        : 'bg-zinc-800 text-zinc-100 rounded-bl-xs border border-zinc-700/50'
                    }`}
                  >
                    {msg.sharedPost && (
                      <div
                        onClick={() => {
                          if (msg.sharedPost?.id && onSelectSharedPost) {
                            setActiveConv(null);
                            onSelectSharedPost(msg.sharedPost.id);
                          }
                        }}
                        className="mb-2 rounded-xl overflow-hidden bg-black/50 border border-white/15 cursor-pointer"
                      >
                        <div className="relative aspect-[9/14] max-h-52 w-44 bg-zinc-900">
                          {msg.sharedPost.thumbnailUrl ? (
                            <img
                              src={msg.sharedPost.thumbnailUrl}
                              alt={msg.sharedPost.caption}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={msg.sharedPost.videoUrl}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
                            <span className="self-start px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-bold text-white">
                              @{msg.sharedPost.username}
                            </span>
                            <div className="flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white">
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </div>
                            </div>
                            <p className="text-[10px] text-zinc-100 line-clamp-2 font-medium">
                              {msg.sharedPost.caption}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="break-words">{msg.text}</p>

                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                        isMe ? 'text-white/80' : 'text-zinc-400'
                      }`}
                    >
                      <span>{timeAgo(msg.timestamp)}</span>
                      {isMe && (
                        <span title={isSeen ? t.seenStatus : t.sentStatus}>
                          {isSeen ? (
                            <span className="flex items-center text-[#25F4EE] font-bold">
                              <CheckCheck className="w-3.5 h-3.5 stroke-[2.8]" />
                            </span>
                          ) : (
                            <span className="flex items-center text-white/70">
                              <Check className="w-3.5 h-3.5 stroke-[2.2]" />
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={t.typeMessage}
            className="flex-1 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#fe2c55] transition"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="w-10 h-10 rounded-full bg-[#fe2c55] disabled:opacity-40 text-white flex items-center justify-center active:scale-95 transition shadow-lg shadow-[#fe2c55]/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Inbox Tabs Overview
  return (
    <div className="w-full h-full min-h-screen bg-black text-white overflow-y-auto pb-24 select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`text-sm font-extrabold pb-1 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'messages' ? 'text-white border-white' : 'text-zinc-500 border-transparent'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.messagesTab}
            {conversations.some((c) => c.unreadCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-[#fe2c55]" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('notifications');
              onMarkNotificationsRead();
            }}
            className={`relative text-sm font-extrabold pb-1 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'notifications' ? 'text-white border-white' : 'text-zinc-500 border-transparent'
            }`}
          >
            <Bell className="w-4 h-4" />
            {t.notificationsTab}
            {unreadNotifsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#fe2c55] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Messages Tab Content */}
      {activeTab === 'messages' && (
        <div className="p-4 space-y-3">
          {/* Search Bar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-2">
            <Search className="w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPeoplePlaceholder}
              className="bg-transparent outline-none flex-1 text-white placeholder-zinc-500"
            />
          </div>

          {/* Quick Chat Row (when conversations exist) */}
          {conversations.length > 0 && !searchQuery.trim() && (
            <div className="mb-3">
              <div className="text-[11px] font-bold text-zinc-400 mb-2">
                {t.recentChats}
              </div>
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {conversations.slice(0, 10).map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="flex flex-col items-center gap-1 shrink-0 cursor-pointer active:scale-95 transition"
                  >
                    <div className="relative">
                      <img
                        src={sanitizeAvatarUrl(conv.participant.avatarUrl)}
                        alt={conv.participant.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#fe2c55] border-2 border-black text-[9px] font-extrabold text-white flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-300 font-semibold truncate w-14 text-center">
                      {(conv.participant?.name || conv.participant?.username || 'User').split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-User Conversation List */}
          <div className="space-y-1 divide-y divide-zinc-900">
            {filteredConversations.length === 0 && searchablePeople.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                {t.noMessagesFound}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSeen = conv.lastMessage?.status === 'seen' || conv.lastMessage?.isRead;
                const isSentByMe = conv.lastMessage?.senderId === currentUser.uid;

                return (
                  <div
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="pt-2.5 pb-2.5 first:pt-0 flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/60 active:bg-zinc-900 cursor-pointer transition"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={sanitizeAvatarUrl(conv.participant.avatarUrl)}
                        alt={conv.participant.name}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs font-bold text-white truncate">
                            {conv.participant.name}
                          </span>
                          {conv.participant.isVerified && (
                            <span className="w-3 h-3 rounded-full bg-[#20D5EC] flex items-center justify-center text-black shrink-0">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        {conv.lastMessage?.timestamp && (
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {timeAgo(conv.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                          {isSentByMe && (
                            <span className="shrink-0">
                              {isSeen ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#25F4EE] inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-zinc-500 inline" />
                              )}
                            </span>
                          )}
                          <p className={`truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : 'text-zinc-400'}`}>
                            {conv.lastMessage?.text || `@${conv.participant.username}`}
                          </p>
                        </div>

                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 min-w-4 h-4 rounded-full bg-[#fe2c55] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Start New Chat From Search Results */}
          {searchablePeople.length > 0 && (
            <div className="pt-3 border-t border-zinc-900 space-y-2">
              <p className="text-[11px] font-bold text-zinc-500 px-1">
                {t.startNewChat}
              </p>
              {searchablePeople.map((person) => (
                <div
                  key={person.uid}
                  onClick={() => {
                    const conv = offlineStore.getOrCreateConversation(currentUser, {
                      uid: person.uid,
                      name: person.name,
                      username: person.username,
                      avatarUrl: sanitizeAvatarUrl(person.avatarUrl),
                      isVerified: person.isVerified,
                    });
                    setSearchQuery('');
                    openConversation(conv);
                  }}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-zinc-900/60 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={sanitizeAvatarUrl(person.avatarUrl)}
                      alt={person.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{person.name}</p>
                      <p className="text-[11px] text-zinc-400 truncate">@{person.username}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#fe2c55]/15 text-[#fe2c55] text-[11px] font-bold shrink-0">
                    {t.messageBtn}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab Content */}
      {activeTab === 'notifications' && (
        <div className="p-4 space-y-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: t.allFilter },
              { id: 'like', label: t.likesFilter },
              { id: 'comment', label: t.commentsFilter },
              { id: 'follow', label: t.followersFilter },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setNotifFilter(f.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  notifFilter === f.id
                    ? 'bg-[#fe2c55] text-white shadow-md'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Private Per-User Notifications List */}
          <div className="space-y-2.5">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                {t.noPrivateNotifications}
              </div>
            ) : (
              filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => onProfileClick?.(n.actor.uid, n.actor.username)}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:bg-zinc-900 cursor-pointer transition"
                >
                  <img
                    src={sanitizeAvatarUrl(n.actor.avatarUrl)}
                    alt={n.actor.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white leading-snug">
                      <span className="font-bold">{n.actor.name}</span>{' '}
                      <span className="text-zinc-300">{formatNotifContent(n)}</span>
                    </p>
                    <span className="text-[10px] text-zinc-500 mt-0.5 block">
                      {timeAgo(n.timestamp)}
                    </span>
                  </div>
                  {n.post?.thumbnailUrl && (
                    <img
                      src={n.post.thumbnailUrl}
                      alt="Post"
                      className="w-10 h-12 rounded object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
