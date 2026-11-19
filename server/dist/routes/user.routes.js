"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_js_1 = require("../controllers/user.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const router = (0, express_1.Router)();
// All user routes require authentication
router.use(auth_middleware_js_1.protect);
// Search users
router.get('/search', user_controller_js_1.UserController.search);
// Friends & requests
router.get('/friends', user_controller_js_1.UserController.getFriends);
router.get('/friend-requests', user_controller_js_1.UserController.getFriendRequests);
// Friend operations
router.post('/friend-request', (0, validate_middleware_js_1.validateBody)(user_controller_js_1.friendRequestSchema), user_controller_js_1.UserController.sendFriendRequest);
router.post('/accept-friend', (0, validate_middleware_js_1.validateBody)(user_controller_js_1.respondFriendSchema), user_controller_js_1.UserController.acceptFriend);
router.post('/reject-friend', (0, validate_middleware_js_1.validateBody)(user_controller_js_1.respondFriendSchema), user_controller_js_1.UserController.rejectFriend);
exports.default = router;
