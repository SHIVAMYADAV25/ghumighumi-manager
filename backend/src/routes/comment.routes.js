const router = require('express').Router({ mergeParams: true });
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', commentController.getComments);
router.post('/', commentController.createComment);
router.patch('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);
router.post('/:id/react', commentController.reactToComment);

module.exports = router;