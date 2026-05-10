const router = require('express').Router();
const tripController = require('../controllers/trip.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor, requireOwner } = require('../middleware/tripAccess');
const { uploadCover } = require('../config/cloudinary');

router.use(protect);

router.get('/', tripController.getMyTrips);
router.post('/', tripController.createTrip);

router.use('/:tripId', loadTrip, requireAccess);

router.get('/:tripId', tripController.getTrip);
router.put('/:tripId', requireEditor, tripController.updateTrip);
router.delete('/:tripId', requireOwner, tripController.deleteTrip);
router.post('/:tripId/cover', requireEditor, uploadCover.single('cover'), tripController.uploadCover);
router.get('/:tripId/stats', tripController.getTripStats);
router.get('/:tripId/activity-log', tripController.getActivityLog);
router.post('/:tripId/archive', requireOwner, tripController.archiveTrip);
router.post('/:tripId/duplicate', tripController.duplicateTrip);

module.exports = router;