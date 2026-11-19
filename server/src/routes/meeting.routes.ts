import { Router } from 'express';
import { MeetingController, createMeetingSchema } from '../controllers/meeting.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';

const router = Router();

router.use(protect);

router.post('/create', validateBody(createMeetingSchema), MeetingController.createMeeting);
router.get('/:meetingId', MeetingController.getMeetingInfo);

export default router;

