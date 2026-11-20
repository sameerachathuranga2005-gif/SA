import React, { useState } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import { ShieldCheck, Copy, Check, X, Lock, Share2 } from 'lucide-react';

interface MeetingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingInfoModal: React.FC<MeetingInfoModalProps> = ({ isOpen, onClose }) => {
  const { meetingId, title, hostName, passcode } = useMeetingStore();
  const { showToast } = useAppStore();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen) return null;

  const cleanId = meetingId.replace(/-/g, '');
  const directLink = `${window.location.origin}/meeting/${cleanId}?pwd=${passcode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directLink);
    setCopiedLink(true);
    showToast('Direct join link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(meetingId);
    setCopiedId(true);
    showToast(`Copied Meeting ID: ${meetingId}`, 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyFullInvite = () => {
    const text = `${hostName || 'The host'} is inviting you to a scheduled OmniSync Video Meeting:

Topic: ${title}
Meeting ID: ${meetingId}
Passcode: ${passcode}

Join Meeting via Direct Link:
${directLink}`;

    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    showToast('Full meeting invitation copied to clipboard!', 'success');
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-100">Meeting Information</h3>
              <p className="text-[11px] text-emerald-400 font-medium">End-to-End Encrypted</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Rows */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="text-zinc-500 block mb-0.5">Meeting Topic</span>
            <span className="font-bold text-zinc-200 text-sm">{title}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-zinc-500 text-[10px] block">Meeting ID</span>
                <span className="font-mono font-bold text-cyan-400 text-xs">{meetingId}</span>
              </div>
              <button
                onClick={handleCopyId}
                className="p-1.5 text-zinc-400 hover:text-cyan-400 transition-colors"
                title="Copy Meeting ID"
              >
                {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-zinc-500 text-[10px] block">Passcode</span>
                <span className="font-mono font-bold text-amber-400 text-xs">{passcode}</span>
              </div>
              <Lock className="w-4 h-4 text-zinc-600" />
            </div>
          </div>

          <div>
            <span className="text-zinc-500 block mb-0.5">Host</span>
            <span className="font-semibold text-zinc-300">{hostName}</span>
          </div>

          <div>
            <span className="text-zinc-500 block mb-1">Direct Invitation Link</span>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 overflow-hidden">
              <span className="truncate flex-1">{directLink}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 hover:text-cyan-400 text-zinc-500 shrink-0"
                title="Copy link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800 gap-3">
          <button
            onClick={handleCopyFullInvite}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/20"
          >
            {copiedInvite ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedInvite ? 'Invitation Copied!' : 'Copy Full Invite'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

