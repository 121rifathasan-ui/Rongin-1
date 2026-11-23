import React, { useState, useEffect } from 'react';
import { PostVideo, UserProfile, Conversation, VideoReport } from '../types';
import { sanitizeAvatarUrl, offlineStore } from '../lib/offlineStore';
import { submitReportToFirebase } from '../lib/firebase';
import { ThumbnailPickerModal } from './ThumbnailPickerModal';
import { useLanguage } from '../lib/languageContext';
import {
  X,
  Link2,
  Check,
  Download,
  Flag,
  Trash2,
  Edit3,
  Search,
  Send,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Image as ImageIcon,
  Globe,
  Users,
  Lock,
  Film,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostVideo | null;
  currentUser: UserProfile | null;
  conversations: Conversation[];
  onSendToContacts?: (post: PostVideo, targetConversations: Conversation[]) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (postId: string, updates: Partial<PostVideo>) => void;
  onRequireAuth?: () => void;
}

// Authentic brand SVG icons matching the reference screenshots
const WhatsAppIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
    <path d="M16.04 4C9.42 4 4.04 9.37 4.04 16c0 2.11.55 4.17 1.6 5.99L4 28l6.17-1.62A11.93 11.93 0 0016.04 28c6.62 0 12-5.37 12-12S22.66 4 16.04 4zm6.99 16.94c-.29.82-1.71 1.57-2.37 1.67-.61.09-1.38.13-2.23-.14-.52-.16-1.19-.39-2.05-.76-3.61-1.56-5.96-5.21-6.14-5.45-.18-.24-1.47-1.95-1.47-3.72 0-1.77.93-2.64 1.26-3 .33-.36.72-.45.96-.45.24 0 .48.01.69.01.22 0 .52-.08.81.62.29.7.99 2.41 1.08 2.59.09.18.15.39.03.63-.12.24-.18.39-.36.6-.18.21-.38.47-.54.63-.18.18-.37.38-.16.74.21.36.94 1.55 2.02 2.51 1.39 1.24 2.56 1.62 2.92 1.8.36.18.57.15.78-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.33.12 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.87-.2 1.69z" />
  </svg>
);

const WhatsAppBusinessIcon = () => (
  <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
    <path d="M16.04 4C9.42 4 4.04 9.37 4.04 16c0 2.11.55 4.17 1.6 5.99L4 28l6.17-1.62A11.93 11.93 0 0016.04 28c6.62 0 12-5.37 12-12S22.66 4 16.04 4zm0 21.8c-1.88 0-3.71-.5-5.31-1.45l-.38-.23-3.66.96.98-3.57-.25-.39A9.77 9.77 0 016.24 16c0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8z" />
    <path d="M13 10.8h3.4c1.6 0 2.7.9 2.7 2.2 0 .9-.5 1.6-1.3 1.9 1 .3 1.6 1.1 1.6 2.2 0 1.5-1.2 2.5-3 2.5H13v-8.8zm2 3.5h1.2c.7 0 1.1-.4 1.1-.9s-.4-.9-1.1-.9H15v1.8zm0 3.6h1.4c.8 0 1.3-.4 1.3-1s-.5-1-1.3-1H15v2z" />
  </svg>
);

const FacebookIcon = ({ blue = false }: { blue?: boolean }) => (
  <svg viewBox="0 0 24 24" className={`w-7 h-7 ${blue ? 'fill-[#1877F2]' : 'fill-white'}`}>
    <path d="M15.12 5.32H17V2.14A26.11 26.11 0 0014.26 2c-2.72 0-4.58 1.66-4.58 4.7v2.62H6.61v3.56h3.07V22h3.68v-9.12h3.06l.46-3.56h-3.52V7.05c0-1.05.29-1.73 1.76-1.73z" />
  </svg>
);

const MessengerIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
    <path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.91 1.45 5.5 3.72 7.2V22l3.4-1.87c.91.25 1.87.38 2.88.38 5.52 0 10-4.14 10-9.25S17.52 2 12 2zm1.06 12.45l-2.54-2.71-4.96 2.71 5.46-5.79 2.61 2.71 4.89-2.71-5.46 5.79z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white -ml-0.5">
    <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
  </svg>
);

const SnapchatIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white stroke-black stroke-[1.2]">
    <path d="M12 2.8c-3.1 0-5.1 2.1-5.1 5.2 0 .7.1 1.4.2 2.1-.4.1-.9-.1-1.2-.1-.5 0-.8.3-.8.7 0 .5.6.8 1.2 1 .4.1.7.3.6.7-.3.9-1.1 2.2-2.8 2.8-.4.1-.6.4-.5.8.1.4.7.7 1.7.9.3.1.4.3.5.7.1.3.2.5.6.5.3 0 .8-.1 1.4-.1.7 0 1.4.2 2 .7.7.5 1.3.8 2.2.8s1.5-.3 2.2-.8c.6-.5 1.3-.7 2-.7.6 0 1.1.1 1.4.1.4 0 .5-.2.6-.5.1-.4.2-.6.5-.7 1-.2 1.6-.5 1.7-.9.1-.4-.1-.7-.5-.8-1.7-.6-2.5-1.9-2.8-2.8-.1-.4.2-.6.6-.7.6-.2 1.2-.5 1.2-1 0-.4-.3-.7-.8-.7-.3 0-.8.2-1.2.1.1-.7.2-1.4.2-2.1 0-3.1-2-5.2-5.1-5.2z" />
  </svg>
);

const SmsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 11H6V9h2v2zm5 0h-2V9h2v2zm5 0h-2V9h2v2z" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  post,
  currentUser,
  conversations,
  onSendToContacts,
  onDeletePost,
  onEditPost,
  onRequireAuth,
}) => {
  const { t } = useLanguage();
  const [view, setView] = useState<'main' | 'report' | 'edit' | 'deleteConfirm' | 'moreApps'>('main');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Report Form State
  const [reportSubject, setReportSubject] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  // Edit Post Form State
  const [editCaption, setEditCaption] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [isThumbPickerOpen, setIsThumbPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      setView('main');
      setSelectedContactIds([]);
      setShowContactSearch(false);
      setContactSearchQuery('');
      setCopied(false);
      setReportSubject('');
      setReportDetails('');
      setReportError('');
      setEditCaption(post.caption || '');
      setEditThumbnailUrl(post.thumbnailUrl || '');
      setEditPrivacy(post.privacy || 'public');
      setToastMsg(null);
    }
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const isOwnVideo = !!(
    currentUser &&
    (currentUser.uid === post.userId || currentUser.username === post.username)
  );

  const shareUrl = `${window.location.origin}/?video=${post.id}`;
  const shareText = `${post.caption ? post.caption + ' ' : ''}${shareUrl}`;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const toggleContact = (convId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleSendSelectedToMessenger = () => {
    if (!currentUser && onRequireAuth) {
      onRequireAuth();
      return;
    }
    const targets = conversations.filter((c) => selectedContactIds.includes(c.id));
    if (targets.length === 0) return;

    onSendToContacts?.(post, targets);
    showToast(`${targets.length} — ${t.sentToMessengerToast}`);
    setSelectedContactIds([]);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    showToast(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const openShareLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeOrMoreShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rongin - @${post.username}`,
          text: post.caption || 'এই দারুণ ভিডিওটি দেখুন!',
          url: shareUrl,
        });
        return;
      } catch {
        // If user cancels native share or not supported in iframe, show More Apps sheet
      }
    }
    setView('moreApps');
  };

  const handleDownloadVideo = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    showToast(t.downloadStartedToast);
    try {
      const response = await fetch(post.videoUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `rongin-video-${post.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      showToast(t.videoSavedDeviceToast);
    } catch {
      // Fallback for cross-origin URLs that don't expose CORS blob
      const downloadUrl = post.videoUrl.includes('res.cloudinary.com') && post.videoUrl.includes('/upload/')
        ? post.videoUrl.replace('/upload/', '/upload/fl_attachment/')
        : post.videoUrl;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `rongin-video-${post.id}.mp4`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast(t.downloadStartedToast);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject.trim()) {
      setReportError(t.reportSubjectPlaceholder);
      return;
    }
    if (!reportDetails.trim()) {
      setReportError(t.reportDetailsPlaceholder);
      return;
    }

    setReportError('');
    setIsSubmittingReport(true);

    const report: VideoReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      postId: post.id,
      postUrl: post.videoUrl,
      postCaption: post.caption || '',
      reportedUserId: post.userId,
      reportedUsername: post.username,
      reporterUserId: currentUser?.uid || 'guest',
      reporterUsername: currentUser?.username || 'guest',
      subject: reportSubject.trim(),
      details: reportDetails.trim(),
      status: 'pending',
      createdAt: Date.now(),
    };

    offlineStore.saveReportLocally(report);
    await submitReportToFirebase(report);
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    }).catch(() => {});

    setIsSubmittingReport(false);
    showToast(t.reportSubmittedToast);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleSaveEditPost = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = editCaption
      .split(/\s+/)
      .filter((w) => w.startsWith('#'))
      .map((t) => t.replace('#', '').trim())
      .filter(Boolean);

    onEditPost?.(post.id, {
      caption: editCaption.trim() || post.caption,
      thumbnailUrl: editThumbnailUrl || post.thumbnailUrl,
      musicCover: editThumbnailUrl || post.musicCover,
      privacy: editPrivacy,
      tags: tags.length ? tags : post.tags,
    });
    showToast(t.postUpdatedToast);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleConfirmDelete = () => {
    onDeletePost?.(post.id);
    showToast(t.videoDeletedToast);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!contactSearchQuery.trim()) return true;
    const q = contactSearchQuery.toLowerCase();
    return (
      (conv.participant?.name || '').toLowerCase().includes(q) ||
      (conv.participant?.username || '').toLowerCase().includes(q)
    );
  });

  const socialApps = [
    {
      id: 'copy',
      label: copied ? t.copied : t.copyLink,
      bgClass: copied ? 'bg-emerald-500' : 'bg-[#0095f6]',
      icon: copied ? <Check className="w-6 h-6 text-white stroke-[2.5]" /> : <Link2 className="w-6 h-6 text-white stroke-[2.2]" />,
      onClick: handleCopyLink,
    },
    {
      id: 'fb-lite',
      label: 'Lite',
      bgClass: 'bg-white',
      icon: <FacebookIcon blue />,
      onClick: () => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      bgClass: 'bg-[#25D366]',
      icon: <WhatsAppIcon />,
      onClick: () => openShareLink(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      bgClass: 'bg-[#1877F2]',
      icon: <FacebookIcon />,
      onClick: () => openShareLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
    },
    {
      id: 'messenger',
      label: 'Messenger',
      bgClass: 'bg-gradient-to-tr from-[#006AFF] to-[#00B2FF]',
      icon: <MessengerIcon />,
      onClick: () => openShareLink(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(shareUrl)}`),
    },
    {
      id: 'sms',
      label: 'SMS',
      bgClass: 'bg-[#2196F3]',
      icon: <SmsIcon />,
      onClick: () => {
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`;
      },
    },
    {
      id: 'email',
      label: 'Email',
      bgClass: 'bg-[#0288D1]',
      icon: <EmailIcon />,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(`Rongin Video - @${post.username}`)}&body=${encodeURIComponent(shareText)}`;
      },
    },
    {
      id: 'snapchat',
      label: 'Snapchat',
      bgClass: 'bg-[#FFFC00]',
      icon: <SnapchatIcon />,
      onClick: () => openShareLink(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`),
    },
    {
      id: 'wa-business',
      label: 'WhatsApp Business',
      bgClass: 'bg-[#25D366]',
      icon: <WhatsAppBusinessIcon />,
      onClick: () => openShareLink(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`),
    },
    {
      id: 'telegram',
      label: 'Telegram',
      bgClass: 'bg-[#26A5E4]',
      icon: <TelegramIcon />,
      onClick: () => openShareLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.caption || '')}`),
    },
    {
      id: 'more',
      label: t.moreApps,
      bgClass: 'bg-[#1D9BF0]',
      icon: <MoreHorizontal className="w-6 h-6 text-white" />,
      onClick: handleNativeOrMoreShare,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#161618] border-t border-zinc-800 rounded-t-3xl shadow-2xl z-10 animate-slide-up overflow-hidden text-white max-h-[88vh] flex flex-col">
        {/* Toast notification */}
        {toastMsg && (
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-bold text-white shadow-2xl flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#25F4EE]" />
            {toastMsg}
          </div>
        )}

        {/* ==================== VIEW 1: MAIN TIKTOK SHARE SHEET ==================== */}
        {view === 'main' && (
          <div className="flex flex-col">
            {/* Top Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <button
                type="button"
                onClick={() => setShowContactSearch((p) => !p)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                title={t.search}
              >
                <Search className="w-5 h-5" />
              </button>
              <h3 className="text-[15px] font-extrabold text-white">{t.sendToHeader}</h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optional Search Bar */}
            {showContactSearch && (
              <div className="px-4 pb-3">
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder={t.searchPeoplePlaceholder}
                  autoFocus
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fe2c55]"
                />
              </div>
            )}

            {/* ROW 1: Messenger Contacts (Select 1 or more to send directly) */}
            <div className="px-4 pb-4">
              {filteredConversations.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-3">
                  {t.noContactsFound}
                </p>
              ) : (
                <div className="flex items-start gap-4 overflow-x-auto scrollbar-none py-1">
                  {filteredConversations.map((conv) => {
                    const isSelected = selectedContactIds.includes(conv.id);
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => toggleContact(conv.id)}
                        className="flex flex-col items-center gap-1.5 w-16 shrink-0 group active:scale-95 transition"
                      >
                        <div
                          className={`relative w-14 h-14 rounded-full p-[2px] transition ${
                            isSelected
                              ? 'ring-2 ring-[#fe2c55] bg-[#fe2c55]'
                              : 'bg-transparent'
                          }`}
                        >
                          <img
                            src={sanitizeAvatarUrl(conv.participant.avatarUrl)}
                            alt={conv.participant.name}
                            className="w-full h-full rounded-full object-cover bg-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          {conv.participant.isOnline && !isSelected && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#10b981] border-2 border-[#161618]" />
                          )}
                          {isSelected && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#fe2c55] border-2 border-[#161618] flex items-center justify-center text-white shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-zinc-200 text-center line-clamp-2 leading-tight w-full">
                          {conv.participant.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ROW 2: Link Copy + Real Social Media Icons (NO Repost icon) */}
            <div className="px-4 py-3.5 border-t border-zinc-800/80">
              <div className="flex items-start gap-4 overflow-x-auto scrollbar-none">
                {socialApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={app.onClick}
                    className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition"
                  >
                    <div
                      className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md ${app.bgClass}`}
                    >
                      {app.icon}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-200 text-center leading-tight line-clamp-2 w-full">
                      {app.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ROW 3: Bottom Utilities (Own video: Delete + Edit Post + Download | Other's video: ONLY Report + Download) */}
            <div className="px-4 py-3.5 border-t border-zinc-800/80">
              <div className="flex items-start gap-5">
                {!isOwnVideo ? (
                  <>
                    {/* Report Button */}
                    <button
                      type="button"
                      onClick={() => setView('report')}
                      className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition">
                        <Flag className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-200 text-center leading-tight">
                        {t.report}
                      </span>
                    </button>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={handleDownloadVideo}
                      disabled={isDownloading}
                      className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition disabled:opacity-60"
                    >
                      <div className="w-13 h-13 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition">
                        {isDownloading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#25F4EE]" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-200 text-center leading-tight">
                        {t.downloadVideo}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Own Video: Delete Video */}
                    <button
                      type="button"
                      onClick={() => setView('deleteConfirm')}
                      className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 flex items-center justify-center text-red-400 transition">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-red-300 text-center leading-tight">
                        {t.deleteVideo}
                      </span>
                    </button>

                    {/* Own Video: Edit Post */}
                    <button
                      type="button"
                      onClick={() => setView('edit')}
                      className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition"
                    >
                      <div className="w-13 h-13 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-[#25F4EE] transition">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-200 text-center leading-tight">
                        {t.editVideo}
                      </span>
                    </button>

                    {/* Own Video: Download Video */}
                    <button
                      type="button"
                      onClick={handleDownloadVideo}
                      disabled={isDownloading}
                      className="flex flex-col items-center gap-1.5 w-16 shrink-0 active:scale-95 transition disabled:opacity-60"
                    >
                      <div className="w-13 h-13 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition">
                        {isDownloading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#25F4EE]" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-zinc-200 text-center leading-tight">
                        {t.downloadVideo}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic "Send" Button when 1+ Messenger contacts selected */}
            {selectedContactIds.length > 0 && (
              <div className="px-4 pb-5 pt-2 border-t border-zinc-800/80 bg-[#161618] animate-fade-in">
                <button
                  type="button"
                  onClick={handleSendSelectedToMessenger}
                  className="w-full py-3 rounded-2xl bg-[#fe2c55] hover:bg-[#e0264b] active:scale-95 text-sm font-black text-white shadow-lg shadow-[#fe2c55]/25 flex items-center justify-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  {t.sendBtn} ({selectedContactIds.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW 2: REPORT FORM (2 Fields + Submit -> Firebase) ==================== */}
        {view === 'report' && (
          <form onSubmit={handleSubmitReport} className="p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => setView('main')}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-[#fe2c55]" />
                {t.reportVideoTitle}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick subject chips */}
            <div className="flex flex-wrap gap-1.5">
              {[t.reportReason1, t.reportReason2, t.reportReason3, t.reportReason4, t.reportReason5].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReportSubject(reason)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      reportSubject === reason
                        ? 'bg-[#fe2c55]/20 border-[#fe2c55] text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {reason}
                  </button>
                )
              )}
            </div>

            {/* Field 1: Report Subject / Reason */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                {t.reportSubjectLabel} <span className="text-[#fe2c55]">*</span>
              </label>
              <input
                type="text"
                required
                value={reportSubject}
                onChange={(e) => setReportSubject(e.target.value)}
                placeholder={t.reportSubjectPlaceholder}
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fe2c55]"
              />
            </div>

            {/* Field 2: Large Detailed Description */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                {t.reportDetailsLabel} <span className="text-[#fe2c55]">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder={t.reportDetailsPlaceholder}
                maxLength={800}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fe2c55] resize-none leading-relaxed"
              />
            </div>

            {reportError && (
              <p className="text-xs text-red-400 font-semibold">{reportError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmittingReport}
              className="w-full py-3 rounded-2xl bg-[#fe2c55] hover:bg-[#e0264b] disabled:opacity-50 text-xs font-black text-white flex items-center justify-center gap-2 transition shadow-lg shadow-[#fe2c55]/25"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                t.submitBtn
              )}
            </button>
          </form>
        )}

        {/* ==================== VIEW 3: EDIT OWN POST (Caption + Thumbnail + Privacy) ==================== */}
        {view === 'edit' && (
          <form onSubmit={handleSaveEditPost} className="p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => setView('main')}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#25F4EE]" />
                {t.editPostTitle}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Caption + Thumbnail Preview */}
            <div className="flex gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={4}
                placeholder={t.captionPlaceholder}
                className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 resize-none outline-none leading-relaxed"
              />
              <button
                type="button"
                onClick={() => setIsThumbPickerOpen(true)}
                className="relative w-20 h-28 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 hover:border-[#fe2c55] shrink-0 group transition"
                title={t.changeThumbnail}
              >
                {editThumbnailUrl ? (
                  <img
                    src={editThumbnailUrl}
                    alt="Post thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={post.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                <span className="absolute bottom-1 left-1 right-1 text-center py-0.5 rounded bg-black/75 text-[9px] font-bold text-white group-hover:bg-[#fe2c55] transition">
                  {t.changeThumbnail}
                </span>
              </button>
            </div>

            {/* Thumbnail Change Shortcut Button */}
            <button
              type="button"
              onClick={() => setIsThumbPickerOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
            >
              <ImageIcon className="w-4 h-4 text-[#25F4EE]" />
              {t.changeThumbnailLong}
            </button>

            {/* Privacy Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                {t.whoCanViewLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'public', label: t.everyoneOpt, icon: Globe },
                  { id: 'friends', label: t.friendsOpt, icon: Users },
                  { id: 'private', label: t.onlyMeOpt, icon: Lock },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEditPrivacy(opt.id as any)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                        editPrivacy === opt.id
                          ? 'border-[#fe2c55] bg-[#fe2c55]/15 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setView('main')}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#fe2c55] hover:bg-[#e0264b] text-xs font-black text-white flex items-center justify-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                {t.updateBtn}
              </button>
            </div>
          </form>
        )}

        {/* ==================== VIEW 4: DELETE CONFIRMATION ==================== */}
        {view === 'deleteConfirm' && (
          <div className="p-5 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">{t.deleteVideoConfirmTitle}</h3>
              <p className="text-xs text-zinc-400 mt-1">
                {t.deleteVideoConfirmDesc}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setView('main')}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
              >
                {t.noKeepIt}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white transition"
              >
                {t.yesDeleteIt}
              </button>
            </div>
          </div>
        )}

        {/* ==================== VIEW 5: MORE SOCIAL APPS FALLBACK SHEET ==================== */}
        {view === 'moreApps' && (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <button
                type="button"
                onClick={() => setView('main')}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-sm font-extrabold text-white">{t.moreShareOptions}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {socialApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={app.onClick}
                  className="flex flex-col items-center gap-1.5 active:scale-95 transition"
                >
                  <div className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md ${app.bgClass}`}>
                    {app.icon}
                  </div>
                  <span className="text-[11px] font-medium text-zinc-200 text-center leading-tight line-clamp-2">
                    {app.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setView('main')}
              className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
            >
              {t.cancel}
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail Picker Modal for Post Edit */}
      <ThumbnailPickerModal
        isOpen={isThumbPickerOpen}
        onClose={() => setIsThumbPickerOpen(false)}
        videoUrl={post.videoUrl}
        currentThumbnail={editThumbnailUrl}
        onSelectThumbnail={(thumb) => setEditThumbnailUrl(thumb)}
      />
    </div>
  );
};
