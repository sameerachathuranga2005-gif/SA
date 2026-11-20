import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { generateMeetingId } from '../services/auth.service.js';
import { socketManager } from '../sockets/socket.manager.js';

export const createMeetingSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['instant', 'scheduled']).default('instant'),
});

export class MeetingController {
  static async createMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const meetingId = generateMeetingId();
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();
      const title = req.body.title || `${user.name}'s Video Meeting`;

      // Register room in active socket manager
      socketManager.registerMeeting(meetingId, {
        title,
        hostId: user._id,
        hostName: user.name,
        passcode,
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const cleanId = meetingId.replace(/-/g, '');
      const inviteLink = `${clientUrl}/meeting/${cleanId}?pwd=${passcode}`;

      res.status(200).json({
        success: true,
        data: {
          meetingId,
          title,
          hostId: user._id,
          hostName: user.name,
          passcode,
          inviteLink,
          createdAt: new Date(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create meeting',
      });
    }
  }

  static async getMeetingInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;
      const cleanId = meetingId.replace(/-/g, '');
      const room = socketManager.getMeetingRoom(cleanId);

      // Format with hyphens: XXX-XXX-XXX
      const formattedId =
        cleanId.length === 9
          ? `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`
          : meetingId;

      res.status(200).json({
        success: true,
        data: {
          meetingId: formattedId,
          title: room?.title || `Video Conference Room ${formattedId}`,
          hostName: room?.hostName,
          requiresPasscode: true,
          hasPasscode: true,
          waitingRoomEnabled: room?.waitingRoomEnabled ?? false,
          isValid: true,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Error validating meeting',
      });
    }
  }
}

