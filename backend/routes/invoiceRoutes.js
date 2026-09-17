const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  getNextNumber,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  duplicateInvoice,
  deleteInvoice,
} = require('../controllers/invoiceController');
const { generateInvoicePdf, generateInvoiceHtml } = require('../controllers/pdfController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/next-number', getNextNumber);
router.route('/').get(getInvoices).post(createInvoice);
router.get('/:id/pdf', generateInvoicePdf);
router.get('/:id/html', generateInvoiceHtml);
router.post('/:id/duplicate', duplicateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router
  .route('/:id')
  .get(getInvoiceById)
  .put(updateInvoice)
  .delete(adminOnly, deleteInvoice);

module.exports = router;
