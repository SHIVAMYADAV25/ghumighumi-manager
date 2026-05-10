const router = require('express').Router();
const weatherController = require('../controllers/weather.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');

router.use(protect);

// Generic forecast (no trip context needed)
router.get('/forecast', weatherController.getWeather);

// Save to itinerary
router.post('/trips/:tripId/save', loadTrip, requireAccess, requireEditor, weatherController.saveWeatherToItinerary);

module.exports = router;