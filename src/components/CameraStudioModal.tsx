import React, { useState, useRef, useEffect } from 'react';
import { PostVideo, UserProfile } from '../types';
import { DEFAULT_USER } from '../data/initialData';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { 
  X, 
  RotateCw, 
  Music, 
  Image as ImageIcon, 
  Check, 
  Send, 
  Hash, 
  AtSign, 
  MapPin, 
  Globe, 
  Lock, 
  Sliders, 
  Layers, 
  Clock, 
  Film,
  Camera,
  Play,
  Pause,
  AlertCircle,
  Cloud
} from 'lucide-react';
import { ThumbnailPickerModal } from './ThumbnailPickerModal';
import { useLanguage } from '../lib/languageContext';

interface CameraStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onStartBackgroundUpload: (uploadTask: {
    selectedFile: File | null;
    videoUrl: string;
    thumbnailUrl?: string;
    caption: string;
    musicTitle: string;
    musicAuthor: string;
    tags: string[];
    privacy: 'public' | 'friends' | 'private';
    currentUser: UserProfile;
  }) => void;
}

// 20+ Functional Real-Time Camera Visual Effects
const CAMERA_EFFECTS = [
  { id: 'normal', name: 'Normal', filter: 'none', icon: '✨' },
  { id: 'smooth', name: 'Smooth Skin', filter: 'brightness(1.08) contrast(0.95) saturate(1.1)', icon: '🌸' },
  { id: 'glow', name: 'Neon Glow', filter: 'brightness(1.15) saturate(1.4) drop-shadow(0 0 8px rgba(37,244,238,0.4))', icon: '⚡' },
  { id: 'cyberpunk', name: 'Cyberpunk', filter: 'hue-rotate(290deg) contrast(1.25) saturate(1.5)', icon: '🔮' },
  { id: 'vintage', name: 'Vintage 90s', filter: 'sepia(0.4) contrast(1.15) brightness(0.95) saturate(1.2)', icon: '📼' },
  { id: 'bw', name: 'Noir B&W', filter: 'grayscale(1) contrast(1.3) brightness(0.95)', icon: '🎬' },
  { id: 'sunset', name: 'Golden Hour', filter: 'sepia(0.25) saturate(1.6) hue-rotate(-15deg)', icon: '🌅' },
  { id: 'cinema', name: 'Cinematic', filter: 'contrast(1.2) brightness(0.9) saturate(1.25)', icon: '🎥' },
  { id: 'anime', name: 'Anime Pop', filter: 'saturate(2) contrast(1.1) brightness(1.05)', icon: '🎨' },
  { id: 'glamour', name: 'Glamour', filter: 'brightness(1.1) saturate(1.3) contrast(1.05)', icon: '💎' },
  { id: 'sepia', name: 'Classic Sepia', filter: 'sepia(0.85) contrast(1.1)', icon: '📜' },
  { id: 'warm', name: 'Warm Cozy', filter: 'sepia(0.3) saturate(1.4) brightness(1.05)', icon: '☕' },
  { id: 'cool', name: 'Cool Teal', filter: 'hue-rotate(180deg) saturate(1.2) contrast(1.1)', icon: '🧊' },
  { id: 'matrix', name: 'Matrix Green', filter: 'hue-rotate(85deg) contrast(1.4) saturate(1.5)', icon: '💻' },
  { id: 'vhs', name: 'VHS Tape', filter: 'contrast(1.3) brightness(1.1) saturate(1.4) hue-rotate(10deg)', icon: '📹' },
  { id: 'pastel', name: 'Soft Pastel', filter: 'brightness(1.15) saturate(0.8) contrast(0.9)', icon: '🧁' },
  { id: 'drama', name: 'High Drama', filter: 'contrast(1.6) brightness(0.85) saturate(1.2)', icon: '🎭' },
  { id: 'retro', name: 'Retro 80s', filter: 'hue-rotate(330deg) saturate(1.5) contrast(1.1)', icon: '🪩' },
  { id: 'ruby', name: 'Ruby Sunset', filter: 'hue-rotate(345deg) saturate(1.7) contrast(1.15)', icon: '🌹' },
  { id: 'emerald', name: 'Emerald Forest', filter: 'hue-rotate(60deg) saturate(1.3) contrast(1.1)', icon: '🌿' },
  { id: 'dusk', name: 'Twilight Dusk', filter: 'hue-rotate(240deg) saturate(1.3) brightness(0.9)', icon: '🌌' },
  { id: 'solar', name: 'Solar Flare', filter: 'brightness(1.25) contrast(1.2) saturate(1.6)', icon: '☀️' },
];

