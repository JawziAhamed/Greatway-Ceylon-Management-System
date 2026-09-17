const Customer = require('../models/Customer');
const Quotation = require('../models/Quotation');
const PerformaInvoice = require('../models/PerformaInvoice');

// @desc    Get all customers with optional search
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ companyName: 1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get customer by ID with document history
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const quotations = await Quotation.find({ customer: customer._id }).sort({ createdAt: -1 });
    const invoices = await PerformaInvoice.find({ customer: customer._id }).sort({ createdAt: -1 });

    const totalQuotationValue = quotations.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
    const totalInvoiceValue = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const paidInvoiceValue = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);

    res.json({
      success: true,
      data: {
        customer,
        quotations,
        invoices,
        stats: {
          totalQuotations: quotations.length,
          totalInvoices: invoices.length,
          totalQuotationValue,
          totalInvoiceValue,
          paidInvoiceValue,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
  try {
    const { companyName, contactPerson, address, country, email, phone, taxNumber, buyerReference, notes } = req.body;

    if (!companyName) {
      return res.status(400).json({ success: false, message: 'Company Name is required' });
    }

    const customer = await Customer.create({
      companyName,
      contactPerson,
      address,
      country,
      email,
      phone,
      taxNumber,
      buyerReference,
      notes,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete customer (soft delete)
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.isActive = false;
    await customer.save();

    res.json({ success: true, message: 'Customer removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
