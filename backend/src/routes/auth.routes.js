const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected
router.use(protect);
router.get('/me', authController.getMe);
router.patch('/me', authController.updateMe);
router.patch('/me/password', authController.updatePassword);
router.patch('/me/avatar', uploadAvatar.single('avatar'), authController.uploadAvatar);

module.exports = router;