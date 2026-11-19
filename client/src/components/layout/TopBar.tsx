import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common/Avatar';
import { NotificationsPopover } from '../common/NotificationsPopover';
import {
  Search,
  Bell,
  Copy,
  LogOut,
  ChevronDown,
  Video,
  Sparkles,
} from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeModule,
    setSearchOpen,
    isNotificationsOpen,
    setNotificationsOpen,
    showToast,
  } = useAppStore();

  const { user, friendRequests, logout } = useAuthStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const incomingRequestsCount = (friendRequests.incoming || []).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'feed':
        return {
          title: 'Social Feed',
          subtitle: 'Share updates, connect with teammates, and browse community stories',
        };
      case 'chats':
        return {
          title: 'Chats & Calls',
          subtitle: 'Real-time messaging, presence indicators, and instant direct call rooms',
        };
      case 'meetings':
        return {
          title: 'Meetings & Rooms',
          subtitle: 'Instant video conferencing with your unique Personal Meeting ID',
        };
    }
  };

  const currentInfo = getModuleTitle();

  const handleCopyPMI = () => {
    if (user?.personalMeetingId) {
      navigator.clipboard.writeText(user.personalMeetingId);
      showToast(`Copied Personal Meeting ID: ${user.personalMeetingId}`, 'success');
    }
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between sticky top-0 z-30">
      {/* Module Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {currentInfo.title}
          </h1>
          <p className="hidden md:block text-xs text-zinc-400 font-normal">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* User Search Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all text-xs"
        >
          <Search className="w-4 h-4 text-zinc-400" />
          <span className="hidden sm:inline">Find colleagues & friends</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-400">
            Search
          </kbd>
        </button>

        {/* Notifications & Friend Requests Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
            title="Friend Requests & Notifications"
          >
            <Bell className="w-4 h-4" />
            {incomingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-500 text-white font-semibold text-[11px] flex items-center justify-center border-2 border-zinc-950">
                {incomingRequestsCount}
              </span>
            )}
          </button>

          <NotificationsPopover />
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800"
          >
            <Avatar
              name={user?.name || 'User'}
              src={user?.avatar}
              size="sm"
              isOnline={true}
            />
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-12 w-72 glass-dropdown rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-zinc-100">
              <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
                <Avatar
                  name={user?.name || 'User'}
                  src={user?.avatar}
                  size="md"
                  isOnline={true}
                />
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm truncate">{user?.name}</h4>
                  <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="py-3 border-b border-zinc-800 text-xs text-zinc-400 space-y-2">
                <p className="italic text-zinc-300">"{user?.bio || 'SuperApp Member'}"</p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px]">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Video className="w-3 h-3 text-cyan-400" />
                    PMI:
                  </span>
                  <div className="flex items-center gap-1 font-mono text-zinc-200">
                    <span>{user?.personalMeetingId}</span>
                    <button
                      onClick={handleCopyPMI}
                      className="p-1 hover:text-brand-400 text-zinc-500"
                      title="Copy PMI"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Recruiter Note / Demo Info */}
              <div className="py-2.5 flex items-center gap-2 text-[11px] text-zinc-400 border-b border-zinc-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Phase 1 Architecture Active</span>
              </div>

              {/* Logout Action */}
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  logout();
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

