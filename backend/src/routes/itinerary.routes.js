const router = require('express').Router({ mergeParams: true });
const itineraryController = require('../controllers/itinerary.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', itineraryController.getItineraries);
router.patch('/:id', requireEditor, itineraryController.updateItinerary);

module.exports = router;