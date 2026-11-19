"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const auth_service_js_1 = require("../services/auth.service.js");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must be under 60 characters'),
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
class AuthController {
    static async register(req, res) {
        try {
            const { name, email, password } = req.body;
            const result = await auth_service_js_1.AuthService.register(name, email, password);
            res.status(201).json({
                success: true,
                message: 'Account registered successfully',
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Registration failed',
            });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_js_1.AuthService.login(email, password);
            res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                data: result,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || 'Invalid credentials',
            });
        }
    }
    static async demoLogin(_req, res) {
        try {
            const result = await auth_service_js_1.AuthService.demoLogin();
            res.status(200).json({
                success: true,
                message: 'Demo recruiter account loaded successfully',
                data: result,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Demo login failed',
            });
        }
    }
    static async getMe(req, res) {
        try {
            res.status(200).json({
                success: true,
                data: req.user,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch current user',
            });
        }
    }
}
exports.AuthController = AuthController;
