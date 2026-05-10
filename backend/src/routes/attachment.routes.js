const router = require('express').Router({ mergeParams: true });
const attachmentController = require('../controllers/attachment.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');
const { uploadAttachment } = require('../config/cloudinary');

router.use(protect, loadTrip, requireAccess);

router.get('/', attachmentController.getAttachments);
router.post('/', requireEditor, uploadAttachment.single('file'), attachmentController.uploadAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;