const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  getNextNumber,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  duplicateQuotation,
  deleteQuotation,
  convertToInvoice,
} = require('../controllers/quotationController');
const { generateQuotationPdf } = require('../controllers/pdfController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/next-number', getNextNumber);
router.route('/').get(getQuotations).post(createQuotation);
router.get('/:id/pdf', generateQuotationPdf);
router.post('/:id/duplicate', duplicateQuotation);
router.post('/:id/convert-to-invoice', convertToInvoice);
router.patch('/:id/status', updateQuotationStatus);
router
  .route('/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(adminOnly, deleteQuotation);

module.exports = router;
