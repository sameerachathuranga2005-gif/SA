import React, { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMeetingStore } from '../../store/meetingStore';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  PhoneOff,
  Sparkles,
} from 'lucide-react';

export const MiniMeetingPlayer: React.FC = () => {
  const {
    isJoined,
    meetingId,
    title,
    localStream,
    isAudioMuted,
    isVideoOff,
    participants,
    toggleAudio,
    toggleVideo,
    leaveMeeting,
  } = useMeetingStore();

  const navigate = useNavigate();
  const location = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Show mini player only when user is joined to a meeting AND NOT currently on the meeting page!
  const isOnMeetingPage = location.pathname.startsWith('/meeting');
  const shouldShow = isJoined && !isOnMeetingPage;

  useEffect(() => {
    if (videoRef.current && localStream && shouldShow) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, shouldShow, isVideoOff]);

  if (!shouldShow) return null;

  const handleExpand = () => {
    navigate(`/meeting/${meetingId.replace(/-/g, '')}`);
  };

  const handleEnd = () => {
    leaveMeeting(false);
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-72 md:w-80 rounded-2xl bg-zinc-950/95 border border-cyan-500/40 shadow-2xl overflow-hidden backdrop-blur-xl animate-fade-in text-zinc-100 flex flex-col">
      {/* Header */}
      <div className="p-2.5 px-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-xs font-semibold truncate">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleExpand}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Expand to Full Meeting"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEnd}
            className="p-1 rounded-md text-red-400 hover:bg-red-500/20 transition-colors"
            title="Leave Meeting"
          >
            <PhoneOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Box */}
      <div
        onClick={handleExpand}
        className="relative w-full aspect-video bg-zinc-900 cursor-pointer overflow-hidden flex items-center justify-center group"
      >
        {!isVideoOff && localStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="text-xs text-zinc-400 font-medium">Camera Off</div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold text-white">
          Click to Expand
        </div>

        {/* Participants Badge */}
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/80 text-[10px] text-zinc-300 font-mono">
          {participants.length} in call
        </span>
      </div>

      {/* Mini Controls */}
      <div className="p-2 px-3 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAudio}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isAudioMuted ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-emerald-400'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-cyan-400'
            }`}
            title={isVideoOff ? 'Start Video' : 'Stop Video'}
          >
            {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          onClick={handleExpand}
          className="text-xs font-semibold text-cyan-400 hover:underline"
        >
          Return to call →
        </button>
      </div>
    </div>
  );
};

