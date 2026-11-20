import React, { useState, useRef, useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Shield,
  Users,
  MessageSquare,
  Share2,
  Circle,
  Smile,
  ChevronUp,
  LayoutGrid,
  Maximize2,
  Minimize2,
  LogOut,
  Hand,
  Check,
  Palette,
  Sparkles,
  Command,
  PictureInPicture2,
  Copy,
  Sliders,
} from 'lucide-react';

export const MeetingControls: React.FC = () => {
  const {
    meetingId,
    title,
    hostName,
    passcode,
    isAudioMuted,
    isVideoOff,
    isScreenSharing,
    isRecording,
    recordingDuration,
    isHandRaised,
    isWhiteboardOpen,
    isVideoSettingsModalOpen,
    isProNoiseSuppressionEnabled,
    participants,
    viewMode,
    activeDrawer,
    unreadChatCount,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleWhiteboard,
    toggleRecord,
    toggleHandRaised,
    toggleProNoiseSuppression,
    sendReaction,
    setViewMode,
    setActiveDrawer,
    setLeaveModalOpen,
    setVirtualBgModalOpen,
    setVideoSettingsModalOpen,
    setShortcutsModalOpen,
  } = useMeetingStore();

  const { showToast } = useAppStore();
  const [copiedLink, setCopiedLink] = useState(false);

  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [videoMenuOpen, setVideoMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const reactionsRef = useRef<HTMLDivElement>(null);
  const audioMenuRef = useRef<HTMLDivElement>(null);
  const videoMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setReactionsOpen(false);
      }
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target as Node)) {
        setAudioMenuOpen(false);
      }
      if (videoMenuRef.current && !videoMenuRef.current.contains(e.target as Node)) {
        setVideoMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyInviteLink = () => {
    const cleanId = meetingId.replace(/-/g, '');
    const directUrl = `${window.location.origin}/meeting/${cleanId}?pwd=${passcode}`;
    const text = `${hostName || 'The host'} is inviting you to a scheduled OmniSync Video Meeting:

Topic: ${title}
Meeting ID: ${meetingId}
Passcode: ${passcode}

Join Meeting via Direct Link:
${directUrl}`;

    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    showToast('Meeting invitation copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleNativePiP = async () => {
    try {
      const videos = Array.from(document.querySelectorAll('video'));
      const activeVideo = videos.find((v) => !v.paused && v.readyState >= 2);
      if (activeVideo && (document as any).pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await activeVideo.requestPictureInPicture();
        }
      }
    } catch (e) {
      console.warn('PiP not available or permission denied:', e);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const emojis = ['👏', '👍', '❤️', '🤣', '😮', '🎉'];

  return (
    <footer className="h-20 bg-zinc-950/95 border-t border-zinc-800/80 px-4 md:px-6 flex items-center justify-between z-30 select-none backdrop-blur-xl">
      {/* Left: Audio & Video Controls */}
      <div className="flex items-center gap-2">
        {/* Mute / Unmute Button */}
        <div className="relative" ref={audioMenuRef}>
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden shadow-sm">
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
                isAudioMuted ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {isAudioMuted ? (
                <MicOff className="w-4 h-4 text-red-400" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-400" />
              )}
              <span className="hidden sm:inline">{isAudioMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={() => setAudioMenuOpen(!audioMenuOpen)}
              className="p-2 border-l border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="Audio Settings"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Audio Device Selector Dropdown */}
          {audioMenuOpen && (
            <div className="absolute bottom-14 left-0 w-64 glass-dropdown rounded-2xl p-3 shadow-2xl z-50 text-xs text-zinc-300 space-y-2 animate-fade-in">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Select Microphone
              </span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-100 flex items-center justify-between">
                <span>Default Microphone (Built-in)</span>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>

              {/* Pro Noise Suppression Toggle */}
              <button
                onClick={() => toggleProNoiseSuppression()}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                  isProNoiseSuppressionEnabled
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 border-zinc-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Pro Noise Cancellation</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isProNoiseSuppressionEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {isProNoiseSuppressionEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                onClick={() => {
                  setAudioMenuOpen(false);
                  setVideoSettingsModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-colors"
              >
                <span>Studio Audio Settings</span>
                <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              <div className="pt-2 border-t border-zinc-800 text-zinc-400 text-[11px]">
                <span>High Fidelity Audio • Web Audio DSP Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Start / Stop Video Button */}
        <div className="relative" ref={videoMenuRef}>
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden shadow-sm">
            <button
              onClick={toggleVideo}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors ${
                isVideoOff ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {isVideoOff ? (
                <VideoOff className="w-4 h-4 text-red-400" />
              ) : (
                <Video className="w-4 h-4 text-cyan-400" />
              )}
              <span className="hidden sm:inline">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
            </button>

            <button
              onClick={() => setVideoMenuOpen(!videoMenuOpen)}
              className="p-2 border-l border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              title="Video Settings & Virtual Backgrounds"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Video Settings Dropdown with Virtual Background trigger */}
          {videoMenuOpen && (
            <div className="absolute bottom-14 left-0 w-72 glass-dropdown rounded-2xl p-3 shadow-2xl z-50 text-xs text-zinc-300 space-y-2 animate-fade-in">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Camera & Backgrounds
              </span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-100 flex items-center justify-between">
                <span>Integrated HD Camera</span>
                <Check className="w-3.5 h-3.5 text-cyan-400" />
              </div>

              {/* Virtual Background & Blur Trigger */}
              <button
                onClick={() => {
                  setVideoMenuOpen(false);
                  setVirtualBgModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 font-semibold border border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Virtual Background & Blur</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20">PRO</span>
              </button>

              {/* Video Studio Settings Trigger */}
              <button
                onClick={() => {
                  setVideoMenuOpen(false);
                  setVideoSettingsModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Touch Up & Studio Effects</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20">STUDIO</span>
              </button>

              <div className="pt-2 border-t border-zinc-800 text-zinc-400">
                <span>720p HD Video • Auto Light Correction</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Collaboration Actions */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Security Controls */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'security' ? null : 'security')}
          className={`flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
            activeDrawer === 'security'
              ? 'bg-zinc-800 text-brand-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          title="Host Security Settings"
        >
          <Shield className="w-5 h-5" />
          <span className="text-[10px] mt-1 hidden md:block">Security</span>
        </button>

        {/* Participants */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'participants' ? null : 'participants')}
          className={`relative flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
            activeDrawer === 'participants'
              ? 'bg-zinc-800 text-cyan-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          title="Participants List"
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 px-1 text-[10px] font-mono font-bold rounded-full bg-cyan-600 text-white">
              {participants.length}
            </span>
          </div>
          <span className="text-[10px] mt-1 hidden md:block">Users</span>
        </button>

        {/* In-Meeting Chat */}
        <button
          onClick={() => setActiveDrawer(activeDrawer === 'chat' ? null : 'chat')}
          className={`relative flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
            activeDrawer === 'chat'
              ? 'bg-zinc-800 text-brand-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          title="In-Meeting Chat"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 text-[10px] font-bold rounded-full bg-brand-500 text-white flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 hidden md:block">Chat</span>
        </button>

        {/* Screen Share (Iconic Zoom Emerald Button) */}
        <button
          onClick={toggleScreenShare}
          className={`flex flex-col items-center justify-center px-3 md:px-4 py-1.5 rounded-xl transition-all ${
            isScreenSharing
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
          }`}
          title="Share Screen"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-semibold hidden md:block">
            {isScreenSharing ? 'Stop Share' : 'Share'}
          </span>
        </button>

        {/* Copy Invite Link */}
        <button
          onClick={handleCopyInviteLink}
          className="flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl text-zinc-400 hover:text-cyan-300 hover:bg-zinc-900 transition-all"
          title="Copy Meeting Invite Link"
        >
          {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-400" />}
          <span className="text-[10px] mt-1 hidden md:block">{copiedLink ? 'Copied' : 'Invite'}</span>
        </button>

        {/* Interactive Whiteboard */}
        <button
          onClick={toggleWhiteboard}
          className={`flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
            isWhiteboardOpen
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          title="Collaborative Whiteboard"
        >
          <Palette className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] mt-1 hidden md:block">Board</span>
        </button>

        {/* Video & Audio Studio */}
        <button
          onClick={() => setVideoSettingsModalOpen(true)}
          className={`flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
            isVideoSettingsModalOpen
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
              : 'text-zinc-400 hover:text-purple-300 hover:bg-zinc-900'
          }`}
          title="Video Touch Up & Audio Studio Settings"
        >
          <Sliders className="w-5 h-5 text-purple-400" />
          <span className="text-[10px] mt-1 hidden md:block">Studio</span>
        </button>

        {/* Record Meeting */}
        <button
          onClick={toggleRecord}
          className={`flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
            isRecording
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
          title={isRecording ? 'Stop Recording' : 'Record meeting to WebM'}
        >
          <Circle className={`w-5 h-5 ${isRecording ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="text-[10px] mt-1 hidden md:block">
            {isRecording ? formatTimer(recordingDuration) : 'Record'}
          </span>
        </button>

        {/* Reactions Popover */}
        <div className="relative" ref={reactionsRef}>
          <button
            onClick={() => setReactionsOpen(!reactionsOpen)}
            className={`flex flex-col items-center justify-center w-12 md:w-14 py-1.5 rounded-xl transition-all ${
              reactionsOpen
                ? 'bg-zinc-800 text-amber-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="Emoji Reactions"
          >
            <Smile className="w-5 h-5" />
            <span className="text-[10px] mt-1 hidden md:block">React</span>
          </button>

          {reactionsOpen && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 glass-dropdown rounded-2xl p-3 shadow-2xl z-50 animate-fade-in space-y-2">
              <div className="flex items-center gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setReactionsOpen(false);
                    }}
                    className="text-2xl p-2 rounded-xl hover:bg-zinc-800 hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    toggleHandRaised();
                    setReactionsOpen(false);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isHandRaised
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: PiP, Keyboard Shortcuts, Fullscreen & Leave / End */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Picture-in-Picture Button */}
        <button
          onClick={handleNativePiP}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-cyan-400 transition-colors hidden sm:block"
          title="Picture-in-Picture Mini View"
        >
          <PictureInPicture2 className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts Dialog */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
          title="Keyboard Shortcuts (Hotkeys)"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Gallery vs Speaker View Toggle */}
        <button
          onClick={() => setViewMode(viewMode === 'gallery' ? 'speaker' : 'gallery')}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
          title="Switch Video View"
        >
          <LayoutGrid className="w-4 h-4 text-zinc-400" />
          <span>{viewMode === 'gallery' ? 'Speaker' : 'Gallery'}</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Leave / End Meeting Button */}
        <button
          onClick={() => setLeaveModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs shadow-lg shadow-red-600/25 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>End</span>
        </button>
      </div>
    </footer>
  );
};
