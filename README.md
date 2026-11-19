# OmniSync — Unified Communication SuperApp
> Combining **Zoom** (Video Conferencing), **WhatsApp** (Real-Time Chats & Direct Calls), and **Facebook** (Social Feed) in a scalable, clean TypeScript monorepo architecture.

---

## 🏛️ Architecture Overview

The system is organized into a clean decoupled monorepo:
```
/SA
├── client/                     # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Avatar with live status ping, ToastContainer, SearchModal, NotificationsPopover
│   │   │   ├── feed/           # Facebook Module: Stories, Create Post, Rich Feed, Trending Topics
│   │   │   ├── chat/           # WhatsApp Module: Online friends, Conversation list, Message thread, Call triggers
│   │   │   ├── meetings/       # Zoom Module: PMI Card, New Meeting, Join Modal, Scheduled meetings
│   │   │   └── layout/         # AppShell, NavRail (Desktop), MobileNav, TopBar
│   │   ├── pages/              # AuthPage (1-Click Demo Login), DashboardPage (Protected Route)
│   │   ├── store/              # Zustand Stores: authStore, appStore
│   │   ├── services/           # Axios API client, Socket.io presence client
│   │   └── types/              # Full TypeScript interfaces
│   ├── .env.example
│   └── package.json
│
├── server/                     # Node.js + Express + TypeScript + Socket.io + Mongoose + Zod
│   ├── src/
│   │   ├── config/             # DB connector with resilient in-memory fallback adapter
│   │   ├── controllers/        # AuthController, UserController
│   │   ├── middlewares/        # JWT auth guard (`protect`), Zod validation (`validateBody`, `validateQuery`)
│   │   ├── models/             # Mongoose User model with unique 9-digit PMI, bcrypt hashing, friend lists
│   │   ├── routes/             # auth.routes.ts, user.routes.ts
│   │   ├── services/           # AuthService, UserService, mockData seeds
│   │   ├── sockets/            # SocketManager with JWT auth & real-time presence tracking
│   │   └── types/              # Full TypeScript backend interfaces
│   ├── .env.example
│   └── package.json
│
└── package.json                # Monorepo root scripts
```

---

## 🚀 Key Features Delivered in Phase 1

### 1. Unified Database Schema & Authentication
- **User Model:**
  - `name`, `email` (unique, indexed, validated)
  - `password` (bcrypt salted hashing)
  - `avatar` (custom Dicebear generator or direct URL)
  - `bio` (status bio)
  - `friends` (bidirectional relationship array)
  - `friendRequests` (sent & received with timestamps and pending/accepted/rejected statuses)
  - `personalMeetingId` (auto-generated unique 9-digit ID, formatted e.g. `982-415-309`)
  - `isOnline` & `lastSeen` (real-time presence timestamps)
- **1-Click Recruiter Demo Account:**
  - Instantly logs into **Alex Johnson (Demo Lead)** (`demo@superapp.dev`) with 1 click.
  - Pre-populated with active colleagues:
    - **Sarah Chen** (Staff AI Engineer • Online • PMI: `412-589-301`)
    - **David Kim** (Senior Product Designer • Online • PMI: `729-104-682`)
    - **Elena Rostova** (VP of Engineering • Offline • PMI: `853-294-716`)
    - **Marcus Vance** (Full-Stack Architect • Online • PMI: `193-482-650`)
  - Pre-populated incoming friend request from **Sophia Taylor** and outgoing request to **James Wilson**.

### 2. Real-Time WebSockets & Presence Engine
- Authenticated Socket.io server with JWT handshake verification.
- Real-time `user-online` and `user-offline` event broadcasting.
- User room isolation (`user:<userId>`) for instant notifications (friend request alerts, acceptance toasts).

### 3. Modern Responsive Dark Mode App Shell
- **Aesthetic:** Inspired by Discord, Linear, and Zoom (zinc palette `#09090b`, `#18181b`, glassmorphism, glowing badges).
- **Navigation:**
  - Desktop Left Navigation Rail with status badges and quick copy PMI widget.
  - Mobile Bottom Navigation Bar with responsive icons.
- **Top Bar:**
  - Real-time User Search modal (`/api/users/search?q=`) to find teammates and send/accept friend requests.
  - Friend Requests notification popover with instant "Accept" / "Decline" buttons.
  - Profile status menu with logout and PMI details.
- **3 Core Modules (Switch without page reload):**
  1. **Social Feed (Facebook Module):** Stories carousel, interactive post creation, likes counter, comments thread, trending topics.
  2. **Chats & Calls (WhatsApp Module):** Online friends bar, conversation list with unread badges, message thread, instant video/voice call triggers.
  3. **Meetings (Zoom Module):** Dedicated Personal Meeting ID hero card with 1-click copy, 4 action cards ("New Meeting", "Join Meeting", "Schedule", "Share Screen"), upcoming calendar calls list.

---

## 🛠️ Quick Start Guide

### 1. Install Dependencies
```bash
# In /server
cd server
npm install

# In /client
cd ../client
npm install
```

### 2. Run the Development Servers

**Option A (Terminal 1 - Server):**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000 (API at http://localhost:5000/api)
```

**Option B (Terminal 2 - Client):**
```bash
cd client
npm run dev
# Client starts on http://localhost:5173
```

### 3. Build & Type Check
Both subprojects have strict TypeScript type checking enabled:
```bash
# Build server
npm --prefix server run build

# Build client
npm --prefix client run build
```

---

## 🧪 Verified API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health & Phase status check | No |
| `POST` | `/api/auth/register` | Register new user + auto-assign 9-digit PMI | No |
| `POST` | `/api/auth/login` | Login existing user + return JWT | No |
| `POST` | `/api/auth/demo-login` | 1-Click Recruiter Demo Account | No |
| `GET` | `/api/auth/me` | Fetch authenticated user summary | Yes (Bearer Token) |
| `GET` | `/api/users/search?q=` | Search users & inspect relationship status | Yes (Bearer Token) |
| `GET` | `/api/users/friends` | Get user's connected friends list | Yes (Bearer Token) |
| `GET` | `/api/users/friend-requests` | Get pending incoming & outgoing requests | Yes (Bearer Token) |
| `POST` | `/api/users/friend-request` | Send friend request to `targetUserId` | Yes (Bearer Token) |
| `POST` | `/api/users/accept-friend` | Accept friend request from `senderUserId` | Yes (Bearer Token) |
| `POST` | `/api/users/reject-friend` | Decline friend request from `senderUserId` | Yes (Bearer Token) |

