import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Avatar } from '../common/Avatar';
import { IUserSummary } from '../../types';
import {
  Search,
  Video,
  Phone,
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  CheckCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const ChatModule: React.FC = () => {
  const { user, friends } = useAuthStore();
  const { showToast, setActiveModule } = useAppStore();
  const navigate = useNavigate();

  const [selectedFriend, setSelectedFriend] = useState<IUserSummary | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Mock conversation history keyed by friend ID
  const [messagesMap, setMessagesMap] = useState<
    Record<string, { id: string; text: string; senderId: string; isMe: boolean; time: string }[]>
  >({
    'demo-friend-1': [
      {
        id: 'm1',
        text: 'Hey Alex! Did you review the WebRTC streaming benchmark numbers?',
        senderId: 'demo-friend-1',
        isMe: false,
        time: '10:42 AM',
      },
      {
        id: 'm2',
        text: 'Yes Sarah! Sub-50ms glass-to-glass latency looks incredible. Ready for Phase 2 integration.',
        senderId: 'demo-me',
        isMe: true,
        time: '10:45 AM',
      },
      {
        id: 'm3',
        text: 'Awesome! Let’s jump on a quick video call when you are free.',
        senderId: 'demo-friend-1',
        isMe: false,
        time: '10:48 AM',
      },
    ],
    'demo-friend-2': [
      {
        id: 'm4',
        text: 'Hey Alex, the new Dark Mode app shell design looks super clean!',
        senderId: 'demo-friend-2',
        isMe: false,
        time: '09:15 AM',
      },
      {
        id: 'm5',
        text: 'Thanks David! The Discord + Linear aesthetic feels very crisp.',
        senderId: 'demo-me',
        isMe: true,
        time: '09:20 AM',
      },
    ],
  });

  // Select the first friend by default if none selected
  useEffect(() => {
    if (!selectedFriend && friends.length > 0) {
      setSelectedFriend(friends[0]);
    }
  }, [friends, selectedFriend]);

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeMessages = selectedFriend ? messagesMap[selectedFriend._id] || [] : [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedFriend) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      text: messageInput.trim(),
      senderId: user?._id || 'demo-me',
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedFriend._id]: [...(prev[selectedFriend._id] || []), newMsg],
    }));

    setMessageInput('');
  };

  const handleStartCall = (type: 'video' | 'audio') => {
    if (!selectedFriend) return;
    if (type === 'video') {
      const pmi = selectedFriend.personalMeetingId ? selectedFriend.personalMeetingId.replace(/-/g, '') : '982415309';
      navigate(`/meeting/${pmi}`);
    } else {
      showToast(`Initiating direct audio call with ${selectedFriend.name}...`, 'info');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col max-w-7xl mx-auto p-2 md:p-6">
      {/* Online Friends Bar */}
      <div className="mb-4 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-3 shrink-0 flex items-center gap-3 overflow-x-auto scrollbar-none shadow-md">
        <span className="text-xs font-semibold text-zinc-400 shrink-0 pl-1">
          Active Now:
        </span>
        {friends.length === 0 ? (
          <span className="text-xs text-zinc-500">No friends online yet</span>
        ) : (
          friends.map((friend) => (
            <button
              key={friend._id}
              onClick={() => setSelectedFriend(friend)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
                selectedFriend?._id === friend._id
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Avatar
                name={friend.name}
                src={friend.avatar}
                size="xs"
                isOnline={friend.isOnline}
              />
              <span className="text-xs font-medium">{friend.name.split(' ')[0]}</span>
            </button>
          ))
        )}
      </div>

      {/* Main Chat Interface Split */}
      <div className="flex-1 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl overflow-hidden flex shadow-xl">
        {/* Left Column: Conversations List (1/3 width) */}
        <div className="w-full sm:w-80 md:w-96 border-r border-zinc-800/80 flex flex-col bg-zinc-950/60 shrink-0">
          {/* Header & Filter */}
          <div className="p-3.5 border-b border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Conversations
              </h2>
              <span className="text-xs font-mono text-zinc-400">{friends.length} contacts</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats or friends..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40">
            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No conversations found.
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const isSelected = selectedFriend?._id === friend._id;
                const msgs = messagesMap[friend._id] || [];
                const lastMsg = msgs[msgs.length - 1];

                return (
                  <div
                    key={friend._id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-zinc-800/90 border-l-4 border-l-emerald-500'
                        : 'hover:bg-zinc-900/60'
                    }`}
                  >
                    <Avatar
                      name={friend.name}
                      src={friend.avatar}
                      size="md"
                      isOnline={friend.isOnline}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-zinc-200 truncate">
                          {friend.name}
                        </h4>
                        <span className="text-[10px] text-zinc-500">
                          {lastMsg ? lastMsg.time : friend.isOnline ? 'Active' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {lastMsg ? lastMsg.text : friend.bio}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Pane */}
        {selectedFriend ? (
          <div className="hidden sm:flex flex-col flex-1 bg-zinc-900/60">
            {/* Top Chat Action Bar */}
            <div className="p-3.5 px-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
              <div className="flex items-center gap-3">
                <Avatar
                  name={selectedFriend.name}
                  src={selectedFriend.avatar}
                  size="md"
                  isOnline={selectedFriend.isOnline}
                />
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    {selectedFriend.name}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 text-zinc-400">
                      PMI: {selectedFriend.personalMeetingId}
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    {selectedFriend.isOnline ? 'Online • Ready for Direct Call' : 'Last seen recently'}
                  </p>
                </div>
              </div>

              {/* Call Controls & Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartCall('video')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-sm"
                  title="Start Direct Video Meeting"
                >
                  <Video className="w-4 h-4" />
                  <span className="hidden md:inline">Video Call</span>
                </button>

                <button
                  onClick={() => handleStartCall('audio')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                  title="Start Audio Call"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Audio</span>
                </button>

                <button
                  onClick={() => setActiveModule('meetings')}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title="Schedule or Join Meeting"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Call Banner Trigger */}
            <div className="px-6 py-2 bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border-b border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-zinc-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Direct 1-on-1 Call Room configured with WebRTC Signaling
              </span>
              <button
                onClick={() => handleStartCall('video')}
                className="text-emerald-400 hover:underline font-medium"
              >
                Launch Room
              </button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeMessages.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                  No messages yet. Send a friendly message or start a video call!
                </div>
              ) : (
                activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs'
                          : 'bg-zinc-800 text-zinc-100 rounded-bl-xs border border-zinc-700/60'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 px-1">
                      <span>{msg.time}</span>
                      {msg.isMe && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-950/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Attachment simulation', 'info')}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Emoji picker simulation', 'info')}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Message ${selectedFriend.name}...`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center p-8 text-zinc-500 text-sm">
            Select a contact to begin chatting
          </div>
        )}
      </div>
    </div>
  );
};