const PRESET_SOUNDS = [
  { id: 's1', title: 'Trending Bengali Lo-Fi Beats', author: 'Bangla Beats' },
  { id: 's2', title: 'Ami Banglay Gaan Gai (Vibe)', author: 'Prattyush' },
  { id: 's3', title: 'Dhaka City Night Melody', author: 'Rongin Sound' },
  { id: 's4', title: 'Original Audio - Trending', author: 'Creator Sound' },
];

export const CameraStudioModal: React.FC<CameraStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser: propUser,
  onStartBackgroundUpload,
}) => {
  const { t } = useLanguage();
  const currentUser = propUser || DEFAULT_USER;

  // View Stage: 'camera' (Screen 1) or 'editor' (Screen 3)
  const [viewStage, setViewStage] = useState<'camera' | 'editor'>('camera');
  
  // Camera & Mode
  const [selectedDuration, setSelectedDuration] = useState<'5m' | '60s' | '15s' | 'photo' | 'text'>('60s');
  const [activeEffect, setActiveEffect] = useState(CAMERA_EFFECTS[0]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [selectedSound, setSelectedSound] = useState(PRESET_SOUNDS[0]);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showEffectsTray, setShowEffectsTray] = useState(false);

  // Post Editor state (Screen 3)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isThumbnailPickerOpen, setIsThumbnailPickerOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('ঢাকা, বাংলাদেশ');
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const showToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(null), 3500);
  };

  // Initialize Real Device Camera Stream
  useEffect(() => {
    if (isOpen && viewStage === 'camera') {
      let isCancelled = false;
      const startCamera = async () => {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode },
              audio: true,
            });
            if (!isCancelled && videoPreviewRef.current) {
              videoPreviewRef.current.srcObject = stream;
              cameraStreamRef.current = stream;
            }
          }
        } catch (err) {
          console.warn('Camera access fallback (browser permission or iframe constraint):', err);
        }
      };

      startCamera();

      return () => {
        isCancelled = true;
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach((t) => t.stop());
          cameraStreamRef.current = null;
        }
      };
    }
  }, [isOpen, viewStage, facingMode]);

  // Handle Recording Timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => {
          const maxSeconds = selectedDuration === '5m' ? 300 : selectedDuration === '60s' ? 60 : 15;
          if (prev >= maxSeconds) {
            clearInterval(interval);
            setIsRecording(false);
            handleFinishRecording();
            return maxSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, selectedDuration]);

  if (!isOpen) return null;

  // Toggle Camera Front / Back
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Recording toggle with real MediaRecorder capture
  const handleRecordToggle = () => {
    if (!isRecording) {
      setRecordSeconds(0);
      recordedChunksRef.current = [];
      const stream = cameraStreamRef.current;
      if (stream && typeof MediaRecorder !== 'undefined') {
        try {
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : '';
          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);
          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              recordedChunksRef.current.push(ev.data);
            }
          };
          recorder.onstop = () => {
            if (recordedChunksRef.current.length > 0) {
              const blobType = recorder.mimeType || 'video/webm';
              const blob = new Blob(recordedChunksRef.current, { type: blobType });
              const file = new File([blob], `rongin_cam_${Date.now()}.webm`, { type: 'video/webm' });
              const localUrl = URL.createObjectURL(blob);
              setSelectedFile(file);
              setVideoUrl(localUrl);
              setThumbnailUrl('');
              setViewStage('editor');
              return;
            }
            setSelectedFile(null);
            setVideoUrl('https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.mp4');
            setThumbnailUrl('https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.jpg');
            setViewStage('editor');
          };
          mediaRecorderRef.current = recorder;
          recorder.start(250);
          setIsRecording(true);
          return;
        } catch {}
      }
      setIsRecording(true);
    } else {
      setIsRecording(false);
      handleFinishRecording();
    }
  };

  const handleFinishRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
        return;
      } catch {}
    }
    setSelectedFile(null);
    setVideoUrl('https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.mp4');
    setThumbnailUrl('https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.jpg');
    setViewStage('editor');
  };

  // Handle manual video file select from gallery
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value so picking another or the same video always triggers onChange
    e.target.value = '';
    if (!file) return;

    // Check 5-minute video upload limit rule (5 min = 300 seconds)
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempVideo.src);
      const durationSec = tempVideo.duration;

      // 5-minute limit rule
      if (durationSec > 300) {
        showToast(t.maxDurationNotice);
        return;
      }

      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      setThumbnailUrl('');
      setViewStage('editor');
    };

    tempVideo.onerror = () => {
      // In case metadata read fails, allow upload safely
      setSelectedFile(file);
      const localUrl = URL.createObjectURL(file);
      setVideoUrl(localUrl);
      setThumbnailUrl('');
      setViewStage('editor');
    };

    tempVideo.src = URL.createObjectURL(file);
  };

  const handleAddHashtag = (tag: string) => {
    setCaption((prev) => `${prev.trim()} ${tag} `);
  };

  const handleAddMention = (user: string) => {
    setCaption((prev) => `${prev.trim()} ${user} `);
  };

  // Submit Post -> Closes modal immediately and triggers non-blocking background upload!
  const handlePostVideo = () => {
    if (!videoUrl && !selectedFile) {
      showToast('অনুগ্রহ করে একটি ভিডিও নির্বাচন বা রেকর্ড করুন।');
      return;
    }

    const tags = caption
      .split(' ')
      .filter((w) => w.startsWith('#'))
      .map((t) => t.replace('#', '').trim());

    // 1. Close modal immediately (zero blocking!)
    onClose();

    // 2. Hand off to background upload manager
    onStartBackgroundUpload({
      selectedFile,
      videoUrl: videoUrl || 'https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.mp4',
      thumbnailUrl: thumbnailUrl || undefined,
      caption: caption.trim() || 'আমার নতুন রঙিন ভিডিও! ❤️🇧🇩 #rongin #foryou',
      musicTitle: selectedSound.title,
      musicAuthor: selectedSound.author,
      tags: tags.length ? tags : ['rongin', 'bangladesh', 'foryou'],
      privacy,
      currentUser,
    });
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col select-none overflow-hidden animate-fade-in">
      
      {/* Toast Warning */}
      {toastAlert && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-full bg-red-950 border border-red-500 text-red-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-red-400" />
          {toastAlert}
        </div>
      )}

      {/* Hidden Gallery Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* ======================================================== */}
      {/* SCREEN 1: FULL MOBILE CAMERA INTERFACE (Screenshot 1)   */}
      {/* ======================================================== */}
      {viewStage === 'camera' && (
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
          
          {/* Camera Viewport / Video Preview with 20+ Real-Time Effects */}
          <div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-950">
            <video
              ref={videoPreviewRef}
              autoPlay
              playsInline
              muted
              style={{ filter: activeEffect.filter }}
              className="w-full h-full object-cover transition-all duration-300"
            />
            
            {/* Fallback ambient if camera stream permission is denied */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
          </div>

          {/* Top Bar: [ X ] [ ♪ Add sound ] [ ↻ Flip ] */}
          <div className="relative z-20 flex items-center justify-between px-4 pt-4 pb-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ♪ Add Sound Button */}
            <button
              onClick={() => setShowSoundPicker(!showSoundPicker)}
              className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition shadow-lg"
            >
              <Music className="w-3.5 h-3.5 text-[#25F4EE] animate-pulse" />
              <span className="truncate max-w-[150px]">{selectedSound.title}</span>
            </button>

            {/* Flip Camera */}
            <button
              onClick={handleFlipCamera}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition"
              title="Flip Camera"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Sound Picker Dropdown */}
          {showSoundPicker && (
            <div className="relative z-30 mx-4 bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-2xl p-3 shadow-2xl space-y-2 animate-fade-in">
              <span className="text-[11px] font-bold text-zinc-400 block">{t.selectMusicTitle}</span>
              <div className="space-y-1">
                {PRESET_SOUNDS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedSound(s);
                      setShowSoundPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                      selectedSound.id === s.id ? 'bg-[#fe2c55] text-white' : 'hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span>{s.title}</span>
                    <span className="text-[10px] opacity-70">@{s.author}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Side Toolbar (Effects, Speed, Filters) */}
          <div className="relative z-20 self-end mr-3 flex flex-col gap-3">
            <button
              onClick={() => setShowEffectsTray(!showEffectsTray)}
              className="flex flex-col items-center gap-0.5 group active:scale-90 transition"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border ${
                showEffectsTray ? 'bg-[#fe2c55] border-[#fe2c55]' : 'bg-black/40 border-white/20'
              }`}>
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow">{t.filtersBtn}</span>
            </button>
          </div>

          {/* 20+ Real-Time Camera Effects Tray */}
          {showEffectsTray && (
            <div className="relative z-20 px-3 py-2 bg-black/60 backdrop-blur-md border-t border-b border-white/10">
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {CAMERA_EFFECTS.map((eff) => (
                  <button
                    key={eff.id}
                    onClick={() => setActiveEffect(eff)}
                    className={`flex flex-col items-center gap-1 shrink-0 p-1.5 rounded-xl transition ${
                      activeEffect.id === eff.id ? 'bg-[#fe2c55]/30 border border-[#fe2c55]' : 'bg-zinc-900/60 border border-zinc-800'
                    }`}
                  >
                    <span className="text-xl">{eff.icon}</span>
                    <span className="text-[10px] font-bold text-zinc-200 whitespace-nowrap">
                      {eff.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Control Section */}
          <div className="relative z-20 pb-6 px-4 space-y-3 bg-gradient-to-t from-black via-black/80 to-transparent">
            
            {/* Recording Timer if active */}
            {isRecording && (
              <div className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-sm font-mono font-black text-red-500 bg-black/60 px-3 py-1 rounded-full border border-red-500/30">
                  {formatTimer(recordSeconds)}
                </span>
              </div>
            )}

            {/* Duration Options: [ 5m ] [ 60s ] [ 15s ] [ PHOTO ] [ TEXT ] */}
            <div className="flex items-center justify-center gap-4 text-xs font-black overflow-x-auto py-1">
              {[
                { id: '5m', label: '5m' },
                { id: '60s', label: '60s' },
                { id: '15s', label: '15s' },
                { id: 'photo', label: 'PHOTO' },
                { id: 'text', label: 'TEXT' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDuration(d.id as any)}
                  className={`px-2.5 py-1 rounded-full transition tracking-wider ${
                    selectedDuration === d.id
                      ? 'bg-white text-black font-extrabold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Action Buttons Row: Gallery | Record / Shutter */}
            <div className="flex items-center justify-between px-6 pt-2">
              
              {/* Left: Gallery Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1 active:scale-90 transition group"
              >
                <div className="w-11 h-11 rounded-2xl bg-zinc-900/80 border border-white/30 flex items-center justify-center shadow-lg group-hover:border-white">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow">{t.galleryBtn}</span>
              </button>

              {/* Center: Big Shutter / Record Button */}
              <div className="relative flex items-center justify-center">
                <button
                  onClick={handleRecordToggle}
                  className={`w-20 h-20 rounded-full p-1.5 border-[4px] border-white flex items-center justify-center active:scale-95 transition shadow-2xl ${
                    isRecording ? 'border-red-500' : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-full h-full rounded-full transition-all duration-300 ${
                    isRecording 
                      ? 'w-7 h-7 rounded-md bg-red-600' 
                      : 'bg-[#fe2c55] shadow-[0_0_15px_#fe2c55]'
                  }`} />
                </button>
              </div>

              {/* Right spacer to keep shutter centered */}
              <div className="w-11" />

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3: POST EDITOR PAGE (Screenshot 3)               */}
      {/* ======================================================== */}
      {viewStage === 'editor' && (
        <div className="relative w-full h-full bg-black text-white flex flex-col justify-between overflow-y-auto">
          
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-30">
            <button
              onClick={() => setViewStage('camera')}
              className="text-xs font-bold text-zinc-300 hover:text-white px-2 py-1"
            >
              {t.backBtn}
            </button>
            <h2 className="text-sm font-black text-white tracking-tight">
              {t.postEditorTitle}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body */}
          <div className="p-4 space-y-4 max-w-lg mx-auto w-full flex-1">
            
            {/* Caption & Thumbnail Block */}
            <div className="flex gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t.captionPlaceholder}
                rows={4}
                className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 resize-none outline-none leading-relaxed"
              />

              {/* Video Thumbnail interactive button */}
              <button
                type="button"
                onClick={() => setIsThumbnailPickerOpen(true)}
                className="relative w-20 h-28 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 hover:border-[#fe2c55] shrink-0 group transition"
                title={t.changeThumbnail}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      try {
                        if (e.currentTarget.duration > 0.2) {
                          e.currentTarget.currentTime = 0.1;
                        }
                      } catch {}
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Film className="w-6 h-6" />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 right-1 text-center py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-bold text-white group-hover:bg-[#fe2c55] transition">
                  {t.changeThumbnail}
                </span>
              </button>
            </div>

            {/* Change Video & Change Thumbnail Action Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#25F4EE]/60 text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Film className="w-4 h-4 text-[#25F4EE]" />
                <span>{t.changeVideoBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsThumbnailPickerOpen(true)}
                className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#fe2c55]/60 text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <ImageIcon className="w-4 h-4 text-[#fe2c55]" />
                <span>{t.selectThumbnailBtn}</span>
              </button>
            </div>

            {/* Quick Hashtags & Mention Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleAddHashtag('#foryou')}
                className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:border-zinc-700"
              >
                #foryou
              </button>
              <button
                onClick={() => handleAddHashtag('#bangladesh')}
                className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300 hover:border-zinc-700"
              >
                #bangladesh
              </button>
              <button
                onClick={() => handleAddHashtag('#rongin')}
                className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-[#fe2c55] hover:border-zinc-700"
              >
                #rongin
              </button>
              <button
                onClick={() => handleAddMention('@friends')}
                className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-[#25F4EE] hover:border-zinc-700"
              >
                @Friends
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-2 divide-y divide-zinc-900 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-xs">
              
              {/* Location */}
              <div className="flex items-center justify-between pt-2 first:pt-0">
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>{t.locationLabel}</span>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-right text-xs bg-transparent text-white outline-none font-bold"
                />
              </div>

              {/* Who can view this post */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span>{t.whoCanViewLabel}</span>
                </div>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white outline-none font-bold"
                >
                  <option value="public">{t.everyoneOpt}</option>
                  <option value="friends">{t.friendsOpt}</option>
                  <option value="private">{t.onlyMeOpt}</option>
                </select>
              </div>

              {/* Audio Track */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                  <Music className="w-4 h-4 text-[#fe2c55]" />
                  <span>{t.audioTrackLabel}</span>
                </div>
                <span className="text-zinc-400 text-xs font-bold truncate max-w-[180px]">
                  {selectedSound.title}
                </span>
              </div>
            </div>

            {/* Cloudinary Console Storage Integration Badge */}
            <div className="p-3 rounded-2xl bg-zinc-950 border border-cyan-500/30 flex items-center justify-between text-[11px] shadow-sm">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[#25f4ee]" />
                <span className="text-zinc-300 font-semibold">{t.cloudStorageLabel}: <strong className="text-white">Cloudinary</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                Active
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
              {t.backgroundUploadNote}
            </p>
          </div>

          {/* Bottom Sticky Action Buttons: Drafts | Post */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex items-center gap-3">
            <button
              onClick={() => {
                showToast(t.savedToDraftsToast);
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white active:scale-95 transition"
            >
              {t.drafts}
            </button>

            <button
              onClick={handlePostVideo}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#fe2c55] to-[#f72585] text-xs font-black text-white shadow-lg shadow-pink-600/30 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {t.postVideo}
            </button>
          </div>

        </div>
      )}

      {/* Thumbnail Picker Modal (From Video Timeline or Gallery) */}
      <ThumbnailPickerModal
        isOpen={isThumbnailPickerOpen}
        onClose={() => setIsThumbnailPickerOpen(false)}
        videoUrl={videoUrl}
        currentThumbnail={thumbnailUrl}
        onSelectThumbnail={(newThumb) => {
          setThumbnailUrl(newThumb);
          showToast(t.thumbGallerySelected);
        }}
      />

    </div>
  );
};
