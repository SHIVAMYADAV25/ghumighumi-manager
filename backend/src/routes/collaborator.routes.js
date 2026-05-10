const router = require('express').Router({ mergeParams: true });
const collaboratorController = require('../controllers/collaborator.controller');
const inviteController = require('../controllers/invite.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor, requireOwner } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', collaboratorController.getCollaborators);
router.post('/leave', collaboratorController.leaveTrip);

// Invite flows
router.post('/invite', requireEditor, inviteController.sendInvite);
router.get('/invites', requireEditor, inviteController.getTripInvites);
router.delete('/invites/:id', requireEditor, inviteController.revokeInvite);

// Owner-only management
router.patch('/:userId/role', requireOwner, collaboratorController.updateRole);
router.delete('/:userId', requireOwner, collaboratorController.removeCollaborator);

module.exports = router;