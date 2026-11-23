import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { offlineStore } from '../lib/offlineStore';
import { useLanguage } from '../lib/languageContext';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setErrorMsg('');
      setSuccessMsg('');
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPassword) {
      setErrorMsg(t.errEnterCurrentPass);
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg(t.errNewPassMin);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t.errConfirmPassMismatch);
      return;
    }

    setIsSaving(true);

    // 1. Validate & update on server if user exists there
    try {
      const serverRes = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          username: currentUser.username,
          currentPassword,
          newPassword,
        }),
      });
      if (serverRes.status === 401) {
        const errData = await serverRes.json().catch(() => ({}));
        setIsSaving(false);
        setErrorMsg(errData?.error || t.errWrongCurrentPass);
        return;
      }
    } catch {}

    // 2. Update locally in offlineStore
    const localRes = offlineStore.changePassword(currentUser.uid, currentPassword, newPassword);
    setIsSaving(false);

    if (!localRes.success) {
      setErrorMsg(localRes.error || t.errChangePassFailed);
      return;
    }

    setSuccessMsg(t.passChangedSuccess);

    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0b0c] text-white overflow-y-auto animate-fade-in">
      {/* Header */}
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
          {t.changePassword}
        </h2>

        <div className="w-8" />
      </div>

      <div className="max-w-md mx-auto px-4 pt-6 pb-12 space-y-5">
        {/* Top Security Summary */}
        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#16171a] border border-zinc-800/80">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {t.updateYourPassword}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.passwordSecurityDesc}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-300 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Notice */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Previous Password */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              {t.currentPasswordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.currentPasswordPlaceholder}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#16171a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#3b82f6] transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. New Password */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              {t.newPasswordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.newPasswordPlaceholder}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#16171a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#3b82f6] transition"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. Confirm Password */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1.5">
              {t.confirmPasswordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#16171a] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#3b82f6] transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving || Boolean(successMsg)}
            className="w-full py-3.5 mt-2 rounded-2xl bg-[#2563eb] hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-2"
          >
            {isSaving ? t.saving : t.savePasswordBtn}
          </button>
        </form>
      </div>
    </div>
  );
};
