import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, Check, X } from 'lucide-react';

export interface WorldLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  country: string;
  shortLabel: string;
}

export const WORLD_LANGUAGES: WorldLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', country: 'United States UK Global', shortLabel: 'EN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', country: 'Bangladesh India', shortLabel: 'বাং' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', country: 'India', shortLabel: 'HI' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', country: 'Saudi Arabia UAE Egypt Middle East', shortLabel: 'AR' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', country: 'Spain Mexico Latin America', shortLabel: 'ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', country: 'France Canada', shortLabel: 'FR' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文', flag: '🇨🇳', country: 'China Taiwan Singapore', shortLabel: 'ZH' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', country: 'Pakistan', shortLabel: 'UR' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', country: 'Portugal Brazil', shortLabel: 'PT' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', country: 'Germany Austria Switzerland', shortLabel: 'DE' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', country: 'Japan', shortLabel: 'JA' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', country: 'South Korea', shortLabel: 'KO' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', country: 'Russia', shortLabel: 'RU' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', country: 'Turkey', shortLabel: 'TR' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', country: 'Indonesia', shortLabel: 'ID' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', country: 'Malaysia Brunei', shortLabel: 'MS' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', country: 'Italy', shortLabel: 'IT' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', country: 'Vietnam', shortLabel: 'VI' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', country: 'Thailand', shortLabel: 'TH' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', country: 'Iran Afghanistan', shortLabel: 'FA' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', country: 'India Sri Lanka Singapore', shortLabel: 'TA' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', country: 'India', shortLabel: 'TE' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', country: 'India', shortLabel: 'MR' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', country: 'India', shortLabel: 'GU' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', country: 'India', shortLabel: 'KN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', country: 'India', shortLabel: 'ML' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', country: 'India Pakistan', shortLabel: 'PA' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵', country: 'Nepal', shortLabel: 'NE' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰', country: 'Sri Lanka', shortLabel: 'SI' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲', country: 'Myanmar', shortLabel: 'MY' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭', country: 'Cambodia', shortLabel: 'KM' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', country: 'Laos', shortLabel: 'LO' },
  { code: 'tl', name: 'Filipino (Tagalog)', nativeName: 'Filipino', flag: '🇵🇭', country: 'Philippines', shortLabel: 'TL' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', country: 'Kenya Tanzania Africa', shortLabel: 'SW' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', country: 'Netherlands Belgium', shortLabel: 'NL' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', country: 'Poland', shortLabel: 'PL' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', country: 'Ukraine', shortLabel: 'UK' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', country: 'Greece Cyprus', shortLabel: 'EL' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', country: 'Sweden', shortLabel: 'SV' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', country: 'Norway', shortLabel: 'NO' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', country: 'Denmark', shortLabel: 'DA' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', country: 'Finland', shortLabel: 'FI' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', country: 'Czech Republic', shortLabel: 'CS' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', country: 'Slovakia', shortLabel: 'SK' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', country: 'Hungary', shortLabel: 'HU' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', country: 'Romania Moldova', shortLabel: 'RO' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', country: 'Bulgaria', shortLabel: 'BG' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', country: 'Croatia', shortLabel: 'HR' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸', country: 'Serbia', shortLabel: 'SR' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', country: 'Israel', shortLabel: 'HE' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', country: 'Ethiopia', shortLabel: 'AM' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴', country: 'Somalia', shortLabel: 'SO' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', country: 'Nigeria Niger', shortLabel: 'HA' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', country: 'Nigeria', shortLabel: 'YO' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', country: 'South Africa', shortLabel: 'ZU' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', country: 'South Africa', shortLabel: 'AF' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', country: 'Afghanistan', shortLabel: 'PS' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🇮🇶', country: 'Kurdistan Iraq', shortLabel: 'KU' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿', country: 'Uzbekistan', shortLabel: 'UZ' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', country: 'Kazakhstan', shortLabel: 'KK' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿', country: 'Azerbaijan', shortLabel: 'AZ' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪', country: 'Georgia', shortLabel: 'KA' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲', country: 'Armenia', shortLabel: 'HY' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳', country: 'Mongolia', shortLabel: 'MN' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', country: 'Albania', shortLabel: 'SQ' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦', country: 'Bosnia', shortLabel: 'BS' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪', country: 'Estonia', shortLabel: 'ET' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻', country: 'Latvia', shortLabel: 'LV' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹', country: 'Lithuania', shortLabel: 'LT' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸', country: 'Iceland', shortLabel: 'IS' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', country: 'Ireland', shortLabel: 'GA' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', country: 'Wales UK', shortLabel: 'CY' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹', country: 'Malta', shortLabel: 'MT' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸', country: 'Catalonia Spain', shortLabel: 'CA' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿', country: 'New Zealand', shortLabel: 'MI' },
];

interface LanguageSelectorModalProps {
  isOpen: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  title?: string;
  searchPlaceholder?: string;
  noMatchLabel?: string;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  selectedCode,
  onSelect,
  onClose,
  title = 'Select Language',
  searchPlaceholder = 'Search language or country...',
  noMatchLabel = 'No matching language found',
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORLD_LANGUAGES;
    return WORLD_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.country.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-[#0b0b0d] text-white flex flex-col select-none animate-fade-in">
      {/* Top Sticky Bar */}
      <div className="sticky top-0 z-10 bg-[#121316] border-b border-zinc-800/80 px-4 py-3.5 flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 -ml-1.5 rounded-full text-zinc-200 hover:bg-zinc-800 active:scale-90 transition"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.3]" />
        </button>
        <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
          {title}
        </h2>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-3.5 pb-2 bg-[#0b0b0d]">
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#16171b] border border-zinc-800 focus-within:border-[#3b82f6] transition">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus={false}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-0.5 rounded-full text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Language Cards */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-8 space-y-3">
        {filteredLanguages.length === 0 ? (
          <div className="py-16 text-center text-sm text-zinc-500">
            {noMatchLabel}
          </div>
        ) : (
          filteredLanguages.map((lang) => {
            const isSelected = lang.code === selectedCode;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onSelect(lang.code);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border text-left transition active:scale-[0.99] ${
                  isSelected
                    ? 'bg-[#0c1d38] border-[#2563eb] shadow-lg shadow-blue-950/30'
                    : 'bg-[#16171a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-2xl leading-none shrink-0" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div className="min-w-0">
                    <div
                      className={`text-[15px] font-bold leading-snug truncate ${
                        isSelected ? 'text-[#3b82f6]' : 'text-white'
                      }`}
                    >
                      {lang.name}
                    </div>
                    <div
                      className={`text-xs font-medium mt-0.5 truncate ${
                        isSelected ? 'text-[#60a5fa]' : 'text-zinc-400'
                      }`}
                    >
                      {lang.nativeName}
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected ? (
                  <span className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[#091221] stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-zinc-400/75 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
