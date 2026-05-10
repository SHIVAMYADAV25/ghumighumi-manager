const router = require('express').Router({ mergeParams: true });
const budgetController = require('../controllers/budget.controller');
const { protect } = require('../middleware/auth');
const { loadTrip, requireAccess, requireEditor } = require('../middleware/tripAccess');

router.use(protect, loadTrip, requireAccess);

router.get('/', budgetController.getBudgetSummary);
router.patch('/', requireEditor, budgetController.updateBudget);

router.post('/expenses', budgetController.addExpense);
router.patch('/expenses/:id', budgetController.updateExpense);
router.delete('/expenses/:id', budgetController.deleteExpense);
router.patch('/expenses/:id/settle', budgetController.settleExpense);

module.exports = router;