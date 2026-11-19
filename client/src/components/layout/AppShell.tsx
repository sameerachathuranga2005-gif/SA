import React from 'react';
import { useAppStore } from '../../store/appStore';
import { NavRail } from './NavRail';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { FeedModule } from '../feed/FeedModule';
import { ChatModule } from '../chat/ChatModule';
import { MeetingsModule } from '../meetings/MeetingsModule';
import { UserSearchModal } from '../common/UserSearchModal';
import { ToastContainer } from '../common/ToastContainer';

export const AppShell: React.FC = () => {
  const { activeModule } = useAppStore();

  return (
    <div className="min-h-screen bg-surface-base text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-brand-500 selection:text-white">
      {/* Desktop Navigation Rail */}
      <NavRail />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopBar />

        {/* Dynamic Module Content View */}
        <main className="flex-1 overflow-y-auto">
          {activeModule === 'feed' && <FeedModule />}
          {activeModule === 'chats' && <ChatModule />}
          {activeModule === 'meetings' && <MeetingsModule />}
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileNav />

      {/* Global Modals & Overlays */}
      <UserSearchModal />
      <ToastContainer />
    </div>
  );
};

