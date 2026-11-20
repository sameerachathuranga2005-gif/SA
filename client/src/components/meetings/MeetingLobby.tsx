import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../store/meetingStore';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
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
  Lock,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Share2,
} from 'lucide-react';

export const MeetingLobby: React.FC = () => {
  const {
    meetingId,
    title,
    hostName,
    passcode,
    enteredPasscode,
    passcodeError,
    isHost,
    isInWaitingRoom,
    waitingRoomMessage,
    localStream,
    isAudioMuted,
    isVideoOff,
    setEnteredPasscode,
    toggleAudio,
    toggleVideo,
    joinMeeting,
    leaveMeeting,
  } = useMeetingStore();

  const { user } = useAuthStore();
  const { showToast } = useAppStore();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copiedPasscode, setCopiedPasscode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  const handleJoin = async () => {
    if (user) {
      if (!isHost && !enteredPasscode.trim()) {
        showToast('Please enter the 6-digit meeting passcode', 'error');
        return;
      }
      await joinMeeting(user);
    }
  };

  const handleCopyPasscode = () => {
    navigator.clipboard.writeText(passcode);
    setCopiedPasscode(true);
    showToast(`Copied Passcode: ${passcode}`, 'success');
    setTimeout(() => setCopiedPasscode(false), 2000);
  };

  const handleCopyInvite = () => {
    const cleanId = meetingId.replace(/-/g, '');
    const directLink = `${window.location.origin}/meeting/${cleanId}?pwd=${passcode}`;
    const text = `${hostName || user?.name || 'The host'} is inviting you to an OmniSync Video Meeting:

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

  // ==========================================
  // ZOOM WAITING ROOM SCREEN
  // ==========================================
  if (isInWaitingRoom) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative">
        <div className="absolute top-1/3 -left-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-24 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg bg-zinc-900/95 border border-zinc-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-amber-400 animate-spin-slow" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-900 border border-amber-500/40 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Waiting for Host Approval
            </h2>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {waitingRoomMessage || 'Please wait, the meeting host will let you in soon.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Meeting Topic:</span>
              <span className="font-bold text-zinc-200 truncate max-w-[200px]">{title}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Meeting ID:</span>
              <span className="font-mono font-bold text-cyan-400">{meetingId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Meeting Host:</span>
              <span className="font-semibold text-zinc-300">{hostName || 'Organizer'}</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                leaveMeeting();
                navigate('/');
              }}
              className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancel & Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STANDARD MEETING LOBBY & PRE-CHECK
  // ==========================================
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
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400">ID: {meetingId}</span>
          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
            title="Copy Formatted Invitation"
          >
            {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedInvite ? 'Copied' : 'Invite'}</span>
          </button>
        </div>
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
            <span>Passcode Protected</span>
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

        {/* Meeting Security & Passcode Row */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3">
          {isHost ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-300">Room Passcode:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{passcode}</span>
              </div>
              <button
                onClick={handleCopyPasscode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                {copiedPasscode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPasscode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Meeting Passcode
                </span>
                <span className="text-[11px] text-zinc-500 font-normal">Required to join</span>
              </label>
              <input
                type="text"
                maxLength={8}
                value={enteredPasscode}
                onChange={(e) => setEnteredPasscode(e.target.value)}
                placeholder="Enter 6-digit passcode..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {passcodeError && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {passcodeError}
                </p>
              )}
            </div>
          )}
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

