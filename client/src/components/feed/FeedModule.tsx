import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../common/Avatar';
import { ISocialPost } from '../../types';
import {
  Image,
  Smile,
  Send,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  Plus,
  Users,
  Video,
  Sparkles,
} from 'lucide-react';

export const FeedModule: React.FC = () => {
  const { user, friends } = useAuthStore();
  const { showToast, setSearchOpen } = useAppStore();

  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Initial mock feed
  const [posts, setPosts] = useState<ISocialPost[]>([
    {
      id: 'post-1',
      author: {
        name: 'Sarah Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
        role: 'Staff AI Engineer',
        online: true,
      },
      content:
        'Just benchmarked our real-time WebRTC audio & video streaming pipeline with sub-50ms glass-to-glass latency! 🚀 Blending Zoom-tier video meetings, WhatsApp-style instant chats, and social feeds under a unified TypeScript monorepo architecture.',
      createdAt: '15 mins ago',
      likes: 24,
      liked: false,
      commentsCount: 3,
      comments: [
        {
          id: 'c-1',
          author: 'David Kim',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
          content: 'The latency numbers look fantastic! Dark mode UI shell matches Linear & Discord vibes.',
          createdAt: '10 mins ago',
        },
      ],
    },
    {
      id: 'post-2',
      author: {
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
        role: 'VP of Engineering',
        online: false,
      },
      content:
        'Excited to welcome the new full-stack engineering team to OmniSync! Our Phase 1 Unified Auth, Socket presence engine, and responsive app shell are officially in place.',
      createdAt: '2 hours ago',
      likes: 42,
      liked: true,
      commentsCount: 5,
      comments: [
        {
          id: 'c-2',
          author: 'Marcus Vance',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces',
          content: 'Proud of the architecture. Clean separation of concerns across controllers, services, and Socket.io.',
          createdAt: '1 hour ago',
        },
      ],
    },
  ]);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: ISocialPost = {
      id: `post-${Date.now()}`,
      author: {
        name: user?.name || 'Alex Johnson',
        avatar: user?.avatar || '',
        role: 'Lead Architect',
        online: true,
      },
      content: selectedTag ? `[${selectedTag}] ${newPostContent.trim()}` : newPostContent.trim(),
      createdAt: 'Just now',
      likes: 0,
      liked: false,
      commentsCount: 0,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setSelectedTag(null);
    showToast('Post published to your network!', 'success');
  };

  const handleToggleLike = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const nextLiked = !post.liked;
          return {
            ...post,
            liked: nextLiked,
            likes: nextLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: `comm-${Date.now()}`,
            author: user?.name || 'You',
            avatar: user?.avatar || '',
            content: commentInput.trim(),
            createdAt: 'Just now',
          };
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );

    setCommentInput('');
    showToast('Comment added!', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Column (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stories Horizontal Strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
            {/* Create Story Card */}
            <div
              onClick={() => showToast('Stories feature ready for Phase 2 video uploads', 'info')}
              className="group relative w-28 h-40 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer overflow-hidden flex flex-col justify-end p-2.5 shrink-0 transition-all hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-600/20 via-transparent to-zinc-950/90" />
              <div className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md">
                <Plus className="w-4 h-4" />
              </div>
              <span className="relative z-10 text-xs font-semibold text-zinc-100">Create Story</span>
            </div>

            {/* Friends Stories */}
            {friends.slice(0, 5).map((friend, idx) => (
              <div
                key={friend._id}
                onClick={() => showToast(`Viewing ${friend.name}'s story update`, 'info')}
                className="group relative w-28 h-40 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer overflow-hidden flex flex-col justify-between p-2.5 shrink-0 transition-all hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/40 via-transparent to-zinc-950/90" />
                <div className="relative z-10 ring-2 ring-brand-500 rounded-full w-8 h-8 overflow-hidden">
                  <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-zinc-100 truncate">{friend.name}</p>
                  <p className="text-[10px] text-zinc-400">{idx * 2 + 1}h ago</p>
                </div>
              </div>
            ))}
          </div>

          {/* Create Post Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-md">
            <div className="flex items-start gap-3">
              <Avatar
                name={user?.name || 'User'}
                src={user?.avatar}
                size="md"
                isOnline={true}
              />
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'there'}?`}
                  rows={3}
                  className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 resize-none transition-colors"
                />

                {/* Tag badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {['🚀 Announcement', '💡 Architecture', '🎉 Milestone', '☕ Casual'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        selectedTag === tag
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                          : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/40 hover:bg-zinc-800'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/70">
                  <div className="flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={() => showToast('Photo upload ready for Phase 2 media storage', 'info')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs transition-colors"
                    >
                      <Image className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline">Photo/Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('Emoji picker enabled', 'info')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-xs transition-colors"
                    >
                      <Smile className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">Feeling</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white font-medium text-xs transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Social Posts List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-md space-y-4"
              >
                {/* Author Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={post.author.name}
                      src={post.author.avatar}
                      size="md"
                      isOnline={post.author.online}
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-100">{post.author.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>{post.author.role}</span>
                        <span>•</span>
                        <span>{post.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Post Metrics & Actions */}
                <div className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                        post.liked
                          ? 'text-rose-500 bg-rose-500/10'
                          : 'hover:text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${post.liked ? 'fill-rose-500' : ''}`}
                      />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveCommentPostId(
                          activeCommentPostId === post.id ? null : post.id
                        )
                      }
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      showToast('Post link copied to clipboard!', 'success');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Comments Accordion */}
                {activeCommentPostId === post.id && (
                  <div className="pt-3 border-t border-zinc-800/70 space-y-3">
                    {/* Comment List */}
                    <div className="space-y-2">
                      {post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60"
                        >
                          <Avatar name={comment.author} src={comment.avatar} size="xs" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-200">
                                {comment.author}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {comment.createdAt}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="Write a supportive reply..."
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* Right Sidebar (1 col on lg) */}
        <aside className="space-y-6">
          {/* Active Network Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-400" />
                <h3 className="font-semibold text-sm text-zinc-200">Connected Friends</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                {friends.filter((f) => f.isOnline).length} online
              </span>
            </div>

            <div className="py-3 space-y-2.5">
              {friends.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-zinc-500">No connected friends yet.</p>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="mt-2 text-xs text-brand-400 hover:underline"
                  >
                    Find colleagues to connect
                  </button>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-zinc-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={friend.name}
                        src={friend.avatar}
                        size="sm"
                        isOnline={friend.isOnline}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-200 truncate">{friend.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{friend.bio}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => showToast(`Opening meeting with ${friend.name}`, 'info')}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-500/20 text-zinc-400 hover:text-cyan-400 transition-colors shrink-0"
                      title="Quick Meeting"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 shadow-md">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-sm text-zinc-200">Trending in Tech</h3>
            </div>

            <div className="py-3 space-y-3 text-xs">
              {[
                { tag: '#WebRTC2025', posts: '12.4k posts', subtitle: 'Ultra-low latency streaming' },
                { tag: '#TypeScript57', posts: '8.2k posts', subtitle: 'Strict typing patterns' },
                { tag: '#SuperAppEvolution', posts: '5.1k posts', subtitle: 'Unified productivity suites' },
                { tag: '#FullStackArch', posts: '3.9k posts', subtitle: 'Scalable monorepos' },
              ].map((item) => (
                <div
                  key={item.tag}
                  className="p-2 rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  onClick={() => showToast(`Filtering feed by ${item.tag}`, 'info')}
                >
                  <p className="font-semibold text-brand-400">{item.tag}</p>
                  <p className="text-[11px] text-zinc-300">{item.subtitle}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{item.posts}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phase 1 Status Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-900 border border-indigo-500/30">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Phase 1 Milestone Complete
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Unified schema, JWT authentication, presence engine, and responsive app shell active.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

