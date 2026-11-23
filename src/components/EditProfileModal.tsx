import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { sanitizeAvatarUrl } from '../lib/offlineStore';
import { useLanguage } from '../lib/languageContext';
import { X, Camera, Check, Link2, User, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (updated: UserProfile) => void;
}

const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80';

function compressImageFile(
  file: File,
  maxSize = 320,
  quality = 0.85
): Promise<{ dataUrl: string; blob: Blob | null }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob(
            (blob) => resolve({ dataUrl: compressedDataUrl, blob }),
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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatarUrl, setAvatarUrl] = useState(() => sanitizeAvatarUrl(currentUser.avatarUrl));
  const [category, setCategory] = useState(currentUser.category || 'Creator');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [selectedAvatarPreset, setSelectedAvatarPreset] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setUsername(currentUser.username);
      setBio(currentUser.bio);
      setAvatarUrl(sanitizeAvatarUrl(currentUser.avatarUrl));
      setCategory(currentUser.category || 'Creator');
      setWebsite(currentUser.website || '');
      setSelectedAvatarPreset('');
      setIsUploadingImage(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingImage) return;
    const cleanUsername = username.replace(/@/g, '').trim();
    if (!cleanUsername) {
      return;
    }

    const candidateAvatar = selectedAvatarPreset || avatarUrl.trim() || currentUser.avatarUrl;
    const safeAvatarUrl = sanitizeAvatarUrl(candidateAvatar);

    const updated: UserProfile = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      username: cleanUsername,
      bio: bio.trim(),
      avatarUrl: safeAvatarUrl,
      category: category.trim(),
      website: website.trim(),
    };

    onSave(updated);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // Compress into a compact persistent Data URL first (never use transient blob: URLs)
      const { dataUrl, blob } = await compressImageFile(file, 320, 0.85);
      setAvatarUrl(dataUrl);
      setSelectedAvatarPreset(dataUrl);

      // Upload compressed image to Cloudinary for permanent CDN URL
      try {
        const res = await uploadFileToCloudinary(blob || file, 'image');
        if (res.secureUrl) {
          setAvatarUrl(res.secureUrl);
          setSelectedAvatarPreset(res.secureUrl);
        }
      } catch (cloudErr) {
        console.warn('Cloudinary image upload fallback to persistent local image:', cloudErr);
      }
    } catch (err) {
      console.error('Failed to process profile image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-[#fe2c55]" />
            {t.profileCustomization}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Edit Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={selectedAvatarPreset || avatarUrl || FALLBACK_AVATAR}
                alt="Avatar"
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_AVATAR) {
                    e.currentTarget.src = FALLBACK_AVATAR;
                  }
                }}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#fe2c55] shadow-lg bg-zinc-800"
                referrerPolicy="no-referrer"
              />
              {isUploadingImage ? (
                <div className="absolute inset-0 rounded-full bg-black/65 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-[#25F4EE]" />
                </div>
              ) : (
                <label
                  htmlFor="avatar-upload-input"
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white"
                  title={t.changePhoto}
                >
                  <Camera className="w-6 h-6" />
                </label>
              )}
              <label
                htmlFor="avatar-upload-input"
                className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#fe2c55] border-2 border-zinc-900 flex items-center justify-center cursor-pointer text-white shadow-md hover:scale-105 transition"
                title={t.changePhoto}
              >
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <span className="text-[11px] text-zinc-400 text-center">
              {isUploadingImage ? t.savingPhoto : t.tapCameraToChangePhoto}
            </span>

            {/* Quick Avatar Presets */}
            <div className="flex items-center gap-2">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedAvatarPreset(preset);
                    setAvatarUrl(preset);
                  }}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition ${
                    (selectedAvatarPreset === preset || avatarUrl === preset)
                      ? 'border-[#fe2c55] scale-110'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              {t.displayName}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.yourNamePlaceholder}
              maxLength={50}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#fe2c55] transition"
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              {t.usernameHandle}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.]/g, ''))}
                placeholder="username"
                maxLength={30}
                className="w-full pl-7 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#fe2c55] transition"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              {t.creatorCategory}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#fe2c55]"
            >
              <option value="Gaming & Tech">Gaming & Tech</option>
              <option value="Entertainment & Comedy">Entertainment & Comedy</option>
              <option value="Travel & Vlogs">Travel & Vlogs</option>
              <option value="Music & Dance">Music & Dance</option>
              <option value="Food & Cooking">Food & Cooking</option>
              <option value="Education & Tips">Education & Tips</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-zinc-300">
                {t.bioDescription}
              </label>
              <span className="text-[10px] text-zinc-500">{bio.length}/150</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t.bioPlaceholder}
              rows={3}
              maxLength={150}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#fe2c55] resize-none"
            />
          </div>

          {/* Website Link */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">
              {t.socialWebsiteLink}
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t.websitePlaceholder}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-[#fe2c55]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isUploadingImage}
              className="flex-1 py-2.5 rounded-xl bg-[#fe2c55] hover:bg-[#e0264b] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-extrabold text-white transition shadow-lg shadow-[#fe2c55]/20 flex items-center justify-center gap-1.5"
            >
              {isUploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.uploading}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t.saveChanges}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
