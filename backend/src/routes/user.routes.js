const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', userController.searchUsers);
router.get('/archived-trips', userController.getArchivedTrips);
router.get('/:id', userController.getUserProfile);

module.exports = router;