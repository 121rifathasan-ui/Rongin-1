import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserPrivacySettings } from '../types';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { getResolvedPrivacy, sanitizeAvatarUrl } from '../lib/offlineStore';
import { useLanguage } from '../lib/languageContext';
import {
  ArrowLeft,
  Camera,
  User,
  Info,
  Cake,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  Link2,
  AtSign,
  Calendar,
  Loader2,
  Check,
} from 'lucide-react';

interface PersonalInfoModalProps {
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

function calculateAgeFromDob(dobString?: string): number | undefined {
  if (!dobString) return undefined;
  const birth = new Date(dobString);
  if (Number.isNaN(birth.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : undefined;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const dobInputRef = useRef<HTMLInputElement | null>(null);

  const deriveInitialEmail = () => {
    if (currentUser.email) return currentUser.email;
    if (currentUser.contact && currentUser.contact.includes('@')) return currentUser.contact;
    return '';
  };

  const deriveInitialPhone = () => {
    if (currentUser.phone) return currentUser.phone;
    if (currentUser.contact && !currentUser.contact.includes('@')) return currentUser.contact;
    return '';
  };

  const [avatarUrl, setAvatarUrl] = useState(() => sanitizeAvatarUrl(currentUser.avatarUrl));
  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>(currentUser.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentUser.dateOfBirth || '');
  const [age, setAge] = useState<number | undefined>(currentUser.age);
  const [email, setEmail] = useState(deriveInitialEmail);
  const [phone, setPhone] = useState(deriveInitialPhone);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [privacy, setPrivacy] = useState<Required<UserPrivacySettings>>(() =>
    getResolvedPrivacy(currentUser)
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAvatarUrl(sanitizeAvatarUrl(currentUser.avatarUrl));
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setGender(currentUser.gender || '');
      setDateOfBirth(currentUser.dateOfBirth || '');
      setAge(currentUser.age);
      setEmail(deriveInitialEmail());
      setPhone(deriveInitialPhone());
      setIsEditingEmail(false);
      setIsEditingPhone(false);
      setLocation(currentUser.location || '');
      setWebsite(currentUser.website || '');
      setPrivacy(getResolvedPrivacy(currentUser));
      setIsUploadingImage(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { dataUrl, blob } = await compressImageFile(file, 320, 0.85);
      setAvatarUrl(dataUrl);
      try {
        const res = await uploadFileToCloudinary(blob || file, 'image');
        if (res.secureUrl) {
          setAvatarUrl(res.secureUrl);
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

  const handleDobChange = (val: string) => {
    setDateOfBirth(val);
    const computedAge = calculateAgeFromDob(val);
    if (computedAge !== undefined) {
      setAge(computedAge);
    }
  };

  const togglePrivacy = (key: keyof UserPrivacySettings) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    if (isUploadingImage) return;
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const computedAge = dateOfBirth ? calculateAgeFromDob(dateOfBirth) ?? age : age;

    const updated: UserProfile = {
      ...currentUser,
      avatarUrl: sanitizeAvatarUrl(avatarUrl),
      name: name.trim() || currentUser.name,
      bio: bio.trim(),
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
      age: computedAge,
      email: cleanEmail || undefined,
      phone: cleanPhone || undefined,
      contact: cleanPhone || cleanEmail || currentUser.contact,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      privacySettings: { ...privacy },
    };

    onSave(updated);
    onClose();
  };

  const privacyItems: {
    key: keyof UserPrivacySettings;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'hideUsername',
      label: t.usernameLabel,
      icon: <AtSign className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      key: 'hidePhone',
      label: t.phoneLabel,
      icon: <Phone className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      key: 'hideEmail',
      label: t.emailLabel,
      icon: <Mail className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      key: 'hideBirthday',
      label: t.birthdayLabel,
      icon: <Cake className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      key: 'hideAge',
      label: t.ageLabel,
      icon: <Calendar className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      key: 'hideGender',
      label: t.genderLabel,
      icon: <User className="w-4 h-4 text-[#3b82f6]" />,
    },
    {
      key: 'hideLocation',
      label: t.locationLabel,
      icon: <MapPin className="w-4 h-4 text-[#3b82f6]" />,
    },
  ];

  const formatDisplayDob = (dob?: string) => {
    if (!dob) return t.tapToSelect;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return dob;
    try {
      return d.toLocaleDateString(language || 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dob;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0b0c] text-white overflow-y-auto animate-fade-in">
      {/* Top Sticky Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3.5 bg-[#0b0b0c]/95 backdrop-blur-md border-b border-zinc-900">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 -ml-1.5 rounded-full hover:bg-zinc-900 text-white active:scale-90 transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h2 className="text-[16px] font-extrabold tracking-tight text-white">
          {t.personalInfo}
        </h2>

        <button
          type="button"
          onClick={handleSave}
          disabled={isUploadingImage}
          className="text-sm font-extrabold text-[#3b82f6] hover:text-blue-400 disabled:opacity-50 active:scale-95 transition"
        >
          {isUploadingImage ? t.saving : t.save}
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-16 space-y-5">
        {/* Centered Profile Picture with Blue Camera Button */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={avatarUrl || FALLBACK_AVATAR}
              alt={name || currentUser.name}
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_AVATAR) {
                  e.currentTarget.src = FALLBACK_AVATAR;
                }
              }}
              className="w-24 h-24 rounded-full object-cover bg-zinc-900 border border-zinc-800 shadow-lg"
              referrerPolicy="no-referrer"
            />
            {isUploadingImage && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
              </div>
            )}
            <label
              htmlFor="personal-info-avatar-input"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#2563eb] border-2 border-[#0b0b0c] flex items-center justify-center cursor-pointer text-white shadow-md hover:bg-blue-500 transition"
              title={t.changePhoto}
            >
              <Camera className="w-4 h-4" />
            </label>
            <input
              id="personal-info-avatar-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-zinc-400 px-0.5">
            {t.basicInfo}
          </p>

          {/* Full Name Card */}
          <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#16171a] border border-zinc-800/80">
            <User className="w-5 h-5 text-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                {t.fullName}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                placeholder={t.fullNamePlaceholder}
                className="w-full bg-transparent text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none mt-0.5"
              />
            </div>
          </div>

          {/* Bio Card */}
          <div className="flex items-start gap-3.5 px-4 py-3.5 rounded-2xl bg-[#16171a] border border-zinc-800/80">
            <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                {t.bio}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={150}
                placeholder={t.bioPlaceholder}
                className="w-full bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none resize-none mt-1"
              />
            </div>
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-zinc-400 px-0.5">
            {t.genderLabel}
          </p>
          <div className="grid grid-cols-3 gap-2.5 p-2.5 rounded-2xl bg-[#16171a] border border-zinc-800/80">
            {(
              [
                { value: 'Male', label: t.male },
                { value: 'Female', label: t.female },
                { value: 'Other', label: t.otherGender },
              ] as const
            ).map((g) => {
              const active = gender === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(active ? '' : g.value)}
                  className={`py-2.5 rounded-full text-xs font-bold border transition ${
                    active
                      ? 'border-[#3b82f6] text-[#3b82f6] bg-[#3b82f6]/10'
                      : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-zinc-400 px-0.5">
            {t.birthdayLabel}
          </p>
          <div
            onClick={() => {
              try {
                dobInputRef.current?.showPicker?.();
                dobInputRef.current?.focus();
              } catch {
                dobInputRef.current?.focus();
              }
            }}
            className="relative flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#16171a] border border-zinc-800/80 cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Cake className="w-5 h-5 text-zinc-400 shrink-0" />
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${dateOfBirth ? 'text-white' : 'text-zinc-400'}`}>
                  {formatDisplayDob(dateOfBirth)}
                </span>
                {age !== undefined && (
                  <span className="text-[11px] text-zinc-500">
                    {t.ageLabel}: {age} {t.yearsLabel}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400" />
            <input
              ref={dobInputRef}
              type="date"
              value={dateOfBirth}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => handleDobChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label={t.birthdayLabel}
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-zinc-400 px-0.5">
            {t.contactInfo}
          </p>
          <div className="rounded-2xl bg-[#16171a] border border-zinc-800/80 divide-y divide-zinc-800/80">
            {/* Email Row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Mail className="w-5 h-5 text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  {isEditingEmail ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      autoFocus
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                    />
                  ) : (
                    <>
                      <p className={`text-sm font-semibold truncate ${email ? 'text-white' : 'text-zinc-500'}`}>
                        {email || t.addEmailPlaceholder}
                      </p>
                      {email && (
                        <span className="text-[11px] font-semibold text-emerald-500 inline-flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingEmail((v) => !v)}
                className="text-xs font-bold text-[#3b82f6] hover:text-blue-400 shrink-0"
              >
                {isEditingEmail ? t.doneBtn : email ? t.editVideo : t.addBtn}
              </button>
            </div>

            {/* Phone Row */}
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Phone className="w-5 h-5 text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  {isEditingPhone ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      autoFocus
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                    />
                  ) : (
                    <>
                      <p className={`text-sm font-semibold truncate ${phone ? 'text-white' : 'text-zinc-500'}`}>
                        {phone || t.addPhonePlaceholder}
                      </p>
                      {phone && (
                        <span className="text-[11px] font-semibold text-emerald-500 inline-flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPhone((v) => !v)}
                className="text-xs font-bold text-[#3b82f6] hover:text-blue-400 shrink-0"
              >
                {isEditingPhone ? t.doneBtn : phone ? t.editVideo : t.addBtn}
              </button>
            </div>
          </div>
        </div>

        {/* Location & Website */}
        <div className="space-y-2.5">
          {/* Location */}
          <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#16171a] border border-zinc-800/80">
            <MapPin className="w-5 h-5 text-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                {t.locationLabel}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={80}
                placeholder={t.locationPlaceholder}
                className="w-full bg-transparent text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none mt-0.5"
              />
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#16171a] border border-zinc-800/80">
            <Link2 className="w-5 h-5 text-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                {t.websiteLabel}
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder={t.websitePlaceholder}
                className="w-full bg-transparent text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings (Hide from other users) */}
        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-bold text-zinc-300 px-0.5">
            {t.privacy}
          </p>
          <div className="rounded-2xl bg-[#16171a] border border-zinc-800/80 px-4 py-3">
            <p className="text-xs font-medium text-zinc-400 mb-3">
              {t.hideFromOthers}
            </p>
            <div className="space-y-3.5">
              {privacyItems.map((item) => {
                const isHidden = Boolean(privacy[item.key]);
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 flex items-center justify-center">
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium text-zinc-100">
                        {item.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isHidden}
                      onClick={() => togglePrivacy(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
                        isHidden ? 'bg-[#1d4ed8]' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full shadow transition duration-200 mt-0.5 ${
                          isHidden
                            ? 'translate-x-5.5 bg-[#3b82f6] ring-2 ring-blue-300/40'
                            : 'translate-x-0.5 bg-zinc-300'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
