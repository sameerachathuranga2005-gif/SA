import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../../store/meetingStore';
import { LogOut, X } from 'lucide-react';

export const LeaveMeetingModal: React.FC = () => {
  const { isLeaveModalOpen, setLeaveModalOpen, leaveMeeting, isHost } = useMeetingStore();
  const navigate = useNavigate();

  if (!isLeaveModalOpen) return null;

  const handleLeave = () => {
    leaveMeeting(false);
    navigate('/');
  };

  const handleEndForAll = () => {
    leaveMeeting(true);
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div className="flex justify-end">
          <button
            onClick={() => setLeaveModalOpen(false)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <LogOut className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Leave or End Meeting</h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isHost
              ? 'As the host, you can end this meeting for everyone or assign a new host.'
              : 'Are you sure you want to exit this video conference?'}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {isHost && (
            <button
              onClick={handleEndForAll}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-md"
            >
              End Meeting for All
            </button>
          )}

          <button
            onClick={handleLeave}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors"
          >
            Leave Meeting
          </button>

          <button
            onClick={() => setLeaveModalOpen(false)}
            className="w-full py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

