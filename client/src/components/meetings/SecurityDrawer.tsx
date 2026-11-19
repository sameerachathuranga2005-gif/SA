import React from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { useAppStore } from '../../store/appStore';
import { Shield, X, Lock, Check } from 'lucide-react';

export const SecurityDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    securitySettings,
    updateSecuritySetting,
  } = useMeetingStore();

  const { showToast } = useAppStore();

  if (activeDrawer !== 'security') return null;

  const permissions = [
    { key: 'allowShareScreen' as const, label: 'Share Screen' },
    { key: 'allowChat' as const, label: 'Chat with Everyone' },
    { key: 'allowRename' as const, label: 'Rename Themselves' },
    { key: 'allowUnmute' as const, label: 'Unmute Themselves' },
  ];

  return (
    <aside className="w-80 md:w-96 bg-zinc-950/95 border-l border-zinc-800/80 flex flex-col h-full shrink-0 z-20 backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h3 className="font-bold text-sm text-zinc-100">Security Controls</h3>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Lock Meeting Toggle */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs text-zinc-200">Lock Meeting</span>
            </div>
            <button
              onClick={() => {
                const next = !securitySettings.lockMeeting;
                updateSecuritySetting('lockMeeting', next);
                showToast(next ? 'Meeting locked. No new participants can join.' : 'Meeting unlocked.', 'info');
              }}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                securitySettings.lockMeeting ? 'bg-amber-500' : 'bg-zinc-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  securitySettings.lockMeeting ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            When a meeting is locked, no new participants can enter, even with the meeting ID and passcode.
          </p>
        </div>

        {/* Participant Permissions */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Allow Participants To:
          </span>

          {permissions.map((item) => {
            const isEnabled = securitySettings[item.key];
            return (
              <div
                key={item.key}
                onClick={() => {
                  updateSecuritySetting(item.key, !isEnabled);
                  showToast(`Updated permission: ${item.label}`, 'info');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <span className="text-xs font-medium text-zinc-200">{item.label}</span>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isEnabled
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : 'border-zinc-700 bg-zinc-800 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

