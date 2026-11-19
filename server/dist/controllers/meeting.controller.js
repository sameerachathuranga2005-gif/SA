"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingController = exports.createMeetingSchema = void 0;
const zod_1 = require("zod");
const auth_service_js_1 = require("../services/auth.service.js");
exports.createMeetingSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    type: zod_1.z.enum(['instant', 'scheduled']).default('instant'),
});
class MeetingController {
    static async createMeeting(req, res) {
        try {
            const user = req.user;
            const meetingId = (0, auth_service_js_1.generateMeetingId)();
            const passcode = Math.floor(100000 + Math.random() * 900000).toString();
            const title = req.body.title || `${user.name}'s Video Meeting`;
            res.status(200).json({
                success: true,
                data: {
                    meetingId,
                    title,
                    hostId: user._id,
                    hostName: user.name,
                    passcode,
                    inviteLink: `${process.env.CLIENT_URL || 'http://localhost:5173'}/meeting/${meetingId.replace(/-/g, '')}`,
                    createdAt: new Date(),
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create meeting',
            });
        }
    }
    static async getMeetingInfo(req, res) {
        try {
            const { meetingId } = req.params;
            const cleanId = meetingId.replace(/-/g, '');
            // Format with hyphens: XXX-XXX-XXX
            const formattedId = cleanId.length === 9
                ? `${cleanId.slice(0, 3)}-${cleanId.slice(3, 6)}-${cleanId.slice(6, 9)}`
                : meetingId;
            res.status(200).json({
                success: true,
                data: {
                    meetingId: formattedId,
                    title: `Video Conference Room ${formattedId}`,
                    isValid: true,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error validating meeting',
            });
        }
    }
}
exports.MeetingController = MeetingController;
