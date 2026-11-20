import React, { useState, useEffect, useRef } from 'react';
import { useMeetingStore } from '../../store/meetingStore';
import { Avatar } from '../common/Avatar';
import { Send, X, MessageSquare, Lock, Globe } from 'lucide-react';

export const MeetingChatDrawer: React.FC = () => {
  const {
    activeDrawer,
    setActiveDrawer,
    chatMessages,
    sendChatMessage,
    participants,
  } = useMeetingStore();

  const [input, setInput] = useState('');
  const [recipientSocketId, setRecipientSocketId] = useState('everyone');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (activeDrawer !== 'chat') return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (recipientSocketId === 'everyone') {
      sendChatMessage(input.trim(), 'Everyone');
    } else {
      const target = participants.find((p) => p.socketId === recipientSocketId);
      const recipientName = target?.name || 'Participant';
      sendChatMessage(input.trim(), recipientName, recipientSocketId);
    }

    setInput('');
  };

  const selectedTarget = participants.find((p) => p.socketId === recipientSocketId);

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
            No in-meeting messages yet. Type below to start chatting!
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-zinc-400 flex-wrap">
                {!msg.isMe && <Avatar name={msg.senderName} src={msg.senderAvatar} size="xs" showStatus={false} />}
                <span className="font-semibold text-zinc-300">
                  {msg.isMe ? 'You' : msg.senderName}
                </span>

                {msg.isDirect ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Direct Message {msg.isMe ? `to ${msg.to}` : `to You`}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">to Everyone</span>
                )}

                <span>•</span>
                <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.isMe
                    ? msg.isDirect
                      ? 'bg-amber-600/90 text-white rounded-tr-xs border border-amber-400/40'
                      : 'bg-brand-600 text-white rounded-tr-xs'
                    : msg.isDirect
                    ? 'bg-zinc-900 text-zinc-100 rounded-tl-xs border border-amber-500/40 shadow-amber-500/10'
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
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800/80 bg-zinc-950 space-y-2">
        {/* "To:" Dropdown */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5 text-zinc-400">
            {recipientSocketId === 'everyone' ? (
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-semibold text-[11px]">To:</span>
          </div>

          <select
            value={recipientSocketId}
            onChange={(e) => setRecipientSocketId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-200 text-xs focus:outline-none focus:border-brand-500 max-w-[200px] truncate"
          >
            <option value="everyone">Everyone in Meeting</option>
            {participants
              .filter((p) => p.id !== 'self')
              .map((p) => (
                <option key={p.socketId || p.id} value={p.socketId || p.id}>
                  {p.name} (Direct Message)
                </option>
              ))}
          </select>
        </div>

        {/* Private Direct Message Hint Badge */}
        {recipientSocketId !== 'everyone' && (
          <div className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Sending private direct message to <strong>{selectedTarget?.name}</strong></span>
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              recipientSocketId === 'everyone'
                ? 'Type message to everyone...'
                : `Private message to ${selectedTarget?.name || 'user'}...`
            }
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-colors shadow-sm"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </aside>
  );
};

