export interface DemoSeedUser {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  personalMeetingId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export const DEMO_FRIENDS: DemoSeedUser[] = [
  {
    id: 'demo-friend-1',
    name: 'Sarah Chen',
    email: 'sarah.chen@superapp.dev',
    bio: 'Staff AI Engineer | Working on Realtime Multimodal WebRTC & LLM Agents 🚀',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '412-589-301',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: 'demo-friend-2',
    name: 'David Kim',
    email: 'david.kim@superapp.dev',
    bio: 'Senior Product Designer @ OmniSync | Crafting micro-interactions and dark mode UI ✨',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '729-104-682',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: 'demo-friend-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@superapp.dev',
    bio: 'VP of Engineering | Scaling real-time distributed video pipelines ⚡',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '853-294-716',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 35), // 35 mins ago
  },
  {
    id: 'demo-friend-4',
    name: 'Marcus Vance',
    email: 'marcus.v@superapp.dev',
    bio: 'Full-Stack Architect | TypeScript, WebSockets & High-throughput backend systems 🛠️',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '193-482-650',
    isOnline: true,
    lastSeen: new Date(),
  },
];

export const DEMO_PENDING_REQUESTERS: DemoSeedUser[] = [
  {
    id: 'demo-requester-1',
    name: 'Sophia Taylor',
    email: 'sophia.t@superapp.dev',
    bio: 'Lead iOS & Android Engineer | Audio/Video latency fanatic 📱',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '334-901-827',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: 'demo-requester-2',
    name: 'James Wilson',
    email: 'james.w@superapp.dev',
    bio: 'DevOps & SRE Specialist | Kubernetes, WebRTC TURN/STUN infrastructure ☁️',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '620-418-953',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 120),
  },
];

export const DEMO_EXPLORE_USERS: DemoSeedUser[] = [
  {
    id: 'demo-user-1',
    name: 'Aiden Brooks',
    email: 'aiden.b@superapp.dev',
    bio: 'Security Researcher & Cryptography | End-to-end encryption enthusiast 🔒',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '551-782-903',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: 'demo-user-2',
    name: 'Maya Patel',
    email: 'maya.patel@superapp.dev',
    bio: 'Senior UX Researcher | Studying collaborative social audio and video dynamics 🎧',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=faces',
    personalMeetingId: '984-213-447',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 45),
  },
];

