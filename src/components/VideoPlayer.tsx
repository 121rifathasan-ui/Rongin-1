import React, { useRef, useState, useEffect } from 'react';
import { PostVideo, UserProfile } from '../types';
import { useLanguage } from '../lib/languageContext';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Music, 
  Plus, 
  Check, 
  Disc3,
  Flame,
  TrendingUp,
  X
} from 'lucide-react';

interface VideoPlayerProps {
  post: PostVideo;
  isActive: boolean;
  currentUser?: UserProfile | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onCommentClick: (post: PostVideo) => void;
  onShareClick: (post: PostVideo) => void;
  onFollowToggle: (userId: string) => void;
  onProfileClick: (userId: string, username: string) => void;
  onViewRecord?: (postId: string, durationSec: number, incrementView: boolean) => void;
}

interface HeartPop {
  id: number;
  x: number;
  y: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  post,
  isActive,
  currentUser,
  onLike,
  onSave,
  onCommentClick,
  onShareClick,
  onFollowToggle,
  onProfileClick,
  onViewRecord,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [heartPops, setHeartPops] = useState<HeartPop[]>([]);
  const [showCenterPlay, setShowCenterPlay] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  const isOwner = currentUser && (post.userId === currentUser.uid || post.username === currentUser.username);

  const lastTapRef = useRef<number>(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSessionWatchSecRef = useRef<number>(0);
  const viewCountedRef = useRef<boolean>(false);
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;

  const pauseAllOtherFeedVideos = (activeElementId: string) => {
    try {
      const allFeedVideos = document.querySelectorAll<HTMLVideoElement>('video[data-feed-video="true"]');
      allFeedVideos.forEach((el) => {
        if (el.id !== activeElementId) {
          el.pause();
          el.muted = true;
        }
      });
    } catch {}
  };

  // Auto-play / pause based on active slide - strictly one active audio stream at a time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let gestureHandler: (() => void) | null = null;

    const removeGestureListeners = () => {
      if (gestureHandler) {
        window.removeEventListener('pointerdown', gestureHandler);
        window.removeEventListener('touchstart', gestureHandler);
        window.removeEventListener('click', gestureHandler);
        gestureHandler = null;
      }
    };

    if (isActive) {
      pauseAllOtherFeedVideos(video.id);
      setHasError(false);
      video.currentTime = 0;
      currentSessionWatchSecRef.current = 0;
      viewCountedRef.current = false;

      // Start with audio enabled
      video.muted = false;
      setIsMuted(false);

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (cancelled || !isActiveRef.current) {
              video.pause();
              video.muted = true;
              return;
            }
            pauseAllOtherFeedVideos(video.id);
            setIsPlaying(true);
            setShowCenterPlay(false);
          })
          .catch(() => {
            if (cancelled || !isActiveRef.current) return;
            // If browser restricted initial unmuted autoplay, fallback to muted then unmute on first gesture
            video.muted = true;
            setIsMuted(true);
            video
              .play()
              .then(() => {
                if (cancelled || !isActiveRef.current) {
                  video.pause();
                  video.muted = true;
                  return;
                }
                setIsPlaying(true);
                setShowCenterPlay(false);
              })
              .catch(() => {
                if (!cancelled) {
                  setIsPlaying(false);
                  setShowCenterPlay(true);
                }
              });

            gestureHandler = () => {
              removeGestureListeners();
              if (cancelled || !isActiveRef.current || !videoRef.current) return;
              pauseAllOtherFeedVideos(videoRef.current.id);
              videoRef.current.muted = false;
              setIsMuted(false);
              videoRef.current.play().catch(() => {});
            };

            window.addEventListener('pointerdown', gestureHandler, { once: true });
            window.addEventListener('touchstart', gestureHandler, { once: true });
            window.addEventListener('click', gestureHandler, { once: true });
          });
      }
    } else {
      video.pause();
      video.muted = true;
      setIsPlaying(false);
      setIsMuted(true);
      currentSessionWatchSecRef.current = 0;
      viewCountedRef.current = false;
    }

    return () => {
      cancelled = true;
      removeGestureListeners();
      video.pause();
      video.muted = true;
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
    };
  }, [isActive, post.id]);

  // Track watch time: ONLY trigger 1 view if watched >= 3 seconds!
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && isPlaying) {
      interval = setInterval(() => {
        currentSessionWatchSecRef.current += 1;
        const currentSec = currentSessionWatchSecRef.current;

        // Exactly when reaching 3 seconds of continuous playback, record exactly 1 view!
        if (currentSec === 3 && !viewCountedRef.current) {
          viewCountedRef.current = true;
          if (onViewRecord) {
            onViewRecord(post.id, 3, true);
          }
        } else if (currentSec > 3 && currentSec % 2 === 1) {
          // Send subsequent watch duration updates without adding extra views
          if (onViewRecord) {
            onViewRecord(post.id, 2, false);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPlaying, post.id, onViewRecord]);

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const prog = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(prog);
    }
  };

  const togglePlayPause = () => {
    if (!isActiveRef.current) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      pauseAllOtherFeedVideos(video.id);
      video.play().then(() => {
        if (!isActiveRef.current) {
          video.pause();
          video.muted = true;
          return;
        }
        setIsPlaying(true);
        setShowCenterPlay(false);
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      setShowCenterPlay(true);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Handle double tap for heart animation and like
  const handleTouchOrClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLast = now - lastTapRef.current;

    if (timeSinceLast < 280) {
      // Double tap!
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      const x = rect ? e.clientX - rect.left : e.clientX;
      const y = rect ? e.clientY - rect.top : e.clientY;

      const newHeart: HeartPop = { id: Date.now() + Math.random(), x, y };
      setHeartPops((prev) => [...prev, newHeart]);

      setTimeout(() => {
        setHeartPops((prev) => prev.filter((h) => h.id !== newHeart.id));
      }, 900);

      if (!post.isLiked) {
        onLike(post.id);
      }
    } else {
      // Single tap candidate
      singleTapTimerRef.current = setTimeout(() => {
        togglePlayPause();
      }, 300);
    }

    lastTapRef.current = now;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
  };

  return (
    <div
      ref={containerRef}
      id={`video-slide-${post.id}`}
      onClick={handleTouchOrClick}
      className="relative w-full h-full min-h-[100dvh] snap-start snap-always bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Background Video Element */}
      <video
        ref={videoRef}
        id={`feed-video-${post.id}`}
        data-feed-video="true"
        src={post.videoUrl}
        poster={post.thumbnailUrl}
        playsInline
        loop
        muted={!isActive || isMuted}
        preload="auto"
        onPlay={(e) => {
          setIsVideoLoaded(true);
          if (!isActiveRef.current) {
            e.currentTarget.pause();
            e.currentTarget.muted = true;
            return;
          }
          pauseAllOtherFeedVideos(e.currentTarget.id);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.readyState >= 2) {
            setIsVideoLoaded(true);
            setHasError(false);
          }
        }}
        onCanPlay={() => {
          setIsVideoLoaded(true);
          setHasError(false);
        }}
        onLoadedData={() => {
          setIsVideoLoaded(true);
          setHasError(false);
        }}
        onError={() => {
          setHasError(true);
          setIsVideoLoaded(true);
        }}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />

      {/* Loading Skeleton (translucent so poster remains visible) */}
      {!isVideoLoaded && !hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 pointer-events-none gap-3">
          <div className="w-10 h-10 border-4 border-zinc-700 border-t-[#fe2c55] rounded-full animate-spin" />
          <span className="text-xs font-semibold text-zinc-200 animate-pulse drop-shadow">{t.loadingVideo}</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-black to-zinc-950 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center mb-3">
            <Flame className="w-8 h-8 text-[#fe2c55]" />
          </div>
          <p className="text-sm font-semibold text-white mb-1">{t.cannotPlayVideo}</p>
          <p className="text-xs text-zinc-400 max-w-xs mb-4">{t.cannotPlayVideoDesc}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current) {
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            className="px-4 py-2 rounded-full bg-[#fe2c55] hover:bg-[#e0264b] text-white text-xs font-bold transition shadow-lg shadow-[#fe2c55]/20"
          >
            {t.retryBtn}
          </button>
        </div>
      )}

      {/* Center Play Button Overlay */}
      {showCenterPlay && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-18 h-18 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white scale-100 transition-transform animate-scale-up">
            <Play className="w-9 h-9 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Double Tap Bursting Hearts */}
      {heartPops.map((h) => (
        <div
          key={h.id}
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
          className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 animate-heart-pop"
        >
          <Heart className="w-24 h-24 text-[#fe2c55] fill-[#fe2c55] drop-shadow-[0_4px_20px_rgba(254,44,85,0.7)]" />
        </div>
      ))}

      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />

      {/* Top Sound Control */}
      <div className="absolute top-16 right-4 z-30 flex items-center gap-2">
        <button
          id={`sound-btn-${post.id}`}
          onClick={toggleSound}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center shadow-lg active:scale-90 transition"
          aria-label="Toggle Sound"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-white/90" /> : <Volume2 className="w-5 h-5 text-[#25F4EE]" />}
        </button>
      </div>

      {/* Bottom Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

      {/* Right Action Rail */}
      <div className="absolute right-2.5 sm:right-4 bottom-20 z-30 flex flex-col items-center gap-4 sm:gap-5 select-none">
        {/* Creator Avatar with Follow Button */}
        <div className="relative mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick(post.userId, post.username);
            }}
            className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-lg active:scale-95 transition bg-zinc-800"
          >
            <img
              src={post.avatarUrl}
              alt={post.username}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
          {/* Follow Plus Badge */}
          {!isOwner && !post.isFollowing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle(post.userId);
              }}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#fe2c55] text-white flex items-center justify-center border-2 border-black shadow-md hover:scale-110 active:scale-90 transition"
              title="Follow"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Like Button */}
        <button
          id={`like-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition"
        >
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/50 transition">
            <Heart
              className={`w-7 h-7 transition-colors drop-shadow-md ${
                post.isLiked ? 'text-[#fe2c55] fill-[#fe2c55] scale-110 animate-heart-bounce' : 'text-white stroke-[2.2]'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(post.likes)}
          </span>
        </button>

        {/* Comment Button */}
        <button
          id={`comment-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onCommentClick(post);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition"
        >
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/50 transition">
            <MessageCircle className="w-7 h-7 text-white stroke-[2.2] drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(post.commentsCount)}
          </span>
        </button>

        {/* Bookmark / Save Button */}
        <button
          id={`save-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onSave(post.id);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition"
        >
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/50 transition">
            <Bookmark
              className={`w-7 h-7 transition-colors drop-shadow-md ${
                post.isSaved ? 'text-[#ffb703] fill-[#ffb703] scale-105' : 'text-white stroke-[2.2]'
              }`}
            />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(post.saves)}
          </span>
        </button>

        {/* Share Button */}
        <button
          id={`share-btn-${post.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onShareClick(post);
          }}
          className="flex flex-col items-center gap-1 group active:scale-90 transition"
        >
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:bg-black/50 transition">
            <Share2 className="w-7 h-7 text-white stroke-[2.2] drop-shadow-md" />
          </div>
          <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            {formatCount(post.shares)}
          </span>
        </button>

        {/* Rotating Music Disc & Floating Notes */}
        <div className="relative mt-1">
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-tr from-zinc-900 to-zinc-700 border-[3px] border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
          >
            {post.musicCover ? (
              <img
                src={post.musicCover}
                alt="Music"
                className="w-6 h-6 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Disc3 className="w-6 h-6 text-[#fe2c55]" />
            )}
          </div>
          {isPlaying && (
            <div className="absolute -top-3 -left-2 pointer-events-none text-white/80 animate-note-float text-xs font-bold">
              ♪
            </div>
          )}
          {isPlaying && (
            <div className="absolute -top-5 -left-4 pointer-events-none text-[#25F4EE] animate-note-float-delayed text-sm font-bold">
              ♫
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Section */}
      <div className="absolute left-3 sm:left-4 right-20 bottom-18 sm:bottom-20 z-20 pointer-events-none select-none">
        {/* User Handle & Name */}
        <div className="flex items-center gap-2 mb-2 pointer-events-auto flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick(post.userId, post.username);
            }}
            className="flex items-center gap-1.5 hover:underline"
          >
            <span className="font-extrabold text-[15px] sm:text-[16px] text-white tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              @{post.username}
            </span>
            {post.isVerified && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#20D5EC] text-black">
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </span>
            )}
          </button>

          {!isOwner && !post.isFollowing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFollowToggle(post.userId);
              }}
              className="px-2.5 py-0.5 rounded-sm bg-transparent border border-white/60 text-[11px] font-bold text-white hover:bg-white/10 active:scale-95 transition"
            >
              {t.follow}
            </button>
          )}

          {/* RED Button (Strictly visible ONLY to video owner) */}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPromoteModalOpen(true);
              }}
              className="px-2.5 py-0.5 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[11px] font-bold shadow-lg shadow-red-600/40 border border-red-400/40 flex items-center gap-1 transition"
              title={t.promoteVideo}
            >
              <TrendingUp className="w-3 h-3" />
              {t.promoteVideo}
            </button>
          )}
        </div>

        {/* Caption */}
        <div className="text-[13px] sm:text-[14px] text-zinc-100 leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] pointer-events-auto mb-2.5">
          <p className={showFullCaption ? '' : 'line-clamp-2'}>
            {(post.caption || '').split(' ').map((word, idx) => {
              if (word.startsWith('#')) {
                return (
                  <span key={idx} className="font-bold text-white hover:underline mr-1 cursor-pointer">
                    {word}{' '}
                  </span>
                );
              }
              return word + ' ';
            })}
          </p>
          {(post.caption || '').length > 80 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullCaption(!showFullCaption);
              }}
              className="text-xs font-bold text-zinc-300 hover:text-white mt-0.5"
            >
              {showFullCaption ? t.seeLess : t.seeMore}
            </button>
          )}
        </div>

        {/* Music Sound Ticker */}
        <div className="flex items-center gap-2 pointer-events-auto max-w-[280px] sm:max-w-xs">
          <Music className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0" />
          <div className="overflow-hidden whitespace-nowrap text-xs font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="inline-block animate-marquee">
              {post.musicTitle} — {post.musicAuthor} ({t.originalSound}) &nbsp;&bull;&nbsp; {post.musicTitle} — {post.musicAuthor}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/20 z-30">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Promote Video Feature Modal */}
      {isPromoteModalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in pointer-events-auto"
        >
          <div className="w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-3xl p-5 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 text-red-500 mx-auto flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{t.promoteVideo}</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {t.featureComingSoon}
              </p>
            </div>
            <button
              onClick={() => setIsPromoteModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white shadow-lg shadow-red-600/30 active:scale-95 transition"
            >
              {t.doneBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
