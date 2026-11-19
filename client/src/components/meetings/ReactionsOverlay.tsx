import React from 'react';
import { useMeetingStore } from '../../store/meetingStore';

export const ReactionsOverlay: React.FC = () => {
  const { floatingReactions } = useMeetingStore();

  if (floatingReactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingReactions.map((reaction) => (
        <div
          key={reaction.id}
          style={{ left: `${reaction.xPos}%` }}
          className="absolute bottom-24 flex flex-col items-center animate-bounce transition-all duration-1000"
        >
          <span className="text-4xl filter drop-shadow-lg">{reaction.emoji}</span>
          <span className="text-[10px] font-semibold text-white bg-zinc-950/80 px-2 py-0.5 rounded-full border border-zinc-800 mt-1 shadow-md">
            {reaction.senderName}
          </span>
        </div>
      ))}
    </div>
  );
};

