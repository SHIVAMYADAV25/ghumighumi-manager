const router = require('express').Router({ mergeParams: true });
const reservationController = require('../controllers/reservation.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', reservationController.getReservations);
router.post('/', requireEditor, reservationController.createReservation);
router.patch('/:id', requireEditor, reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;