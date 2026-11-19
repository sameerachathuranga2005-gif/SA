import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { ISearchUserResult } from '../../types';
import { Avatar } from './Avatar';
import { Search, X, UserPlus, Check, Clock, Loader2, Video } from 'lucide-react';

export const UserSearchModal: React.FC = () => {
  const { isSearchOpen, setSearchOpen, showToast } = useAppStore();
  const { sendFriendRequest, acceptFriendRequest, fetchFriends } = useAuthStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ISearchUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      handleSearch('');
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  const handleSearch = async (searchStr: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchStr)}`);
      setResults(res.data.data || []);
    } catch (err: any) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val);
  };

  const handleAddFriend = async (user: ISearchUserResult) => {
    setActionLoadingId(user._id);
    try {
      await sendFriendRequest(user._id);
      showToast(`Friend request sent to ${user.name}!`, 'success');
      setResults((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, friendStatus: 'pending_sent' } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to send request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAcceptFriend = async (user: ISearchUserResult) => {
    setActionLoadingId(user._id);
    try {
      await acceptFriendRequest(user._id);
      await fetchFriends();
      showToast(`You and ${user.name} are now connected!`, 'success');
      setResults((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, friendStatus: 'friends' } : u))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to accept request', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Input */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/90">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search colleagues by name or email (e.g. Sarah, Marcus, demo)..."
            className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm md:text-base"
          />
          {loading && <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />}
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {results.length === 0 && !loading && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-zinc-400" />
              {query ? 'No users matching your search.' : 'Type a name or email to explore users across OmniSync.'}
            </div>
          )}

          {results.map((user) => (
            <div
              key={user._id}
              className="p-3.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800/80 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar
                  name={user.name}
                  src={user.avatar}
                  size="md"
                  isOnline={user.isOnline}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-zinc-200 text-sm truncate">{user.name}</h4>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-zinc-400">
                      <Video className="w-3 h-3 text-blue-400" />
                      {user.personalMeetingId}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                  <p className="text-xs text-zinc-500 truncate mt-0.5">{user.bio}</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0">
                {user.friendStatus === 'friends' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Check className="w-3.5 h-3.5" />
                    Friends
                  </span>
                )}

                {user.friendStatus === 'pending_sent' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    Requested
                  </span>
                )}

                {user.friendStatus === 'pending_received' && (
                  <button
                    disabled={actionLoadingId === user._id}
                    onClick={() => handleAcceptFriend(user)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actionLoadingId === user._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Accept
                  </button>
                )}

                {user.friendStatus === 'none' && (
                  <button
                    disabled={actionLoadingId === user._id}
                    onClick={() => handleAddFriend(user)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {actionLoadingId === user._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5 text-brand-400" />
                    )}
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 text-center text-xs text-zinc-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">ESC</kbd> to close search
        </div>
      </div>
    </div>
  );
};

