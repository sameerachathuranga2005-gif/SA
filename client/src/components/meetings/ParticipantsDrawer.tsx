import React, { useState } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../common/Avatar';
import {
  Users,
  X,
  Search,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Copy,
  VolumeX,
} from 'lucide-react';

export const ParticipantsDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    participants,
    muteAllParticipants,
    meetingId,
  } = useMeetingStore();

  const { showToast } = useAppStore();
  const [filter, setFilter] = useState('');

  if (activeDrawer !== 'participants') return null;

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopyLink = () => {
    const link = `${window.location.origin}/meeting/${meetingId.replace(/-/g, '')}`;
    navigator.clipboard.writeText(link);
    showToast('Meeting link copied to clipboard!', 'success');
  };

  return (
    <aside className="w-80 md:w-96 bg-zinc-950/95 border-l border-zinc-800/80 flex flex-col h-full shrink-0 z-20 backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-sm text-zinc-100">
            Participants ({participants.length})
          </h3>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-800/80">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search participants..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={p.name} src={p.avatar} size="sm" showStatus={false} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs text-zinc-200 truncate">
                    {p.id === 'self' ? `${p.name} (You)` : p.name}
                  </span>
                  {p.isHost && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300">
                      Host
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-500 truncate block">
                  {p.isSpeaking ? 'Speaking...' : p.isAudioOn ? 'Audio On' : 'Muted'}
                </span>
              </div>
            </div>

            {/* Media Indicators */}
            <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
              {p.isHandRaised && <Hand className="w-4 h-4 text-amber-400 animate-bounce" />}
              {p.isAudioOn ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <MicOff className="w-4 h-4 text-red-400" />
              )}
              {p.isVideoOn ? (
                <Video className="w-4 h-4 text-cyan-400" />
              ) : (
                <VideoOff className="w-4 h-4 text-zinc-600" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Host Actions */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Invite Link</span>
        </button>

        <button
          onClick={() => {
            muteAllParticipants();
            showToast('All participants have been muted', 'info');
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-red-500/20 text-xs font-semibold text-red-400 border border-zinc-800 transition-colors"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>Mute All</span>
        </button>
      </div>
    </aside>
  );
};

