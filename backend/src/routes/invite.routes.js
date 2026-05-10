const router = require('express').Router();
const inviteController = require('../controllers/invite.controller');
const { protect } = require('../middleware/auth');

// Public — view invite preview
router.get('/:token', inviteController.getInvite);
router.post('/:token/decline', inviteController.declineInvite);

// Protected — must be logged in to accept
router.post('/:token/accept', protect, inviteController.acceptInvite);

module.exports = router;