import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import { Avatar } from '../common/Avatar';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Video as VideoIcon,
} from 'lucide-react';

export const MeetingLobby: React.FC = () => {
  const {
    meetingId,
    title,
    localStream,
    isAudioMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    joinMeeting,
  } = useMeetingStore();

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  const handleJoin = async () => {
    if (user) {
      await joinMeeting(user);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back Button */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>
        <span className="text-xs font-mono text-cyan-400">Meeting ID: {meetingId}</span>
      </div>

      <div className="w-full max-w-2xl bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-cyan-400" />
              {title}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ready to connect? Test your audio and video before entering.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HD Ready</span>
          </div>
        </div>

        {/* Live Video Preview Box */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
          {!isVideoOff && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Avatar
                name={user?.name || 'User'}
                src={user?.avatar}
                size="xl"
                showStatus={false}
                className="ring-4 ring-zinc-800"
              />
              <span className="text-xs text-zinc-400">Camera is off</span>
            </div>
          )}

          {/* Device Controls Floating Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-zinc-800/80 shadow-lg">
            <button
              onClick={toggleAudio}
              className={`p-2.5 rounded-xl transition-all ${
                isAudioMuted
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400'
              }`}
              title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-2.5 rounded-xl transition-all ${
                isVideoOff
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-cyan-400'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Join Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Connecting as <strong className="text-zinc-200">{user?.name}</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleJoin}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition-all"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

