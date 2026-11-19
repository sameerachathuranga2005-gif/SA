import React from 'react';
import { useAppStore } from '../../store/appStore';
import { ActiveModule } from '../../types';
import { Newspaper, MessageSquare, Video } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { activeModule, setActiveModule } = useAppStore();

  const tabs: { id: ActiveModule; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'feed', label: 'Feed', icon: Newspaper },
    { id: 'chats', label: 'Chats', icon: MessageSquare },
    { id: 'meetings', label: 'Meetings', icon: Video },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 z-40 flex items-center justify-around px-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeModule === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              isActive ? 'text-brand-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[11px] mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

