import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { IScheduledMeeting } from '../../types';
import {
  Video,
  PlusSquare,
  LogIn,
  Calendar,
  Share2,
  Copy,
  Clock,
  Sparkles,
  Check,
  X,
} from 'lucide-react';

export const MeetingsModule: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useAppStore();
  const navigate = useNavigate();

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Scheduled demo meetings
  const [scheduledMeetings] = useState<IScheduledMeeting[]>([
    {
      id: 'meet-1',
      title: 'OmniSync Core Platform Architecture Review',
      meetingId: '412-589-301',
      hostName: 'Sarah Chen (Staff AI Engineer)',
      time: 'Today at 02:00 PM',
      duration: '45 mins',
      participantsCount: 4,
    },
    {
      id: 'meet-2',
      title: 'Dark Mode UI & Micro-interactions Sync',
      meetingId: '729-104-682',
      hostName: 'David Kim (Product Design Lead)',
      time: 'Today at 04:30 PM',
      duration: '30 mins',
      participantsCount: 3,
    },
    {
      id: 'meet-3',
      title: 'Weekly All-Hands & Phase 2 Roadmap',
      meetingId: '853-294-716',
      hostName: 'Elena Rostova (VP Engineering)',
      time: 'Tomorrow at 10:00 AM',
      duration: '60 mins',
      participantsCount: 12,
    },
  ]);

  const handleCopyId = () => {
    if (user?.personalMeetingId) {
      navigator.clipboard.writeText(user.personalMeetingId);
      setCopiedId(true);
      showToast(`Copied Personal Meeting ID: ${user.personalMeetingId}`, 'success');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (user?.personalMeetingId) {
      const link = `${window.location.origin}/meeting/${user.personalMeetingId.replace(/-/g, '')}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showToast('Copied Meeting Invitation Link!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStartInstantMeeting = () => {
    const pmi = user?.personalMeetingId ? user.personalMeetingId.replace(/-/g, '') : '982415309';
    navigate(`/meeting/${pmi}`);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = meetingIdInput.trim().replace(/-/g, '');
    if (!cleanId) {
      showToast('Please enter a 9-digit Meeting ID', 'error');
      return;
    }
    const cleanPwd = passcodeInput.trim();
    setJoinModalOpen(false);
    navigate(cleanPwd ? `/meeting/${cleanId}?pwd=${cleanPwd}` : `/meeting/${cleanId}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 md:px-6 space-y-8">
      {/* Zoom-style Hero Card: Personal Meeting ID */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Your Dedicated Video Conference Room
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Personal Meeting ID (PMI)
            </h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl md:text-3xl font-extrabold tracking-wider text-cyan-300 bg-zinc-950/80 px-4 py-1.5 rounded-xl border border-zinc-800 shadow-inner">
                {user?.personalMeetingId || '--- --- ---'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 max-w-md">
              Share your static Personal Meeting ID with teammates for instant 1-click video calls, screen sharing, and audio huddles.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleCopyId}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-all shadow-sm"
            >
              {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedId ? 'Copied ID' : 'Copy ID'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-all shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Invite Link'}</span>
            </button>

            <button
              onClick={handleStartInstantMeeting}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Start Meeting</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Zoom Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. New Meeting */}
        <div
          onClick={handleStartInstantMeeting}
          className="group p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-orange-500/40 cursor-pointer transition-all shadow-md flex flex-col items-center text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
            <PlusSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">New Meeting</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Start instant conference</p>
          </div>
        </div>

        {/* 2. Join Meeting */}
        <div
          onClick={() => setJoinModalOpen(true)}
          className="group p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/40 cursor-pointer transition-all shadow-md flex flex-col items-center text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
            <LogIn className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">Join Meeting</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Enter 9-digit code</p>
          </div>
        </div>

        {/* 3. Schedule Meeting */}
        <div
          onClick={() => showToast('Calendar scheduler will sync in Phase 2', 'info')}
          className="group p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-indigo-500/40 cursor-pointer transition-all shadow-md flex flex-col items-center text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">Schedule</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Plan future video sync</p>
          </div>
        </div>

        {/* 4. Share Screen */}
        <div
          onClick={() => showToast('Screen share ready for Phase 2 WebRTC feed', 'info')}
          className="group p-5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all shadow-md flex flex-col items-center text-center space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Share2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-zinc-100">Share Screen</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Broadcast presentation</p>
          </div>
        </div>
      </div>

      {/* Upcoming Scheduled Meetings Section */}
      <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm md:text-base text-zinc-100">
              Upcoming Scheduled Meetings
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            {scheduledMeetings.length} calls today
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scheduledMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    ID: {meeting.meetingId}
                  </span>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {meeting.duration}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-zinc-100 leading-snug">
                  {meeting.title}
                </h4>
                <p className="text-xs text-zinc-400">Host: {meeting.hostName}</p>
                <p className="text-xs text-emerald-400 font-medium">{meeting.time}</p>
              </div>

              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  {meeting.participantsCount} participants invited
                </span>
                <button
                  onClick={() =>
                    navigate(`/meeting/${meeting.meetingId.replace(/-/g, '')}`)
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join Meeting Modal */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <LogIn className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-zinc-100">Join a Meeting</h3>
              </div>
              <button
                onClick={() => setJoinModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Meeting ID or Personal Link Name
                </label>
                <input
                  type="text"
                  value={meetingIdInput}
                  onChange={(e) => setMeetingIdInput(e.target.value)}
                  placeholder="e.g. 412-589-301 or 412589301"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Meeting Passcode
                </label>
                <input
                  type="text"
                  maxLength={8}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="6-digit passcode (e.g. 482910)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-amber-300 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => {
                    setMeetingIdInput('412-589-301');
                    setPasscodeInput('482910');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px]"
                >
                  Sarah's Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMeetingIdInput('729-104-682');
                    setPasscodeInput('619420');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px]"
                >
                  David's Room
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setJoinModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!meetingIdInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md transition-all"
                >
                  Join Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

