const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.patch('/read', notificationController.markAsRead);
router.delete('/clear', notificationController.clearAll);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;