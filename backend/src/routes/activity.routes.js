const router = require('express').Router({ mergeParams: true });
const activityController = require('../controllers/activity.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', activityController.getActivities);
router.post('/', requireEditor, activityController.createActivity);
router.patch('/reorder', requireEditor, activityController.reorderActivities);
router.put('/:id', requireEditor, activityController.updateActivity);
router.delete('/:id', requireEditor, activityController.deleteActivity);
router.post('/:id/vote', activityController.voteActivity);

module.exports = router;