const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getCustomers).post(createCustomer);
router
  .route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(adminOnly, deleteCustomer);

module.exports = router;
