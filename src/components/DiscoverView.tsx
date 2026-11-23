import React, { useState } from 'react';
import { PostVideo } from '../types';
import { Search, Flame, TrendingUp, Hash, Play } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

interface DiscoverViewProps {
  posts: PostVideo[];
  onSelectPost: (post: PostVideo) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ posts, onSelectPost }) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = posts.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.caption || '').toLowerCase().includes(term) ||
      (p.username || '').toLowerCase().includes(term) ||
      (p.musicTitle || '').toLowerCase().includes(term) ||
      (p.tags || []).some((tag) => (tag || '').toLowerCase().includes(term))
    );
  });

  const tagStats = new Map<string, { videos: number; views: number }>();
  posts.forEach((p) => {
    (p.tags || []).forEach((tag) => {
      const clean = (tag || '').replace(/^#/, '').toLowerCase();
      if (!clean) return;
      const prev = tagStats.get(clean) || { videos: 0, views: 0 };
      tagStats.set(clean, {
        videos: prev.videos + 1,
        views: prev.views + (p.views || 0),
      });
    });
  });

  const baseTopics = [
    { key: 'rongin', title: t.exploreTitle },
    { key: 'bangladesh', title: t.trendingHashtags },
    { key: 'foryou', title: t.forYou },
    { key: 'music', title: t.originalSound },
  ];

  const trendingTopics = Array.from(tagStats.entries())
    .sort((a, b) => b[1].views - a[1].views || b[1].videos - a[1].videos)
    .slice(0, 4)
    .map(([key, stat]) => ({
      tag: `#${key}`,
      title: `${stat.videos} ${t.videosUnit}`,
      count: `${stat.views.toLocaleString()} ${t.views}`,
    }));

  const displayTopics =
    trendingTopics.length > 0
      ? trendingTopics
      : baseTopics.map((b) => ({
          tag: `#${b.key}`,
          title: b.title,
          count: `0 ${t.views}`,
        }));

  return (
    <div className="w-full h-full min-h-screen bg-black text-white overflow-y-auto pb-24 select-none">
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-white">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.searchDiscoverPlaceholder}
            className="w-full bg-transparent outline-none text-xs placeholder-zinc-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-xs text-zinc-500 hover:text-white px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trending Banner Carousel */}
        {!searchTerm && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#fe2c55] via-purple-600 to-[#25F4EE] p-0.5 shadow-xl">
            <div className="p-4 rounded-2xl bg-zinc-950/90 flex flex-col justify-between min-h-[110px]">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#fe2c55] mb-1">
                  <Flame className="w-4 h-4" />
                  Rongin Trending
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {t.trendingChallengeTitle}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {t.trendingChallengeDesc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trending Hashtag Sections */}
        {!searchTerm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#25F4EE]" />
                {t.trendingHashtags}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {displayTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchTerm(topic.tag.replace('#', ''))}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#fe2c55] text-left transition active:scale-95 flex flex-col justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1 text-xs font-bold text-white">
                    <Hash className="w-3.5 h-3.5 text-[#fe2c55]" />
                    {topic.tag}
                  </div>
                  <span className="text-[11px] text-zinc-400 line-clamp-1">{topic.title}</span>
                  <span className="text-[10px] font-semibold text-[#25F4EE]">{topic.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">
              {searchTerm ? `${t.resultsFor} "${searchTerm}"` : t.exploreTitle}
            </h3>
            <span className="text-xs text-zinc-500 font-semibold">{filteredPosts.length} {t.videosUnit}</span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs">
              {t.noVideosFound}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="relative aspect-[9/16] rounded-xl bg-zinc-900 overflow-hidden cursor-pointer group shadow-md"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                  
                  {/* Bottom details on card */}
                  <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 pointer-events-none">
                    <p className="text-xs font-semibold text-white line-clamp-1 drop-shadow">
                      {post.caption}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-zinc-300">
                      <span className="font-bold truncate">@{post.username}</span>
                      <span className="flex items-center gap-0.5 font-bold">
                        <Play className="w-3 h-3 fill-white" />
                        {post.views > 1000 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
