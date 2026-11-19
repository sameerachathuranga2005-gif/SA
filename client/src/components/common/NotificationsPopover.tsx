import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Avatar } from './Avatar';
import { UserCheck, UserX, Bell, Loader2, Clock } from 'lucide-react';

export const NotificationsPopover: React.FC = () => {
  const { friendRequests, acceptFriendRequest, rejectFriendRequest } = useAuthStore();
  const { isNotificationsOpen, setNotificationsOpen, showToast } = useAppStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isNotificationsOpen) return null;

  const incoming = friendRequests.incoming || [];
  const outgoing = friendRequests.outgoing || [];

  const handleAccept = async (senderId: string, name: string) => {
    setLoadingId(senderId);
    try {
      await acceptFriendRequest(senderId);
      showToast(`Connected with ${name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not accept request', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (senderId: string, name: string) => {
    setLoadingId(senderId);
    try {
      await rejectFriendRequest(senderId);
      showToast(`Declined request from ${name}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Could not decline request', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      className="absolute right-0 top-12 w-80 sm:w-96 glass-dropdown rounded-2xl shadow-2xl z-50 p-4 animate-fade-in text-zinc-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" />
          <h3 className="font-semibold text-sm">Notifications & Requests</h3>
        </div>
        <button
          onClick={() => setNotificationsOpen(false)}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          Close
        </button>
      </div>

      <div className="py-2 max-h-96 overflow-y-auto space-y-3">
        {/* Incoming Requests */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-2">
            <span>Incoming Friend Requests</span>
            <span className="px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[11px]">
              {incoming.length}
            </span>
          </div>

          {incoming.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center">No pending incoming requests</p>
          ) : (
            incoming.map((item) => (
              <div
                key={item.requestId}
                className="p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 mb-2 flex items-start justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={item.user.name} src={item.user.avatar} size="sm" isOnline={item.user.isOnline} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{item.user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{item.user.bio}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={loadingId === item.user._id}
                    onClick={() => handleAccept(item.user._id, item.user.name)}
                    className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                    title="Accept Friend Request"
                  >
                    {loadingId === item.user._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    disabled={loadingId === item.user._id}
                    onClick={() => handleReject(item.user._id, item.user.name)}
                    className="p-1.5 rounded-lg bg-zinc-700 hover:bg-red-500/30 text-zinc-300 hover:text-red-400 transition-colors"
                    title="Decline"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Outgoing Requests */}
        {outgoing.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400 mb-2">
              <span>Outgoing Sent Requests</span>
              <span className="text-[11px] text-zinc-500">{outgoing.length} pending</span>
            </div>
            {outgoing.map((item) => (
              <div
                key={item.requestId}
                className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs text-zinc-300 mb-1"
              >
                <div className="flex items-center gap-2 truncate">
                  <Avatar name={item.user.name} src={item.user.avatar} size="xs" showStatus={false} />
                  <span className="truncate">{item.user.name}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                  <Clock className="w-3 h-3" />
                  Sent
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

