import React, { useState, useEffect } from 'react';
import { UserProfile, PostVideo } from '../types';
import { getResolvedPrivacy, offlineStore, sanitizeAvatarUrl } from '../lib/offlineStore';
import {
  Grid3X3,
  Bookmark,
  Lock,
  Unlock,
  Share2,
  Settings,
  Film,
  BarChart2,
  ExternalLink,
  Play,
  Check,
  Moon,
  Sun,
  LogOut,
  UserPlus,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Globe,
  Menu,
  X,
  Info,
  User,
  MapPin,
  Mail,
  Phone,
  Cake,
  Calendar,
  AtSign,
  EyeOff,
  Shield,
} from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { PersonalInfoModal } from './PersonalInfoModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { CreatorDashboard } from './CreatorDashboard';
import { useLanguage } from '../lib/languageContext';

interface ProfileViewProps {
  user: UserProfile;
  posts: PostVideo[];
  isOwnProfile?: boolean;
  viewerUid?: string;
  onUpdateProfile: (updated: UserProfile) => void;
  onSelectPost: (post: PostVideo) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onBack?: () => void;
  onFollowToggle?: (userId: string) => void;
  onOpenMessage?: (user: UserProfile) => void;
  isLoggedIn?: boolean;
  onDeletePost?: (postId: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  posts,
  isOwnProfile = true,
  viewerUid,
  onUpdateProfile,
  onSelectPost,
  theme,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  onBack,
  onFollowToggle,
  onOpenMessage,
  isLoggedIn = true,
  onDeletePost,
}) => {
  const { language, currentLanguageInfo, openLanguageModal, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'videos' | 'about' | 'saved' | 'private'>('videos');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [followers, setFollowers] = useState(user.followers || 0);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const privacy = getResolvedPrivacy(user);
  const canViewLockedContent = isOwnProfile || offlineStore.canViewUserProfile(user, viewerUid);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user.avatarUrl]);

  useEffect(() => {
    setActiveTab('videos');
  }, [user.uid]);

  useEffect(() => {
    setIsFollowing(user.isFollowing || false);
    setFollowers(user.followers || 0);
  }, [user.uid, user.isFollowing, user.followers]);

  const safeAvatarUrl = sanitizeAvatarUrl(user.avatarUrl);

  // Filter posts for the user (exclude private posts when viewing another profile)
  const userVideos = posts.filter(
    (p) =>
      (p.userId === user.uid || p.username === user.username) &&
      (isOwnProfile || p.privacy !== 'private')
  );
  const privateVideos = posts.filter(
    (p) =>
      (p.userId === user.uid || p.username === user.username) &&
      p.privacy === 'private'
  );
  const savedVideos = posts.filter((p) => p.isSaved);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      const val = count / 1000000;
      return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
    }
    if (count >= 10000) {
      const val = count / 1000;
      return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/?u=${user.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} (@${user.username}) on TikTok`,
          text: user.bio,
          url: profileUrl,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    } catch {}
  };

  if (isDashboardOpen) {
    return (
      <CreatorDashboard
        user={user}
        posts={posts}
        onBack={() => setIsDashboardOpen(false)}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-black text-white overflow-y-auto pb-24 select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-3 py-3 bg-black/90 backdrop-blur-md border-b border-zinc-900">
        <div className="w-10 flex items-center justify-start">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-zinc-800 text-white active:scale-90 transition"
              title={t.backBtn}
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center gap-1.5 min-w-0 flex-1 px-2">
          <span className="font-extrabold text-sm text-white tracking-tight truncate">
            {user.name}
          </span>
          {user.isVerified && (
            <span className="w-3.5 h-3.5 rounded-full bg-[#20D5EC] flex items-center justify-center text-black shrink-0">
              <Check className="w-2 h-2 stroke-[3]" />
            </span>
          )}
        </div>
        <div className="w-10 flex items-center justify-end">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center active:scale-90 transition border border-zinc-800"
            title={t.menuLabel}
            aria-label={t.menuLabel}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right-Side Slide-In Drawer Menu (≡) like TikTok */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-[82%] max-w-[330px] h-full bg-[#121212] border-l border-zinc-800/80 shadow-2xl flex flex-col animate-slide-left overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800/80">
              <span className="text-sm font-extrabold text-white">
                {t.settingsAndMenu}
              </span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-4 py-3 space-y-5">
              {/* Section 1: Preferences */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 px-1 mb-2">
                  {t.appSettings}
                </p>
                <div className="divide-y divide-zinc-800/60">
                  {/* Language Switcher */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openLanguageModal();
                    }}
                    className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <Globe className="w-5 h-5 text-[#25F4EE]" />
                      <span className="text-sm font-semibold text-white">
                        {t.languageLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-[#3b82f6] flex items-center gap-1.5">
                        <span>{currentLanguageInfo.flag}</span>
                        <span>{currentLanguageInfo.nativeName}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  </button>

                  {/* Theme Switcher */}
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3.5">
                      {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Moon className="w-5 h-5 text-indigo-400" />
                      )}
                      <span className="text-sm font-semibold text-white">
                        {t.themeMode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-400">
                        {theme === 'dark' ? t.darkMode : t.lightMode}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 2: Creator & Profile Tools */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 px-1 mb-2">
                  {t.creatorAndProfileTools}
                </p>
                <div className="divide-y divide-zinc-800/60">
                  {/* Share Profile */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleShareProfile();
                    }}
                    className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <Share2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-white">
                        {t.shareProfile}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>

                  {isOwnProfile && (
                    <>
                      {/* Creator Dashboard */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDashboardOpen(true);
                        }}
                        className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <BarChart2 className="w-5 h-5 text-[#25F4EE]" />
                          <span className="text-sm font-semibold text-white">{t.creatorDashboard}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>

                      {/* Personal Info */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsPersonalInfoOpen(true);
                        }}
                        className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <User className="w-5 h-5 text-[#3b82f6]" />
                          <span className="text-sm font-semibold text-white">
                            {t.personalInfo}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>

                      {/* Edit Profile */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsEditOpen(true);
                        }}
                        className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <Settings className="w-5 h-5 text-zinc-300" />
                          <span className="text-sm font-semibold text-white">{t.editProfile}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>

                      {/* Password Change */}
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsChangePasswordOpen(true);
                        }}
                        className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block leading-tight">
                              {t.changePassword}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {t.updateYourPassword}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                      </button>

                      {/* Profile Lock */}
                      <div className="w-full py-3.5 px-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                            {user.isProfileLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-white block leading-tight">
                              {t.profileLock}
                            </span>
                            <span className="text-[11px] text-zinc-400 block truncate">
                              {user.isProfileLocked
                                ? t.onlyMutualFriendsView
                                : t.lockProfileSubtitle}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(user.isProfileLocked)}
                          onClick={() => {
                            const nextLocked = !user.isProfileLocked;
                            onUpdateProfile({
                              ...user,
                              isProfileLocked: nextLocked,
                            });
                            setStatusToast(
                              nextLocked ? t.profileLockedToast : t.profileUnlockedToast
                            );
                            setTimeout(() => setStatusToast(null), 2600);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ${
                            user.isProfileLocked
                              ? 'bg-[#2563eb] border-[#3b82f6]'
                              : 'bg-zinc-800 border-zinc-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4.5 w-4.5 transform rounded-full transition duration-200 mt-0.5 ${
                              user.isProfileLocked
                                ? 'translate-x-5 bg-white'
                                : 'translate-x-0.5 bg-zinc-400'
                            }`}
                          />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 3: Account */}
              {isOwnProfile && (onOpenAuth || onLogout) && (
                <div>
                  <p className="text-[11px] font-bold text-zinc-500 px-1 mb-2">
                    {t.accountSection}
                  </p>
                  <div className="divide-y divide-zinc-800/60">
                    {onOpenAuth && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-zinc-900/50 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3.5">
                          <UserPlus className="w-5 h-5 text-[#fe2c55]" />
                          <span className="text-sm font-semibold text-white">
                            {t.switchOrAddAccount}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500" />
                      </button>
                    )}

                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full py-3.5 px-1 text-left flex items-center justify-between hover:bg-red-500/10 rounded-lg transition text-red-400"
                      >
                        <div className="flex items-center gap-3.5">
                          <LogOut className="w-5 h-5" />
                          <span className="text-sm font-semibold">{t.logout}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-red-400/70" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-bold text-white shadow-xl animate-fade-in flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-[#25F4EE]" /> {t.profileLinkCopied}
        </div>
      )}

      {/* Lock Status Toast */}
      {statusToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-zinc-900 border border-blue-500/40 text-xs font-bold text-white shadow-xl animate-fade-in flex items-center gap-1.5 whitespace-nowrap">
          <Shield className="w-3.5 h-3.5 text-[#3b82f6]" /> {statusToast}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="flex flex-col items-center pt-4 px-4 text-center">

        {/* Avatar with yellow/gold ring matching user screenshot */}
        <div className="relative mb-2.5">
          <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 shadow-xl">
            {avatarLoadFailed ? (
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-black text-white">
                {(user.name || 'U').trim().charAt(0).toUpperCase()}
              </div>
            ) : (
              <img
                src={safeAvatarUrl}
                alt={user.name}
                onError={() => setAvatarLoadFailed(true)}
                className="w-full h-full rounded-full object-cover bg-zinc-900"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          {user.isProfileLocked && (
            <span
              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#2563eb] border-2 border-black flex items-center justify-center text-white shadow"
              title={t.lockedProfileTitle}
            >
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}
        </div>

        {/* Username */}
        <h2 className="text-base font-black text-white flex items-center justify-center gap-1.5">
          {user.name}
        </h2>
        {canViewLockedContent && (isOwnProfile || !privacy.hideUsername) && (
          <span className="text-xs font-semibold text-zinc-400 mt-0.5 mb-1.5">
            @{user.username}
          </span>
        )}

        {/* Public Category Badge Only */}
        {canViewLockedContent && user.category && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center mb-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-[#fe2c55]">
              {user.category}
            </span>
          </div>
        )}

        {/* Stats Row (hidden when locked to non-friends) */}
        {canViewLockedContent && (
          <div className="flex items-center justify-center gap-8 my-2">
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-white">
                {user.following.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400">{t.following}</span>
            </div>
            <div className="w-[1px] h-5 bg-zinc-800" />
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-white">
                {formatCount(followers)}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400">{t.followers}</span>
            </div>
            <div className="w-[1px] h-5 bg-zinc-800" />
            <div className="flex flex-col items-center">
              <span className="text-base font-black text-white">
                {formatCount(user.likes)}
              </span>
              <span className="text-[11px] font-semibold text-zinc-400">{t.likesReceived}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 my-3 w-full max-w-xs justify-center">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-bold text-white border border-zinc-700 shadow-md transition"
              >
                {t.editProfile}
              </button>
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 active:scale-95 text-xs font-bold text-[#25F4EE] border border-zinc-700 shadow-md transition flex items-center gap-1.5"
                title="Creator Dashboard"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                {t.creatorDashboard}
              </button>
              {onOpenAuth && (
                <button
                  onClick={onOpenAuth}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-300 hover:text-white border border-zinc-700 shadow-md transition"
                  title={t.switchOrAddAccount}
                >
                  <UserPlus className="w-4 h-4 text-[#fe2c55]" />
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 w-full justify-center">
              {/* Follow Button: turns white with 'Following' when clicked */}
              {isFollowing ? (
                <button
                  onClick={() => {
                    if (!isLoggedIn && onOpenAuth) {
                      onOpenAuth();
                      return;
                    }
                    setIsFollowing(false);
                    setFollowers((prev) => Math.max(0, prev - 1));
                    onFollowToggle?.(user.uid);
                  }}
                  className="flex-1 py-2 px-5 rounded-md bg-white hover:bg-zinc-200 text-black font-extrabold text-[14px] active:scale-95 transition shadow"
                >
                  {t.followingBtn}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!isLoggedIn && onOpenAuth) {
                      onOpenAuth();
                      return;
                    }
                    setIsFollowing(true);
                    setFollowers((prev) => prev + 1);
                    onFollowToggle?.(user.uid);
                  }}
                  className="flex-1 py-2 px-5 rounded-md bg-[#fe2c55] hover:bg-[#e0264b] text-white font-extrabold text-[14px] active:scale-95 transition shadow"
                >
                  {t.follow}
                </button>
              )}

              {/* Message Button */}
              <button
                onClick={() => {
                  if (!isLoggedIn && onOpenAuth) {
                    onOpenAuth();
                    return;
                  }
                  onOpenMessage?.(user);
                }}
                className="flex-1 py-2 px-5 rounded-md bg-[#262626] hover:bg-[#333333] text-white font-bold text-[14px] active:scale-95 transition"
              >
                {t.messageBtn}
              </button>

              {/* Dropdown chevron */}
              <button
                className="p-2.5 rounded-md bg-[#262626] hover:bg-[#333333] text-white active:scale-95 transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bio & Website (hidden when profile locked to non-friends) */}
        {canViewLockedContent && (
          <>
            <p className="text-xs text-zinc-200 max-w-sm leading-relaxed my-2 break-words whitespace-pre-line text-center">
              {user.bio}
            </p>

            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-[#25F4EE] hover:underline mb-2"
              >
                <ExternalLink className="w-3 h-3" />
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </>
        )}
      </div>

      {/* Locked Profile Guard Screen for non-friends */}
      {!canViewLockedContent ? (
        <div className="mt-6 mx-4 p-6 rounded-2xl bg-[#16171a] border border-zinc-800/80 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0284c7] mx-auto flex items-center justify-center shadow">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-extrabold text-white">
            {t.thisProfileIsLocked}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {t.lockedProfileDesc}
          </p>
        </div>
      ) : (
        <>
          {/* Profile Tabs */}
          <div className="sticky top-12 z-20 flex items-center justify-around border-t border-b border-zinc-900 bg-black/95 backdrop-blur-md mt-2">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-3 flex justify-center border-b-2 transition ${
                activeTab === 'videos' ? 'border-white text-white' : 'border-transparent text-zinc-500'
              }`}
              title={t.myVideos}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-3 flex items-center justify-center gap-1.5 border-b-2 transition ${
                activeTab === 'about' ? 'border-white text-white' : 'border-transparent text-zinc-500'
              }`}
              title={t.aboutTab}
            >
              <Info className="w-5 h-5" />
            </button>

            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 py-3 flex justify-center border-b-2 transition ${
                    activeTab === 'saved' ? 'border-white text-white' : 'border-transparent text-zinc-500'
                  }`}
                  title={t.savedVideos}
                >
                  <Bookmark className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab('private')}
                  className={`flex-1 py-3 flex justify-center border-b-2 transition ${
                    activeTab === 'private' ? 'border-white text-white' : 'border-transparent text-zinc-500'
                  }`}
                  title={t.privateVideos}
                >
                  <Lock className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Video Grid (3 Columns) with real views & Pinned badges */}
          <div className="grid grid-cols-3 gap-0.5 p-0.5 min-h-[300px]">
            {activeTab === 'videos' && (
              userVideos.length === 0 ? (
                <div className="col-span-3 flex flex-col items-center justify-center py-16 text-zinc-500 text-xs">
                  <Film className="w-8 h-8 mb-2 opacity-50" />
                  {t.noVideosUploadedYet}
                </div>
              ) : (
            userVideos.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="relative aspect-[3/4] bg-zinc-900 overflow-hidden cursor-pointer group"
              >
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={post.videoUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    playsInline
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                
                {/* Pinned Badge */}
                {post.isPinned && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[2px] bg-[#fe2c55] text-white font-extrabold text-[9px] shadow uppercase tracking-wide">
                    {t.pinned}
                  </span>
                )}

                {/* Real View Count at bottom left */}
                <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                  <Play className="w-3 h-3 fill-white" />
                  {formatCount(post.views)}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'about' && (() => {
          const aboutRows: {
            id: string;
            label: string;
            value: string;
            icon: React.ReactNode;
            isHiddenFromOthers: boolean;
            isLink?: boolean;
          }[] = [];

          if (isOwnProfile || !privacy.hideUsername) {
            aboutRows.push({
              id: 'username',
              label: t.usernameLabel,
              value: `@${user.username}`,
              icon: <AtSign className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hideUsername,
            });
          }

          if (user.gender && (isOwnProfile || !privacy.hideGender)) {
            aboutRows.push({
              id: 'gender',
              label: t.genderLabel,
              value:
                user.gender === 'Male'
                  ? t.male
                  : user.gender === 'Female'
                  ? t.female
                  : user.gender === 'Other'
                  ? t.otherGender
                  : user.gender,
              icon: <User className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hideGender,
            });
          }

          if (user.location && (isOwnProfile || !privacy.hideLocation)) {
            aboutRows.push({
              id: 'location',
              label: t.locationLabel,
              value: user.location,
              icon: <MapPin className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hideLocation,
            });
          }

          if (user.dateOfBirth && (isOwnProfile || !privacy.hideBirthday)) {
            aboutRows.push({
              id: 'birthday',
              label: t.birthdayLabel,
              value: user.dateOfBirth,
              icon: <Cake className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hideBirthday,
            });
          }

          if (user.age !== undefined && (isOwnProfile || !privacy.hideAge)) {
            aboutRows.push({
              id: 'age',
              label: t.ageLabel,
              value: `${user.age} ${t.yearsLabel}`,
              icon: <Calendar className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hideAge,
            });
          }

          if (user.email && (isOwnProfile || !privacy.hideEmail)) {
            aboutRows.push({
              id: 'email',
              label: t.emailLabel,
              value: user.email,
              icon: <Mail className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hideEmail,
            });
          }

          if (user.phone && (isOwnProfile || !privacy.hidePhone)) {
            aboutRows.push({
              id: 'phone',
              label: t.phoneLabel,
              value: user.phone,
              icon: <Phone className="w-4 h-4 text-[#3b82f6]" />,
              isHiddenFromOthers: privacy.hidePhone,
            });
          }

          if (user.website) {
            aboutRows.push({
              id: 'website',
              label: t.websiteLabel,
              value: user.website,
              icon: <ExternalLink className="w-4 h-4 text-[#25F4EE]" />,
              isHiddenFromOthers: false,
              isLink: true,
            });
          }

          return (
            <div className="col-span-3 p-4 space-y-4">
              {/* Bio Card */}
              <div className="rounded-2xl bg-[#16171a] border border-zinc-800/80 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-xs font-bold text-zinc-400">
                    {t.aboutBioTitle}
                  </span>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line break-words">
                  {user.bio?.trim()
                    ? user.bio
                    : isOwnProfile
                    ? t.noBioAddedYet
                    : t.noBioProvided}
                </p>
              </div>

              {/* Visible Personal Details */}
              {aboutRows.length === 0 ? (
                <div className="rounded-2xl bg-[#16171a] border border-zinc-800/80 p-6 text-center text-xs text-zinc-500">
                  {t.noPublicDetails}
                </div>
              ) : (
                <div className="rounded-2xl bg-[#16171a] border border-zinc-800/80 divide-y divide-zinc-800/80">
                  {aboutRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                          {row.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-zinc-400">
                            {row.label}
                          </p>
                          {row.isLink ? (
                            <a
                              href={row.value}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-semibold text-[#25F4EE] hover:underline truncate block"
                            >
                              {row.value.replace(/^https?:\/\//, '')}
                            </a>
                          ) : (
                            <p className="text-sm font-semibold text-white truncate">
                              {row.value}
                            </p>
                          )}
                        </div>
                      </div>
                      {isOwnProfile && row.isHiddenFromOthers && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-semibold text-zinc-400 shrink-0">
                          <EyeOff className="w-3 h-3 text-[#3b82f6]" />
                          {t.hiddenLabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setIsPersonalInfoOpen(true)}
                  className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-[#3b82f6] transition active:scale-[0.99]"
                >
                  {t.editPersonalInfoPrivacyBtn}
                </button>
              )}
            </div>
          );
        })()}

        {activeTab === 'saved' && (
          savedVideos.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-zinc-500 text-xs">
              <Bookmark className="w-8 h-8 mb-2 opacity-50" />
              {t.noSavedVideos}
            </div>
          ) : (
            savedVideos.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="relative aspect-[3/4] bg-zinc-900 overflow-hidden cursor-pointer group"
              >
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={post.videoUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    playsInline
                  />
                )}
                <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                  <Play className="w-3 h-3 fill-white" />
                  {formatCount(post.views)}
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'private' && (
          privateVideos.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-zinc-500 text-xs">
              <Lock className="w-8 h-8 mb-2 opacity-50" />
              {t.noPrivateVideos}
            </div>
          ) : (
            privateVideos.map((post) => (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className="relative aspect-[3/4] bg-zinc-900 overflow-hidden cursor-pointer group"
              >
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <video
                    src={post.videoUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    playsInline
                  />
                )}
                <div className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-bold text-white drop-shadow">
                  <Play className="w-3 h-3 fill-white" />
                  {formatCount(post.views)}
                </div>
              </div>
            ))
          )
        )}
      </div>
        </>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        currentUser={user}
        onSave={onUpdateProfile}
      />

      {/* Personal Info & Privacy Modal */}
      <PersonalInfoModal
        isOpen={isPersonalInfoOpen}
        onClose={() => setIsPersonalInfoOpen(false)}
        currentUser={user}
        onSave={onUpdateProfile}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={user}
      />
    </div>
  );
};
