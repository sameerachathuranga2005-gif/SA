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
  VolumeX,
  UserX,
  Check,
  Clock,
  Share2,
} from 'lucide-react';

export const ParticipantsDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    participants,
    isHost,
    waitingUsers,
    admitWaitingUser,
    denyWaitingUser,
    admitAllWaitingUsers,
    hostMuteParticipant,
    hostStopParticipantVideo,
    hostKickParticipant,
    muteAllParticipants,
    meetingId,
    title,
    hostName,
    passcode,
  } = useMeetingStore();

  const { showToast } = useAppStore();
  const [filter, setFilter] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (activeDrawer !== 'participants') return null;

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCopyInvite = () => {
    const cleanId = meetingId.replace(/-/g, '');
    const directLink = `${window.location.origin}/meeting/${cleanId}?pwd=${passcode}`;
    const text = `${hostName || 'The host'} is inviting you to an OmniSync Video Meeting:

Topic: ${title}
Meeting ID: ${meetingId}
Passcode: ${passcode}

Join Meeting (1-Click Direct Link):
${directLink}`;

    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    showToast('Meeting invitation copied to clipboard!', 'success');
    setTimeout(() => setCopiedInvite(false), 2000);
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

      {/* Waiting Room Section (Host Only) */}
      {isHost && waitingUsers.length > 0 && (
        <div className="p-3 border-b border-amber-500/20 bg-amber-500/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Waiting Room ({waitingUsers.length})</span>
            </div>
            <button
              onClick={() => {
                admitAllWaitingUsers();
                showToast(`Admitted all ${waitingUsers.length} participants`, 'success');
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-bold text-amber-300 border border-amber-500/30 transition-colors"
            >
              Admit All
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {waitingUsers.map((u) => (
              <div
                key={u.socketId}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar name={u.userName} src={u.avatar} size="xs" showStatus={false} />
                  <span className="text-xs font-semibold text-zinc-200 truncate">{u.userName}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      admitWaitingUser(u.socketId);
                      showToast(`Admitted ${u.userName}`, 'success');
                    }}
                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                    title="Admit to meeting"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      denyWaitingUser(u.socketId);
                      showToast(`Denied entry for ${u.userName}`, 'info');
                    }}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
                    title="Deny entry"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 flex items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
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

            {/* Controls / Indicators */}
            <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
              {p.isHandRaised && <Hand className="w-4 h-4 text-amber-400 animate-bounce" />}

              {/* Host Quick Actions for Remote Participants */}
              {isHost && p.id !== 'self' ? (
                <div className="flex items-center gap-1 bg-zinc-950/80 px-1.5 py-1 rounded-lg border border-zinc-800">
                  {/* Mute Mic */}
                  <button
                    onClick={() => {
                      hostMuteParticipant(p.socketId);
                      showToast(`Muted ${p.name}'s microphone`, 'info');
                    }}
                    disabled={!p.isAudioOn}
                    className={`p-1 rounded transition-colors ${
                      p.isAudioOn
                        ? 'text-emerald-400 hover:bg-zinc-800 hover:text-red-400'
                        : 'text-red-400 opacity-60 cursor-not-allowed'
                    }`}
                    title={p.isAudioOn ? `Mute ${p.name}` : `${p.name} is muted`}
                  >
                    {p.isAudioOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Stop Video */}
                  <button
                    onClick={() => {
                      hostStopParticipantVideo(p.socketId);
                      showToast(`Turned off ${p.name}'s video`, 'info');
                    }}
                    disabled={!p.isVideoOn}
                    className={`p-1 rounded transition-colors ${
                      p.isVideoOn
                        ? 'text-cyan-400 hover:bg-zinc-800 hover:text-red-400'
                        : 'text-zinc-600 opacity-60 cursor-not-allowed'
                    }`}
                    title={p.isVideoOn ? `Turn off ${p.name}'s camera` : `${p.name}'s camera is off`}
                  >
                    {p.isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Kick / Remove */}
                  <button
                    onClick={() => {
                      hostKickParticipant(p.socketId);
                      showToast(`Removed ${p.name} from the meeting`, 'info');
                    }}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={`Remove ${p.name} from meeting`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Regular participant status badges */
                <div className="flex items-center gap-1.5">
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
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Host Actions */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 flex items-center gap-2">
        <button
          onClick={handleCopyInvite}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-zinc-800 transition-colors"
          title="Copy Formatted Meeting Invitation"
        >
          {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{copiedInvite ? 'Copied' : 'Copy Invite'}</span>
        </button>

        {isHost && (
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
        )}
      </div>
    </aside>
  );
};

