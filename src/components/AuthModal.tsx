import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { offlineStore, sanitizeAvatarUrl } from '../lib/offlineStore';
import { syncUserToFirebase, signInWithGoogle } from '../lib/firebase';
import { AppLogo } from './AppLogo';
import { useLanguage } from '../lib/languageContext';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  Calendar,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'signup' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  
  // Sign up fields
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [age, setAge] = useState('');
  const [password, setPassword] = useState('');

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (isOpen) {
      const list = offlineStore.getDeviceSavedAccounts();
      setSavedAccounts(list);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuickSwitchAccount = (acc: UserProfile) => {
    setErrorMessage('');
    const switched = offlineStore.switchToDeviceAccount(acc.uid);
    if (switched) {
      setSuccessMessage(`${t.welcomeBackMsg}, ${switched.name}!`);
      setTimeout(() => {
        onSuccess(switched);
        onClose();
      }, 500);
    }
  };

  const handleForgetSavedAccount = (e: React.MouseEvent, uid: string) => {
    e.stopPropagation();
    offlineStore.removeDeviceAccountUid(uid);
    setSavedAccounts((prev) => prev.filter((a) => a.uid !== uid));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanContact = contact.trim().toLowerCase();
    const cleanName = name.trim();
    const parsedAge = parseInt(age, 10);

    if (!cleanName) {
      setErrorMessage(t.errNameRequired);
      return;
    }
    if (!cleanContact) {
      setErrorMessage(t.errContactRequired);
      return;
    }
    if (isNaN(parsedAge) || parsedAge < 12) {
      setErrorMessage(t.errMinAge);
      return;
    }
    if (password.length < 4) {
      setErrorMessage(t.errPassMin);
      return;
    }

    setIsLoading(true);

    // 1. Register locally & on backend server
    const localResult = offlineStore.registerAccount({
      name: cleanName,
      contact: cleanContact,
      age: parsedAge,
      password,
    });

    if (!localResult.success) {
      setIsLoading(false);
      setErrorMessage(localResult.error || 'এই মোবাইল বা ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট রয়েছে।');
      return;
    }

    const newUser = localResult.user!;

    // 2. Sync ONLY public profile fields to Firebase RTDB (never password/phone/email/age)
    try {
      await syncUserToFirebase(newUser);
    } catch (fbErr) {
      console.warn('Firebase sync notice:', fbErr);
    }

    fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});

    const { password: _omitPass, ...safeReturnUser } = newUser;
    setIsLoading(false);
    setSuccessMessage(`${t.welcomeNewAccountMsg}, ${newUser.name}!`);

    setTimeout(() => {
      onSuccess(safeReturnUser);
      onClose();
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage(t.errContactRequired);
      return;
    }
    if (!loginPassword) {
      setErrorMessage(t.errEnterPassword);
      return;
    }

    setIsLoading(true);

    let loggedInUser: UserProfile | null = null;
    try {
      const serverRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginIdentifier.trim(), password: loginPassword }),
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data?.success && data?.user) {
          loggedInUser = offlineStore.hydrateUserStats(data.user, data.user.uid);
          offlineStore.saveUserProfile(loggedInUser);
        }
      } else if (serverRes.status === 401) {
        setIsLoading(false);
        setErrorMessage(t.errWrongPassword);
        return;
      }
    } catch {}

    if (!loggedInUser) {
      const loginResult = offlineStore.loginAccount(loginIdentifier, loginPassword);
      if (!loginResult.success) {
        setIsLoading(false);
        setErrorMessage(loginResult.error || t.errLoginFailed);
        return;
      }
      loggedInUser = loginResult.user!;
    }

    const { password: _omitPass, ...safeUser } = loggedInUser;
    setIsLoading(false);
    setSuccessMessage(`${t.welcomeBackMsg}, ${safeUser.name}!`);

    setTimeout(() => {
      onSuccess(safeUser);
      onClose();
    }, 900);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success && res.user) {
        const existingLocal = offlineStore.findRegisteredUser(
          res.user.uid,
          res.user.username,
          res.user.contact || res.user.email
        );
        const mergedUser: UserProfile = existingLocal
          ? {
              ...res.user,
              ...existingLocal,
              avatarUrl: existingLocal.avatarUrl || res.user.avatarUrl,
            }
          : res.user;
        const hydrated = offlineStore.hydrateUserStats(mergedUser, mergedUser.uid);
        offlineStore.saveUserProfile(hydrated);
        setSuccessMessage(`Google দিয়ে লগইন সফল: ${hydrated.name}`);
        setTimeout(() => {
          onSuccess(hydrated);
          onClose();
        }, 900);
      } else {
        setErrorMessage(res.error || 'Google সাইন ইন ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google সাইন ইন সম্পন্ন করা যায়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#12141a] border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 max-h-[92vh] overflow-y-auto text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center pt-2 pb-4 text-center">
          <AppLogo size="lg" className="mb-2" />
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {mode === 'signup' ? t.signupSubtitle : t.loginSubtitle}
          </p>
        </div>

        {/* Quick Google Login Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center justify-center gap-2.5 shadow-md active:scale-95 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t.googleLoginBtn}</span>
          </button>
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-[1px] bg-zinc-800" />
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">{t.orDivider}</span>
            <div className="flex-1 h-[1px] bg-zinc-800" />
          </div>
        </div>

        {/* Saved Accounts on This Device */}
        {savedAccounts.length > 0 && (
          <div className="mb-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 p-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-zinc-400">
                {t.savedAccountsTitle} ({savedAccounts.length})
              </span>
              <span className="text-[10px] text-zinc-500">{t.tapToLogin}</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
              {savedAccounts.map((acc) => (
                <div
                  key={acc.uid}
                  onClick={() => handleQuickSwitchAccount(acc)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-950/90 hover:bg-zinc-800/80 border border-zinc-800/80 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={sanitizeAvatarUrl(acc.avatarUrl)}
                      alt={acc.name}
                      className="w-9 h-9 rounded-full object-cover bg-zinc-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white truncate">
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        @{acc.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-[#fe2c55]/15 text-[#fe2c55] text-[11px] font-bold flex items-center gap-1 group-hover:bg-[#fe2c55] group-hover:text-white transition">
                      <LogIn className="w-3 h-3" />
                      {t.login}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleForgetSavedAccount(e, acc.uid)}
                      className="w-6 h-6 rounded-full hover:bg-zinc-700 text-zinc-500 hover:text-white flex items-center justify-center transition"
                      title={t.removeFromList}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs: Sign Up vs Login */}
        <div className="flex rounded-2xl bg-zinc-900 p-1 mb-4 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-[#fe2c55] to-[#e0264b] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.signUpTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              mode === 'login'
                ? 'bg-gradient-to-r from-[#fe2c55] to-[#e0264b] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.logInTab}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FORM: SIGN UP */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                {t.yourFullNameLabel} <span className="text-[#fe2c55]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fe2c55] transition"
                />
              </div>
            </div>

            {/* Mobile / Email */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-300">
                  {t.mobileOrEmailLabel} <span className="text-[#fe2c55]">*</span>
                </label>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#25F4EE]" /> {t.oneIdPerContact}
                </span>
              </div>
              <div className="relative">
                {contact.includes('@') ? (
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                ) : (
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                )}
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="017XXXXXXXX / user@email.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fe2c55] transition font-mono"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                {t.ageYearsLabel} <span className="text-[#fe2c55]">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="number"
                  min="12"
                  max="100"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="20"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fe2c55] transition font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                {t.passwordLabel} <span className="text-[#fe2c55]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordMinPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fe2c55] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Sign Up */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#fe2c55] to-[#e0264b] hover:opacity-95 active:scale-95 text-xs font-black text-white shadow-lg shadow-[#fe2c55]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.confirmAccountBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* FORM: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                {t.mobileOrEmailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="017XXXXXXXX / user@email.com"
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fe2c55] transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder={t.enterYourPasswordPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fe2c55] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-[#fe2c55] to-[#e0264b] hover:opacity-95 active:scale-95 text-xs font-black text-white shadow-lg shadow-[#fe2c55]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.logInTab}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
