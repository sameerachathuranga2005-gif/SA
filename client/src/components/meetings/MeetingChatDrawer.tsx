import React, { useState, useEffect, useRef } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { Avatar } from '../common/Avatar';
import { Send, X, MessageSquare } from 'lucide-react';

export const MeetingChatDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    chatMessages,
    sendChatMessage,
    participants,
  } = useMeetingStore();

  const [input, setInput] = useState('');
  const [recipient, setRecipient] = useState('everyone');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (activeDrawer !== 'chat') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(input.trim(), recipient);
    setInput('');
  };

  return (
    <aside className="w-80 md:w-96 bg-zinc-950/95 border-l border-zinc-800/80 flex flex-col h-full shrink-0 z-20 backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-400" />
          <h3 className="font-bold text-sm text-zinc-100">Meeting Chat</h3>
        </div>
        <button
          onClick={() => setActiveDrawer(null)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {chatMessages.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No in-meeting messages yet.
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-400">
                {!msg.isMe && <Avatar name={msg.senderName} src={msg.senderAvatar} size="xs" showStatus={false} />}
                <span className="font-semibold text-zinc-300">
                  {msg.isMe ? 'You' : msg.senderName}
                </span>
                <span className="text-[10px] text-zinc-500">to {msg.to || 'Everyone'}</span>
                <span>•</span>
                <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.isMe
                    ? 'bg-brand-600 text-white rounded-tr-xs'
                    : 'bg-zinc-800/90 text-zinc-100 rounded-tl-xs border border-zinc-700/60'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/80 bg-zinc-950">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 px-1">
          <span>To:</span>
          <select
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-0.5 text-zinc-200 text-xs focus:outline-none"
          >
            <option value="everyone">Everyone</option>
            {participants
              .filter((p) => p.id !== 'self')
              .map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} (Direct)
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type message to meeting..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
};

