import React, { useState } from 'react';
import { UserProfile, PostVideo } from '../types';
import { useLanguage } from '../lib/languageContext';
import { 
  ChevronLeft, 
  Eye, 
  Clock, 
  TrendingUp, 
  Users, 
  Target, 
  ArrowUpRight, 
  CheckCircle2,
  Wallet
} from 'lucide-react';

interface CreatorDashboardProps {
  user: UserProfile;
  posts: PostVideo[];
  onBack: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ user, posts, onBack }) => {
  const { t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState<'7d' | '28d' | '90d' | 'total'>('7d');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [bKashNumber, setBKashNumber] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Filter posts created by current user
  const allUserPosts = posts.filter(
    (p) => p.userId === user.uid || p.username === user.username
  );

  // Filter posts based on selected time window
  const now = Date.now();
  const timeWindowMs =
    timeFilter === '7d'
      ? 7 * 24 * 60 * 60 * 1000
      : timeFilter === '28d'
      ? 28 * 24 * 60 * 60 * 1000
      : timeFilter === '90d'
      ? 90 * 24 * 60 * 60 * 1000
      : Infinity;

  const userPosts = allUserPosts.filter((p) => (now - (p.timestamp || 0)) <= timeWindowMs);

  // Calculate 100% real, accurate metrics (no fake fallbacks or artificial multipliers)
  const displayViews = userPosts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalWatchSec = userPosts.reduce((acc, p) => acc + (p.watchTime || 0), 0);
  const displayWatchHours = (totalWatchSec / 3600).toFixed(2);
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = userPosts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
  const totalShares = userPosts.reduce((acc, p) => acc + (p.shares || 0), 0);
  const displayEngagement = totalLikes + totalComments + totalShares;
  const displayFollowers = user.followers || 0;

  // Rate: ৳ 5.00 per 1,000 views (real calculated income, no fake inflation)
  const estimatedIncome = ((displayViews / 1000) * 5).toFixed(2);

  // Targets
  const targetFollowersMax = 2000;
  const targetViewsMax = 50000;
  const targetWatchHoursMax = 200;
  const targetEngagementMax = 5000;

  const followerPercent = Math.min(100, Math.round((displayFollowers / targetFollowersMax) * 100));
  const viewsPercent = Math.min(100, Math.round((displayViews / targetViewsMax) * 100));
  const watchPercent = Math.min(100, Math.round((parseFloat(displayWatchHours) / targetWatchHoursMax) * 100));
  const engagementPercent = Math.min(100, Math.round((displayEngagement / targetEngagementMax) * 100));

  const formatNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bKashNumber.trim() || bKashNumber.length < 11) {
      alert(t.enterValidNumberErr);
      return;
    }
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setWithdrawModalOpen(false);
      setBKashNumber('');
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#090b10] text-white flex flex-col overflow-y-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[#090b10]/95 backdrop-blur-md border-b border-zinc-800">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-white active:scale-90 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-base font-extrabold text-white flex items-center gap-1.5 justify-center">
            <TrendingUp className="w-4 h-4 text-[#25F4EE]" />
            {t.professionalDashboard}
          </h2>
          <span className="text-[11px] text-zinc-400">{t.creatorInsightsSubtitle}</span>
        </div>
        <div className="w-9" />
      </div>

      <div className="p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Time Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: '7d', label: t.last7Days },
            { id: '28d', label: t.last28Days },
            { id: '90d', label: t.last90Days },
            { id: 'total', label: t.allTime },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeFilter(item.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap active:scale-95 ${
                timeFilter === item.id
                  ? 'bg-gradient-to-r from-[#25F4EE] to-[#fe2c55] text-black shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 4 Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Views */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col gap-2 shadow-lg hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold">{t.totalViews}</span>
              <Eye className="w-4 h-4 text-[#25F4EE]" />
            </div>
            <span className="text-2xl font-black text-[#25F4EE] tracking-tight">
              {formatNum(displayViews)}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> {t.activeVideoViews}
            </span>
          </div>

          {/* Watch Time */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col gap-2 shadow-lg hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold">{t.watchTime}</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-black text-blue-400 tracking-tight">
              {displayWatchHours} hrs
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> {t.totalWatchHours}
            </span>
          </div>

          {/* Engagement */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col gap-2 shadow-lg hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold">{t.engagement}</span>
              <TrendingUp className="w-4 h-4 text-[#fe2c55]" />
            </div>
            <span className="text-2xl font-black text-[#fe2c55] tracking-tight">
              {formatNum(displayEngagement)}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> {t.likeCommentShare}
            </span>
          </div>

          {/* Followers */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 flex flex-col gap-2 shadow-lg hover:border-zinc-700 transition">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-semibold">{t.followers}</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-2xl font-black text-purple-400 tracking-tight">
              {formatNum(displayFollowers)}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> {t.activeAudience}
            </span>
          </div>
        </div>

        {/* Estimated Income Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 mb-1">
              <Wallet className="w-4 h-4 text-emerald-400" />
              {t.estimatedIncome}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              ৳ {estimatedIncome}
            </div>
            <span className="text-[10px] text-zinc-400">
              {t.incomeRateDesc}
            </span>
          </div>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition whitespace-nowrap"
          >
            {t.withdrawMoney}
          </button>
        </div>

        {/* Targets & Milestones */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-[#fe2c55]" />
              {t.creatorTargetsTitle}
            </h3>
            <span className="text-[11px] font-bold text-[#fe2c55]">{t.level2Creator}</span>
          </div>

          {/* Follower Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">{t.followersTarget}</span>
              <span className="font-bold text-zinc-400">{displayFollowers} / {targetFollowersMax} ({followerPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-[#fe2c55] rounded-full transition-all duration-500"
                style={{ width: `${followerPercent}%` }}
              />
            </div>
          </div>

          {/* Views Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">{t.viewsTarget}</span>
              <span className="font-bold text-zinc-400">{formatNum(displayViews)} / {formatNum(targetViewsMax)} ({viewsPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#25F4EE] to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${viewsPercent}%` }}
              />
            </div>
          </div>

          {/* Watch Time Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">{t.watchTimeTarget}</span>
              <span className="font-bold text-zinc-400">{displayWatchHours} / {targetWatchHoursMax} hrs ({watchPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${watchPercent}%` }}
              />
            </div>
          </div>

          {/* Engagement Target */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">{t.engagementTarget}</span>
              <span className="font-bold text-zinc-400">{formatNum(displayEngagement)} / {formatNum(targetEngagementMax)} ({engagementPercent}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-[#25F4EE] rounded-full transition-all duration-500"
                style={{ width: `${engagementPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                {t.withdrawMoneyTitle}
              </h3>
              <button
                onClick={() => setWithdrawModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-white">{t.withdrawSuccessTitle}</p>
                <p className="text-xs text-zinc-400">{t.withdrawSuccessDesc}</p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
                  <span className="text-xs text-zinc-400">{t.withdrawableBalance}</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">৳ {estimatedIncome}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    {t.paymentMethod}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="py-2 px-3 rounded-xl border border-[#fe2c55] bg-[#fe2c55]/10 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                    >
                      bKash
                    </button>
                    <button
                      type="button"
                      className="py-2 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-bold text-zinc-400 hover:text-white flex items-center justify-center gap-1.5"
                    >
                      Nagad
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">
                    {t.personalMobileNumber}
                  </label>
                  <input
                    type="tel"
                    required
                    value={bKashNumber}
                    onChange={(e) => setBKashNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    maxLength={11}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-xs font-extrabold text-black transition shadow-lg shadow-emerald-500/20"
                  >
                    {t.confirmBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
