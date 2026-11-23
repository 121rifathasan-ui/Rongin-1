import React, { useState, useEffect } from 'react';
import { PostComment, UserProfile } from '../types';
import { X, Heart, Send, Smile, MessageCircle } from 'lucide-react';
import { useLanguage } from '../lib/languageContext';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  comments: PostComment[];
  currentUser: UserProfile | null;
  onAddComment: (postId: string, text: string) => void;
  onRequireAuth?: () => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  postId,
  comments,
  currentUser,
  onAddComment,
  onRequireAuth,
}) => {
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [localComments, setLocalComments] = useState<PostComment[]>(comments);

  // Sync if comments prop changes
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    if (!inputText.trim()) return;

    onAddComment(postId, inputText.trim());
    setInputText('');
  };

  const handleEmojiClick = (emoji: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setInputText((prev) => prev + emoji);
  };

  const toggleCommentLike = (commentId: string) => {
    if (!currentUser) {
      onRequireAuth?.();
      return;
    }
    setLocalComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.isLiked;
          return {
            ...c,
            isLiked: nextLiked,
            likes: c.likes + (nextLiked ? 1 : -1),
          };
        }
        return c;
      })
    );
  };

  const timeAgo = (timestamp: number) => {
    const diffMin = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMin < 1) return t.justNow;
    if (diffMin < 60) return `${diffMin} ${t.minAgoFull}`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ${t.hourAgoFull}`;
    return `${Math.floor(diffHours / 24)} ${t.dayAgoFull}`;
  };

  const emojis = ['❤️', '🔥', '👏', '😂', '😍', '🇧🇩', '✨', '🙌'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Click outside to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative w-full max-w-lg bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-2xl flex flex-col max-h-[75vh] h-[75vh] z-10 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="w-6" />
          <h3 className="text-sm font-extrabold text-white tracking-wide">
            {localComments.length} {t.commentsTitle}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 divide-y divide-zinc-800/40">
          {localComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
              <MessageCircle className="w-10 h-10 text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">{t.noCommentsYet}</p>
              <p className="text-xs text-zinc-500 mt-1">{t.beFirstToComment}</p>
            </div>
          ) : (
            localComments.map((comment) => (
              <div key={comment.id} className="pt-3 first:pt-0 flex items-start gap-3 group">
                <img
                  src={comment.userAvatar}
                  alt={comment.username}
                  className="w-9 h-9 rounded-full object-cover bg-zinc-800 border border-zinc-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-300">
                      @{comment.username}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {timeAgo(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed break-words">
                    {comment.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] font-semibold text-zinc-400">
                    <button
                      onClick={() => setInputText(`@${comment.username} `)}
                      className="hover:text-white transition"
                    >
                      {t.replyBtn}
                    </button>
                  </div>
                </div>

                {/* Like Comment Heart */}
                <button
                  onClick={() => toggleCommentLike(comment.id)}
                  className="flex flex-col items-center gap-0.5 text-zinc-400 hover:text-[#fe2c55] active:scale-90 transition p-1"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      comment.isLiked ? 'text-[#fe2c55] fill-[#fe2c55]' : 'stroke-[2]'
                    }`}
                  />
                  <span className="text-[10px] font-bold">
                    {comment.likes > 0 ? comment.likes : ''}
                  </span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick Emoji Bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-800/80 bg-zinc-950/50 overflow-x-auto scrollbar-none">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="text-lg hover:scale-125 active:scale-95 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2.5">
          <img
            src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80'}
            alt={currentUser?.name || 'User'}
            className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.writeCommentPlaceholder}
              className="w-full pl-3.5 pr-10 py-2.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#fe2c55] transition"
            />
            <button
              type="button"
              onClick={() => setInputText((prev) => prev + '❤️')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-9 h-9 rounded-full bg-[#fe2c55] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center active:scale-90 transition shadow-md shadow-[#fe2c55]/20 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
