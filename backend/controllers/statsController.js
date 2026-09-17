const Quotation = require('../models/Quotation');
const PerformaInvoice = require('../models/PerformaInvoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

// @desc    Get dashboard metrics and unified recent documents
// @route   GET /api/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const quotations = await Quotation.find({})
      .populate('customer', 'companyName')
      .sort({ createdAt: -1 });

    const invoices = await PerformaInvoice.find({})
      .populate('customer', 'companyName')
      .sort({ createdAt: -1 });

    const totalQuotations = quotations.length;
    const pendingQuotations = quotations.filter((q) => ['Draft', 'Sent'].includes(q.status)).length;
    const acceptedQuotations = quotations.filter((q) => q.status === 'Accepted').length;

    const totalInvoices = invoices.length;
    const pendingPayments = invoices.filter((i) =>
      ['Draft', 'Issued', 'Sent', 'Partially Paid'].includes(i.status)
    ).length;
    const paidInvoices = invoices.filter((i) => i.status === 'Paid').length;

    // Total sales value from paid invoices (or all active invoices)
    const totalSalesValue = invoices
      .filter((i) => i.status !== 'Cancelled')
      .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

    const paidSalesValue = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + (i.grandTotal || 0), 0);

    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments({ active: true });

    // Combine recent documents for the unified table
    const recentQuotations = quotations.slice(0, 10).map((q) => ({
      _id: q._id,
      docNumber: q.quotationNumber,
      docType: 'Quotation',
      customer: q.buyerSnapshot?.companyName || q.customer?.companyName || 'N/A',
      customerId: q.customer?._id,
      date: q.quotationDate,
      currency: q.currency,
      amount: q.grandTotal,
      status: q.status,
      convertedToInvoiceId: q.convertedToInvoiceId,
      createdAt: q.createdAt,
    }));

    const recentInvoices = invoices.slice(0, 10).map((i) => ({
      _id: i._id,
      docNumber: i.invoiceNumber,
      docType: 'Performa Invoice',
      customer: i.buyerSnapshot?.companyName || i.customer?.companyName || 'N/A',
      customerId: i.customer?._id,
      date: i.invoiceDate,
      currency: i.currency,
      amount: i.grandTotal,
      status: i.status,
      quotationId: i.quotationId,
      createdAt: i.createdAt,
    }));

    const unifiedRecentDocs = [...recentQuotations, ...recentInvoices]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15);

    res.json({
      success: true,
      data: {
        summary: {
          totalQuotations,
          pendingQuotations,
          acceptedQuotations,
          totalInvoices,
          pendingPayments,
          paidInvoices,
          totalSalesValue,
          paidSalesValue,
          totalCustomers,
          totalProducts,
        },
        recentDocuments: unifiedRecentDocs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats };
