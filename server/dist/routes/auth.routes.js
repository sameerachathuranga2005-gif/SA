"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const validate_middleware_js_1 = require("../middlewares/validate.middleware.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const router = (0, express_1.Router)();
// Public auth endpoints
router.post('/register', (0, validate_middleware_js_1.validateBody)(auth_controller_js_1.registerSchema), auth_controller_js_1.AuthController.register);
router.post('/login', (0, validate_middleware_js_1.validateBody)(auth_controller_js_1.loginSchema), auth_controller_js_1.AuthController.login);
router.post('/demo-login', auth_controller_js_1.AuthController.demoLogin);
// Protected auth endpoints
router.get('/me', auth_middleware_js_1.protect, auth_controller_js_1.AuthController.getMe);
exports.default = router;
