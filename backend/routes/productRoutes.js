const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getProducts).post(adminOnly, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(adminOnly, updateProduct)
  .delete(adminOnly, deleteProduct);

module.exports = router;
