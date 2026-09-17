const Quotation = require('../models/Quotation');
const PerformaInvoice = require('../models/PerformaInvoice');
const Customer = require('../models/Customer');
const CompanySettings = require('../models/CompanySettings');
const { numberToWords } = require('../utils/numberToWords');

// Helper to generate document number
const generateQuotationNumber = async () => {
  let settings = await CompanySettings.findOne();
  if (!settings) settings = await CompanySettings.create({});

  const prefix = settings.quotationSettings?.prefix || 'GC-QTN';
  const year = new Date().getFullYear();
  let format = settings.quotationSettings?.numberFormat || '{prefix}-{year}-{seq4}';

  let nextSeq = settings.quotationSettings?.nextNumber || 1;
  let number = '';
  while (true) {
    const seqPadded = String(nextSeq).padStart(4, '0');
    number = format
      .replace('{prefix}', prefix)
      .replace('{year}', year)
      .replace('{seq4}', seqPadded)
      .replace('{seq}', nextSeq);
    const exists = await Quotation.findOne({ quotationNumber: number });
    if (!exists) break;
    nextSeq++;
  }

  // Save next sequence
  settings.quotationSettings.nextNumber = nextSeq + 1;
  await settings.save();

  return number;
};

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = async (req, res) => {
  try {
    const { status, customer, search } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (customer) {
      query.customer = customer;
    }

    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { 'buyerSnapshot.companyName': { $regex: search, $options: 'i' } },
      ];
    }

    const quotations = await Quotation.find(query)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('convertedToInvoiceId', 'invoiceNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get quotation by ID
// @route   GET /api/quotations/:id
// @access  Private
const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('convertedToInvoiceId', 'invoiceNumber');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get preview of next quotation number
// @route   GET /api/quotations/next-number
// @access  Private
const getNextNumber = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});

    const prefix = settings.quotationSettings?.prefix || 'GC-QTN';
    const year = new Date().getFullYear();
    const nextSeq = settings.quotationSettings?.nextNumber || 1;
    const seqPadded = String(nextSeq).padStart(4, '0');

    let format = settings.quotationSettings?.numberFormat || '{prefix}-{year}-{seq4}';
    const number = format
      .replace('{prefix}', prefix)
      .replace('{year}', year)
      .replace('{seq4}', seqPadded)
      .replace('{seq}', nextSeq);

    res.json({ success: true, nextNumber: number });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private
