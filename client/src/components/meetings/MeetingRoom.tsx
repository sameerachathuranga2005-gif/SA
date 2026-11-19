import React, { useEffect } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import { VideoGrid } from './VideoGrid';
import { MeetingControls } from './MeetingControls';
import { MeetingChatDrawer } from './MeetingChatDrawer';
import { ParticipantsDrawer } from './ParticipantsDrawer';
import { SecurityDrawer } from './SecurityDrawer';
import { ReactionsOverlay } from './ReactionsOverlay';
import { LeaveMeetingModal } from './LeaveMeetingModal';
import { MeetingWhiteboard } from './MeetingWhiteboard';
import { VirtualBackgroundModal } from './VirtualBackgroundModal';
import { MeetingInfoModal } from './MeetingInfoModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ShieldCheck, Copy, Circle, Info } from 'lucide-react';

export const MeetingRoom: React.FC = () => {
  const {
    meetingId,
    title,
    isRecording,
    recordingDuration,
    isWhiteboardOpen,
    isVirtualBgModalOpen,
    isInfoModalOpen,
    isShortcutsModalOpen,
    activeDrawer,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleWhiteboard,
    toggleRecord,
    setActiveDrawer,
    setVirtualBgModalOpen,
    setInfoModalOpen,
    setShortcutsModalOpen,
  } = useMeetingStore();

  const { showToast } = useAppStore();

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in input/textarea, ignore
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Spacebar Push-to-Talk
      if (e.code === 'Space' && !e.repeat) {
        toggleAudio();
        return;
      }

      // Alt Shortcuts (or Option on Mac)
      if (e.altKey) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          toggleAudio();
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          toggleVideo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          toggleScreenShare();
        } else if (e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          toggleWhiteboard();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          toggleRecord();
        } else if (e.key === 'b' || e.key === 'B') {
          e.preventDefault();
          setVirtualBgModalOpen(true);
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setActiveDrawer(activeDrawer === 'chat' ? null : 'chat');
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          setActiveDrawer(activeDrawer === 'participants' ? null : 'participants');
        }
      }

      // ESC: Close drawers, modals, or whiteboard
      if (e.key === 'Escape') {
        if (isWhiteboardOpen) toggleWhiteboard();
        if (isVirtualBgModalOpen) setVirtualBgModalOpen(false);
        if (isInfoModalOpen) setInfoModalOpen(false);
        if (isShortcutsModalOpen) setShortcutsModalOpen(false);
        if (activeDrawer) setActiveDrawer(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleWhiteboard,
    toggleRecord,
    isWhiteboardOpen,
    isVirtualBgModalOpen,
    isInfoModalOpen,
    isShortcutsModalOpen,
    activeDrawer,
    setActiveDrawer,
    setVirtualBgModalOpen,
    setInfoModalOpen,
    setShortcutsModalOpen,
  ]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(meetingId);
    showToast(`Copied Meeting ID: ${meetingId}`, 'success');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden relative selection:bg-cyan-500 selection:text-white">
      {/* Top Meeting Header Bar */}
      <header className="h-14 bg-zinc-950/80 border-b border-zinc-800/80 px-4 md:px-6 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {/* Zoom Green Shield Meeting Info Button */}
          <button
            onClick={() => setInfoModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors shadow-sm"
            title="Meeting Information & Passcode"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">256-Bit Encrypted</span>
            <Info className="w-3.5 h-3.5 opacity-60" />
          </button>

          <span className="text-zinc-600 hidden sm:inline">•</span>

          <h1 className="text-xs md:text-sm font-bold text-zinc-200 truncate">{title}</h1>

          {/* Recording Status Pill */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-mono animate-pulse">
              <Circle className="w-2.5 h-2.5 fill-red-400" />
              <span>REC {formatTimer(recordingDuration)}</span>
            </div>
          )}
        </div>

        {/* Meeting ID with Copy Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 transition-colors"
            title="Click to copy Meeting ID"
          >
            <span className="text-cyan-400 font-bold">{meetingId}</span>
            <Copy className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
      </header>

      {/* Main Workspace: Video Grid + Drawers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Canvas Grid */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <VideoGrid />
        </main>

        {/* Dynamic Drawers */}
        <MeetingChatDrawer />
        <ParticipantsDrawer />
        <SecurityDrawer />

        {/* Collaborative Whiteboard */}
        <MeetingWhiteboard />
      </div>

      {/* Iconic Zoom Bottom Control Dock */}
      <MeetingControls />

      {/* Overlays & Modals */}
      <ReactionsOverlay />
      <LeaveMeetingModal />
      <VirtualBackgroundModal
        isOpen={isVirtualBgModalOpen}
        onClose={() => setVirtualBgModalOpen(false)}
      />
      <MeetingInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
};
