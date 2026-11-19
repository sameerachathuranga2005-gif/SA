"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const auth_service_js_1 = require("../services/auth.service.js");
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Not authorized: No token provided',
            });
            return;
        }
        const decoded = (0, auth_service_js_1.verifyToken)(token);
        const user = await auth_service_js_1.AuthService.getCurrentUser(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Not authorized: User no longer exists',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized: Invalid or expired token',
        });
    }
};
exports.protect = protect;
