const router = require('express').Router({ mergeParams: true });
const checklistController = require('../controllers/checklist.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', checklistController.getChecklists);
router.post('/', requireEditor, checklistController.createChecklist);
router.patch('/:id', requireEditor, checklistController.updateChecklist);
router.delete('/:id', requireEditor, checklistController.deleteChecklist);

// Items
router.post('/:id/items', requireEditor, checklistController.addItem);
router.patch('/:checklistId/items/:itemId/toggle', checklistController.toggleItem);
router.delete('/:checklistId/items/:itemId', requireEditor, checklistController.deleteItem);

module.exports = router;