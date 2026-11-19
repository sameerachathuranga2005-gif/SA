import React from 'react';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common/Avatar';
import { ActiveModule } from '../../types';
import {
  Newspaper,
  MessageSquare,
  Video,
  LogOut,
  Copy,
  Sparkles,
  Layers,
} from 'lucide-react';

interface NavItem {
  id: ActiveModule;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number | string;
  accentColor: string;
}

export const NavRail: React.FC = () => {
  const { activeModule, setActiveModule, showToast } = useAppStore();
  const { user, friends, logout } = useAuthStore();

  const onlineFriendsCount = friends.filter((f) => f.isOnline).length;

  const navItems: NavItem[] = [
    {
      id: 'feed',
      label: 'Social Feed',
      icon: Newspaper,
      accentColor: 'hover:text-blue-400 group-hover:bg-blue-500/10',
    },
    {
      id: 'chats',
      label: 'Chats & Calls',
      icon: MessageSquare,
      badge: onlineFriendsCount > 0 ? `${onlineFriendsCount} on` : undefined,
      accentColor: 'hover:text-emerald-400 group-hover:bg-emerald-500/10',
    },
    {
      id: 'meetings',
      label: 'Meetings',
      icon: Video,
      accentColor: 'hover:text-cyan-400 group-hover:bg-cyan-500/10',
    },
  ];

  const handleCopyPMI = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.personalMeetingId) {
      navigator.clipboard.writeText(user.personalMeetingId);
      showToast(`Copied Personal Meeting ID: ${user.personalMeetingId}`, 'success');
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-zinc-950 border-r border-zinc-800/80 select-none shrink-0 h-screen sticky top-0 z-30 transition-all duration-200">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-zinc-800/80 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="hidden lg:flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white">OmniSync</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              v1.0
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 truncate">SuperApp Platform</span>
        </div>
      </div>

      {/* Module Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        <div className="hidden lg:block px-3 mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
          Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-zinc-800/90 text-white shadow-sm border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-500 shadow-md shadow-brand-500/50" />
              )}

              <div
                className={`p-1.5 rounded-lg transition-colors ${
                  isActive
                    ? item.id === 'feed'
                      ? 'text-blue-400 bg-blue-500/10'
                      : item.id === 'chats'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-cyan-400 bg-cyan-500/10'
                    : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>

              <span className="hidden lg:inline truncate text-left flex-1">{item.label}</span>

              {item.badge && (
                <span className="hidden lg:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed rail */}
              <div className="lg:hidden absolute left-full ml-3 px-2.5 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-zinc-700">
                {item.label}
              </div>
            </button>
          );
        })}

        {/* Quick Zoom PMI badge card */}
        <div className="hidden lg:block mt-8 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Personal Meeting
            </span>
          </div>
          <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-lg font-mono text-zinc-200 text-[11px] border border-zinc-800">
            <span>{user?.personalMeetingId || 'Loading...'}</span>
            <button
              onClick={handleCopyPMI}
              className="p-1 hover:text-brand-400 text-zinc-500 transition-colors"
              title="Copy Personal Meeting ID"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80">
        <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              name={user?.name || 'User'}
              src={user?.avatar}
              size="sm"
              isOnline={true}
            />
            <div className="hidden lg:flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</span>
              <span className="text-[11px] text-zinc-500 truncate">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

