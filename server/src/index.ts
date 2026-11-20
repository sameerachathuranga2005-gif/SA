import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { expressCorsOptions } from './config/cors.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import meetingRoutes from './routes/meeting.routes.js';
import { socketManager } from './sockets/socket.manager.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 7860;

// Apply CORS with credentials and dynamic environment origins
app.use(cors(expressCorsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'OmniSync SuperApp Backend API',
    version: '1.0.0',
    phase: 'Phase 1 - Unified Auth & App Shell',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API Route not found',
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Unhandled Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Initialize DB and Socket Server
async function startServer() {
  await connectDB();

  // Initialize Socket.io with cloud-ready CORS configuration
  socketManager.initialize(server);

  server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 OmniSync SuperApp Server running on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`⚡ WebSocket Server ready with presence tracking`);
    console.log(`===============================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
