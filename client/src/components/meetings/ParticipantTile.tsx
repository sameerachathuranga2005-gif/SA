import React, { useEffect, useRef } from 'react';
import { IParticipant } from '../../types';
import { Avatar } from '../common/Avatar';
import { useMeetingStore } from '../../store/meetingStore';
import { VIRTUAL_BACKGROUND_PRESETS } from '../../services/videoFilters';
import {
  Mic,
  MicOff,
  Hand,
  Pin,
  Sparkles,
} from 'lucide-react';

interface ParticipantTileProps {
  participant: IParticipant;
  isSpeakerView?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  className?: string;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  isPinned,
  onPin,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { virtualBg } = useMeetingStore();

  const isSelf = participant.id === 'self';
  const activeBgPreset = isSelf
    ? VIRTUAL_BACKGROUND_PRESETS.find((p) => p.id === virtualBg)
    : null;

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.isVideoOn, virtualBg]);

  const hasVideoStream = participant.stream && participant.isVideoOn;

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 border transition-all duration-200 group flex items-center justify-center select-none shadow-lg ${
        participant.isSpeaking
          ? 'border-emerald-500 shadow-emerald-500/20 shadow-md ring-2 ring-emerald-500/50'
          : 'border-zinc-800/80 hover:border-zinc-700'
      } ${className}`}
    >
      {/* Virtual Background Image or Solid Chroma Screen (Blue Screen / Green Screen) */}
      {isSelf && hasVideoStream && activeBgPreset?.type === 'image' && activeBgPreset.imageUrl && (
        <img
          src={activeBgPreset.imageUrl}
          alt="Virtual Background"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {isSelf && hasVideoStream && activeBgPreset?.type === 'color' && activeBgPreset.bgColor && (
        <div
          style={{ backgroundColor: activeBgPreset.bgColor }}
          className="absolute inset-0 w-full h-full z-0 flex items-center justify-center"
        >
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 font-bold">
            {activeBgPreset.label}
          </span>
        </div>
      )}

      {/* Real Video Stream */}
      {hasVideoStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.id === 'self'}
          style={{
            filter: isSelf && activeBgPreset?.cssFilter ? activeBgPreset.cssFilter : undefined,
            opacity: isSelf && activeBgPreset?.type === 'image' ? 0.9 : 1,
          }}
          className={`relative z-10 w-full h-full object-cover ${
            participant.id === 'self' && !participant.isScreenSharing ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        /* Video Off Avatar View */
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="relative">
            <Avatar
              name={participant.name}
              src={participant.avatar}
              size="xl"
              showStatus={false}
              className="ring-4 ring-zinc-800 shadow-2xl"
            />
            {participant.isSpeaking && (
              <span className="absolute -inset-2 rounded-full border-2 border-emerald-500 animate-ping opacity-75 pointer-events-none" />
            )}
          </div>
          <span className="text-xs font-medium text-zinc-400 max-w-[180px] truncate">
            {participant.name}
          </span>
        </div>
      )}

      {/* Screen Sharing Watermark Badge */}
      {participant.isScreenSharing && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600/90 text-white font-semibold text-[11px] shadow-md backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Screen Sharing</span>
        </div>
      )}

      {/* Hand Raised Banner */}
      {participant.isHandRaised && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-zinc-950 font-bold text-xs shadow-lg animate-bounce">
          <Hand className="w-4 h-4" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Pin Video Trigger */}
      {onPin && (
        <button
          onClick={onPin}
          className={`absolute top-3 right-3 p-1.5 rounded-lg backdrop-blur-md transition-all ${
            isPinned
              ? 'bg-brand-500 text-white'
              : 'bg-zinc-900/70 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-zinc-800'
          }`}
          title={isPinned ? 'Unpin video' : 'Pin video'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Bottom Name Tag Pill */}
      <div className="absolute bottom-3 left-3 max-w-[80%] flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 text-zinc-200 text-xs shadow-md">
        {/* Audio Status */}
        {participant.isAudioOn ? (
          <div className="flex items-center gap-0.5" title="Audio connected">
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            {participant.isSpeaking && (
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse" />
                <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
                <span className="w-0.5 h-2 bg-emerald-400 animate-pulse delay-150" />
              </div>
            )}
          </div>
        ) : (
          <span title="Muted">
            <MicOff className="w-3.5 h-3.5 text-red-400" />
          </span>
        )}

        {/* Participant Name */}
        <span className="font-medium truncate">
          {participant.id === 'self' ? `${participant.name} (You)` : participant.name}
        </span>

        {/* Host Badge */}
        {participant.isHost && (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300 border border-brand-500/40">
            Host
          </span>
        )}
      </div>
    </div>
  );
};