const createQuotation = async (req, res) => {
  try {
    const {
      quotationNumber: customNumber,
      quotationDate,
      validUntil,
      customerId,
      currency = 'USD',
      vesselDetails,
      departureDateText,
      items = [],
      freightDescription,
      freightCost = 0,
      discount = 0,
      tax = 0,
      paymentTerms,
      deliveryTerms,
      incoterms,
      specificTerms,
      signatory,
      status = 'Draft',
      notes,
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const quotationNumber = customNumber || (await generateQuotationNumber());

    // Calculate line totals and subtotal
    let calculatedItems = [];
    let totalCartons = 0;
    let itemsSubtotal = 0;

    for (const item of items) {
      const qty = Number(item.quantityCartons) || 0;
      const boxRate = Number(item.boxRate) || 0;
      const lineTotal = Number(item.lineTotal !== undefined ? item.lineTotal : (qty * boxRate).toFixed(2));

      totalCartons += qty;
      itemsSubtotal += lineTotal;

      calculatedItems.push({
        itemCode: item.itemCode || '',
        description: item.description,
        netWeightPerBox: item.netWeightPerBox || '',
        ratePerNutKg: Number(item.ratePerNutKg) || 0,
        boxRate,
        quantityCartons: qty,
        lineTotal,
      });
    }

    const freight = Number(freightCost) || 0;
    const subtotal = Number((itemsSubtotal + freight).toFixed(2));
    const discountVal = Number(discount) || 0;
    const taxVal = Number(tax) || 0;
    const grandTotal = Number((subtotal - discountVal + taxVal).toFixed(2));
    const words = numberToWords(grandTotal, currency);

    const quotation = await Quotation.create({
      quotationNumber,
      quotationDate: quotationDate || new Date(),
      validUntil,
      customer: customer._id,
      buyerSnapshot: {
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        address: customer.address,
        country: customer.country,
        email: customer.email,
        phone: customer.phone,
        taxNumber: customer.taxNumber,
        buyerReference: customer.buyerReference,
      },
      currency,
      vesselDetails:
        vesselDetails ||
        'Line : MAERSK  Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS',
      departureDateText: departureDateText || '',
      items: calculatedItems,
      freightDescription: freightDescription || 'Free time at destination added cost for Freight',
      freightCost: freight,
      totalCartons,
      subtotal,
      discount: discountVal,
      tax: taxVal,
      grandTotal,
      amountInWords: words,
      paymentTerms,
      deliveryTerms,
      incoterms: incoterms || 'CIF',
      specificTerms: specificTerms || [],
      signatory: signatory || {
        name: 'Authorized Signatory',
        designation: 'Chief Executive Officer',
        company: 'Greatway Ceylon (Pvt) Ltd',
      },
      status,
      notes,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quotation
// @route   PUT /api/quotations/:id
// @access  Private
const updateQuotation = async (req, res) => {
  try {
    const existing = await Quotation.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const {
      quotationDate,
      validUntil,
      customerId,
      currency,
      vesselDetails,
      departureDateText,
      items,
      freightDescription,
      freightCost,
      discount,
      tax,
      paymentTerms,
      deliveryTerms,
      incoterms,
      specificTerms,
      signatory,
      status,
      notes,
    } = req.body;

    let buyerSnapshot = existing.buyerSnapshot;
    let customerRef = existing.customer;

    if (customerId && customerId.toString() !== existing.customer.toString()) {
      const newCustomer = await Customer.findById(customerId);
      if (newCustomer) {
        customerRef = newCustomer._id;
        buyerSnapshot = {
          companyName: newCustomer.companyName,
          contactPerson: newCustomer.contactPerson,
          address: newCustomer.address,
          country: newCustomer.country,
          email: newCustomer.email,
          phone: newCustomer.phone,
          taxNumber: newCustomer.taxNumber,
          buyerReference: newCustomer.buyerReference,
        };
      }
    }

    let calculatedItems = existing.items;
    let totalCartons = 0;
    let itemsSubtotal = 0;

    if (items && Array.isArray(items)) {
      calculatedItems = [];
      for (const item of items) {
        const qty = Number(item.quantityCartons) || 0;
        const boxRate = Number(item.boxRate) || 0;
        const lineTotal = Number(item.lineTotal !== undefined ? item.lineTotal : (qty * boxRate).toFixed(2));

        totalCartons += qty;
        itemsSubtotal += lineTotal;

        calculatedItems.push({
          itemCode: item.itemCode || '',
          description: item.description,
          netWeightPerBox: item.netWeightPerBox || '',
          ratePerNutKg: Number(item.ratePerNutKg) || 0,
          boxRate,
          quantityCartons: qty,
          lineTotal,
        });
      }
    } else {
      totalCartons = existing.totalCartons;
      itemsSubtotal = calculatedItems.reduce((sum, it) => sum + (it.lineTotal || 0), 0);
    }

    const curr = currency || existing.currency || 'USD';
    const freight = freightCost !== undefined ? Number(freightCost) : existing.freightCost;
    const subtotal = Number((itemsSubtotal + freight).toFixed(2));
    const discountVal = discount !== undefined ? Number(discount) : existing.discount;
    const taxVal = tax !== undefined ? Number(tax) : existing.tax;
    const grandTotal = Number((subtotal - discountVal + taxVal).toFixed(2));
    const words = numberToWords(grandTotal, curr);

    existing.quotationDate = quotationDate || existing.quotationDate;
    existing.validUntil = validUntil !== undefined ? validUntil : existing.validUntil;
    existing.customer = customerRef;
    existing.buyerSnapshot = buyerSnapshot;
    existing.currency = curr;
    existing.vesselDetails = vesselDetails !== undefined ? vesselDetails : existing.vesselDetails;
    existing.departureDateText = departureDateText !== undefined ? departureDateText : existing.departureDateText;
    existing.items = calculatedItems;
    existing.freightDescription = freightDescription || existing.freightDescription;
    existing.freightCost = freight;
    existing.totalCartons = totalCartons;
    existing.subtotal = subtotal;
    existing.discount = discountVal;
    existing.tax = taxVal;
    existing.grandTotal = grandTotal;
    existing.amountInWords = words;
    existing.paymentTerms = paymentTerms !== undefined ? paymentTerms : existing.paymentTerms;
    existing.deliveryTerms = deliveryTerms !== undefined ? deliveryTerms : existing.deliveryTerms;
    existing.incoterms = incoterms || existing.incoterms;
    existing.specificTerms = specificTerms || existing.specificTerms;
    existing.signatory = signatory || existing.signatory;
    existing.status = status || existing.status;
    existing.notes = notes !== undefined ? notes : existing.notes;

    const saved = await existing.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quotation status
// @route   PATCH /api/quotations/:id/status
// @access  Private
const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customer');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({
      success: true,
      data: quotation,
      message: `Quotation status updated to ${status}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate quotation
// @route   POST /api/quotations/:id/duplicate
// @access  Private
const duplicateQuotation = async (req, res) => {
  try {
    const original = await Quotation.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original quotation not found' });
    }

    const newNumber = await generateQuotationNumber();
    const docObject = original.toObject();
    delete docObject._id;
    delete docObject.createdAt;
    delete docObject.updatedAt;
    delete docObject.convertedToInvoiceId;

    docObject.quotationNumber = newNumber;
    docObject.quotationDate = new Date();
    docObject.status = 'Draft';
    docObject.createdBy = req.user?._id;

    const duplicated = await Quotation.create(docObject);
    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete quotation
// @route   DELETE /api/quotations/:id
// @access  Private/Admin
const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    await Quotation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to generate invoice number
const generateInvoiceNumber = async () => {
  let settings = await CompanySettings.findOne();
  if (!settings) settings = await CompanySettings.create({});

  const prefix = settings.invoiceSettings?.prefix || 'GC-PI';
  const year = new Date().getFullYear();
  let format = settings.invoiceSettings?.numberFormat || '{prefix}-{year}-{seq4}';

  let nextSeq = settings.invoiceSettings?.nextNumber || 1;
  let number = '';
  while (true) {
    const seqPadded = String(nextSeq).padStart(4, '0');
    number = format
      .replace('{prefix}', prefix)
      .replace('{year}', year)
      .replace('{seq4}', seqPadded)
      .replace('{seq}', nextSeq);
    const exists = await PerformaInvoice.findOne({ invoiceNumber: number });
    if (!exists) break;
    nextSeq++;
  }

  settings.invoiceSettings.nextNumber = nextSeq + 1;
  await settings.save();

  return number;
};

// @desc    Convert Quotation to Performa Invoice
// @route   POST /api/quotations/:id/convert-to-invoice
// @access  Private
const convertToInvoice = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const settings = await CompanySettings.findOne();
    const defaultBank = settings?.bankDetails?.find((b) => b.isDefault) || settings?.bankDetails?.[0] || {
      accountName: 'Greatway Ceylon (Pvt) Ltd',
      bankName: 'COMMERCIAL BANK OF CEYLON PLC',
      bankBranch: 'COLOMBO MAIN BRANCH',
      accountNumber: '1025872806402',
      swift: 'CCEYLKAX',
      iban: '',
      currency: quotation.currency || 'USD',
    };

    const invoiceNumber = await generateInvoiceNumber();

    // Map quotation items to performa invoice items
    const invoiceItems = quotation.items.map((item) => ({
      packages: item.quantityCartons || 1,
      description: item.description,
      perBoxWeight: item.netWeightPerBox || '',
      ratePerNutKg: item.ratePerNutKg || 0,
      boxRate: item.boxRate || 0,
      cifValue: item.lineTotal || 0,
    }));

    const invoice = await PerformaInvoice.create({
      invoiceNumber,
      invoiceDate: new Date(),
      quotationId: quotation._id,
      customer: quotation.customer._id,
      buyerSnapshot: quotation.buyerSnapshot,
      currency: quotation.currency,
      paymentTerms: quotation.paymentTerms,
      shipmentReference: quotation.quotationNumber,
      shippedPer: 'Maersk , Salalah, Oman (CY)',
      voyageNo: '',
      portOfLoading: settings?.invoiceSettings?.defaultPortOfLoading || 'COLOMBO PORT SRI LANKA',
      portOfDischarge: 'Salalah, Oman (CY)',
      containerSpecification: '1X40 REEFER',
      items: invoiceItems,
      freightDescription: quotation.freightDescription || 'Free time at destination added cost for Freight',
      freightCharges: quotation.freightCost || 0,
      otherCharges: 0,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      tax: quotation.tax,
      grandTotal: quotation.grandTotal,
      amountInWords: quotation.amountInWords,
      damagePolicy:
        settings?.invoiceSettings?.defaultDamagePolicy ||
        'Damage Policy: If any of the Goods are found to be damaged upon receipt, the Purchaser shall notify the Supplier in writing, providing evidence such as photographs and videos, within seven (3) days of receipt of the Good (terms and conditions apply).',
      paymentRoutingNote: 'Payment should be made to our bank account as follows:',
      bankDetails: {
        accountName: defaultBank.accountName,
        bankName: defaultBank.bankName,
        bankBranch: defaultBank.bankBranch,
        accountNumber: defaultBank.accountNumber,
        swift: defaultBank.swift,
        iban: defaultBank.iban,
        currency: defaultBank.currency || quotation.currency,
      },
      signatory: quotation.signatory,
      status: 'Draft',
      createdBy: req.user?._id,
    });

    // Mark quotation as accepted and reference the invoice
    quotation.status = 'Accepted';
    quotation.convertedToInvoiceId = invoice._id;
    await quotation.save();

    res.status(201).json({
      success: true,
      data: invoice,
      message: `Quotation converted successfully to Performa Invoice ${invoice.invoiceNumber}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getQuotations,
  getQuotationById,
  getNextNumber,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  duplicateQuotation,
  deleteQuotation,
  convertToInvoice,
};
