import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must be under 60 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await AuthService.register(name, email, password);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Invalid credentials',
      });
    }
  }

  static async demoLogin(_req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.demoLogin();

      res.status(200).json({
        success: true,
        message: 'Demo recruiter account loaded successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Demo login failed',
      });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch current user',
      });
    }
  }
}

