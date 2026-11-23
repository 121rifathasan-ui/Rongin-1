import React, { useState, useRef, useEffect } from 'react';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { X, Check, Image as ImageIcon, Film, Play, Pause, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

interface ThumbnailPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  currentThumbnail?: string;
  onSelectThumbnail: (thumbnailUrl: string) => void;
}

function compressGalleryImage(
  file: File,
  maxWidth = 540,
  quality = 0.85
): Promise<{ dataUrl: string; blob: Blob | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: rawDataUrl, blob: null });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob(
            (blob) => resolve({ dataUrl, blob }),
            'image/jpeg',
            quality
          );
        } catch {
          resolve({ dataUrl: rawDataUrl, blob: null });
        }
      };
      img.onerror = () => resolve({ dataUrl: rawDataUrl, blob: null });
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const ThumbnailPickerModal: React.FC<ThumbnailPickerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  currentThumbnail,
  onSelectThumbnail,
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedThumb, setSelectedThumb] = useState<string>(currentThumbnail || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedThumb(currentThumbnail || '');
      setCurrentTime(0);
      setIsPlaying(false);
      setStatusMessage(null);
    }
  }, [isOpen, currentThumbnail, videoUrl]);

  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleCaptureFrame = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) {
      setStatusMessage(t.thumbNotReady);
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const maxW = 480;
      const scale = Math.min(1, maxW / v.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');

      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedThumb(dataUrl);
      setStatusMessage(t.thumbFrameSelected);

      // Also upload to Cloudinary if possible
      canvas.toBlob(
        async (blob) => {
          if (!blob) return;
          try {
            const res = await uploadFileToCloudinary(blob, 'image');
            if (res.secureUrl) {
              setSelectedThumb(res.secureUrl);
            }
          } catch {
            // Keep persistent Data URL fallback
          }
        },
        'image/jpeg',
        0.85
      );
    } catch {
      setStatusMessage(t.thumbLinkError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(t.thumbPreparingGallery);

    try {
      const { dataUrl, blob } = await compressGalleryImage(file, 540, 0.86);
      setSelectedThumb(dataUrl);
      setStatusMessage(t.thumbGallerySelected);

      try {
        const res = await uploadFileToCloudinary(blob || file, 'image');
        if (res.secureUrl) {
          setSelectedThumb(res.secureUrl);
        }
      } catch {
        // Keep persistent Data URL fallback
      }
    } catch {
      setStatusMessage(t.thumbReadError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (selectedThumb) {
      onSelectThumbnail(selectedThumb);
      onClose();
      return;
    }
    // If user scrubbed without clicking capture, capture current frame if possible
    const v = videoRef.current;
    if (v && v.videoWidth && v.videoHeight) {
      try {
        const maxW = 480;
        const scale = Math.min(1, maxW / v.videoWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onSelectThumbnail(dataUrl);
          onClose();
          return;
        }
      } catch {}
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#fe2c55]" />
            {t.changeThumbnail}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Video Scrubber Preview + Selected Thumbnail Preview */}
          <div className="grid grid-cols-2 gap-3 items-start">
            {/* Video frame chooser */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 block text-center">
                {t.chooseFromVideo}
              </span>
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black border border-zinc-800">
                {videoUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      crossOrigin="anonymous"
                      muted
                      playsInline
                      onLoadedMetadata={(e) => {
                        setDuration(e.currentTarget.duration || 0);
                      }}
                      onTimeUpdate={(e) => {
                        setCurrentTime(e.currentTarget.currentTime);
                      }}
                      onEnded={() => setIsPlaying(false)}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Film className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>

            {/* Selected Thumbnail Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-zinc-400 block text-center">
                {t.selectedThumbnailLabel}
              </span>
              <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 border-2 border-[#fe2c55]/70 flex items-center justify-center">
                {selectedThumb ? (
                  <img
                    src={selectedThumb}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center text-zinc-500 gap-1.5">
                    <ImageIcon className="w-7 h-7 opacity-60" />
                    <span className="text-[10px]">{t.thumbChoosePrompt}</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#25F4EE] animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Video Timeline Scrubber Slider */}
          {videoUrl && (
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                <span>{t.selectAnyVideoPart}</span>
                <span className="font-mono text-[#25F4EE]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 10}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full accent-[#fe2c55] cursor-pointer"
              />
              <button
                type="button"
                onClick={handleCaptureFrame}
                disabled={isProcessing}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
              >
                <Film className="w-3.5 h-3.5 text-[#25F4EE]" />
                {t.useThisFrameBtn}
              </button>
            </div>
          )}

          {/* Gallery Upload Button */}
          <div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGallerySelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition active:scale-95"
            >
              <ImageIcon className="w-4 h-4 text-[#fe2c55]" />
              {t.chooseFromGalleryBtn}
            </button>
          </div>

          {statusMessage && (
            <p className="text-[11px] font-semibold text-center text-[#25F4EE]">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 flex items-center gap-2.5 bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 py-2.5 rounded-xl bg-[#fe2c55] hover:bg-[#e0264b] disabled:opacity-50 text-xs font-extrabold text-white flex items-center justify-center gap-1.5 transition"
          >
            <Check className="w-4 h-4" />
            {t.saveThumbnailBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
