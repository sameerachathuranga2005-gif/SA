"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_js_1 = require("./config/db.js");
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const user_routes_js_1 = __importDefault(require("./routes/user.routes.js"));
const meeting_routes_js_1 = __importDefault(require("./routes/meeting.routes.js"));
const socket_manager_js_1 = require("./sockets/socket.manager.js");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// Middleware
app.use((0, cors_1.default)({
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'OmniSync SuperApp Backend API',
        version: '1.0.0',
        phase: 'Phase 1 - Unified Auth & App Shell',
    });
});
// Mount Routes
app.use('/api/auth', auth_routes_js_1.default);
app.use('/api/users', user_routes_js_1.default);
app.use('/api/meetings', meeting_routes_js_1.default);
// 404 Route Handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'API Route not found',
    });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
// Initialize DB and Socket Server
async function startServer() {
    await (0, db_js_1.connectDB)();
    // Initialize Socket.io
    socket_manager_js_1.socketManager.initialize(server, CLIENT_URL);
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
