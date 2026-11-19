import React from 'react';
import { Command, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Push-to-Talk (Hold to Unmute audio)' },
    { key: 'Alt + A', desc: 'Mute / Unmute Audio' },
    { key: 'Alt + V', desc: 'Start / Stop Video Camera' },
    { key: 'Alt + S', desc: 'Start / Stop Screen Sharing' },
    { key: 'Alt + W', desc: 'Toggle Collaborative Whiteboard' },
    { key: 'Alt + B', desc: 'Virtual Background & Blur Menu' },
    { key: 'Alt + R', desc: 'Start / Stop Meeting Recording' },
    { key: 'Alt + H', desc: 'Open / Close In-Meeting Chat' },
    { key: 'Alt + U', desc: 'Open / Close Participants Panel' },
    { key: 'Esc', desc: 'Close Active Panel / Exit Fullscreen' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Command className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-zinc-100">Zoom Pro Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-2"
            >
              <span className="text-xs text-zinc-300 truncate">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 font-mono text-[11px] text-cyan-400 font-semibold shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

