import { Router } from 'express';
import {
  UserController,
  friendRequestSchema,
  respondFriendSchema,
} from '../controllers/user.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';

const router = Router();

// All user routes require authentication
router.use(protect);

// Search users
router.get('/search', UserController.search);

// Friends & requests
router.get('/friends', UserController.getFriends);
router.get('/friend-requests', UserController.getFriendRequests);

// Friend operations
router.post('/friend-request', validateBody(friendRequestSchema), UserController.sendFriendRequest);
router.post('/accept-friend', validateBody(respondFriendSchema), UserController.acceptFriend);
router.post('/reject-friend', validateBody(respondFriendSchema), UserController.rejectFriend);

export default router;

