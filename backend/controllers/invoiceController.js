const PerformaInvoice = require('../models/PerformaInvoice');
const Customer = require('../models/Customer');
const CompanySettings = require('../models/CompanySettings');
const { numberToWords } = require('../utils/numberToWords');

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

// @desc    Get all performa invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
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
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { shipmentReference: { $regex: search, $options: 'i' } },
        { 'buyerSnapshot.companyName': { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await PerformaInvoice.find(query)
      .populate('customer', 'companyName contactPerson email phone')
      .populate('quotationId', 'quotationNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get performa invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await PerformaInvoice.findById(req.params.id)
      .populate('customer')
      .populate('quotationId', 'quotationNumber quotationDate');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Performa Invoice not found' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get preview of next invoice number
// @route   GET /api/invoices/next-number
// @access  Private
const getNextNumber = async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});

    const prefix = settings.invoiceSettings?.prefix || 'GC-PI';
    const year = new Date().getFullYear();
    const nextSeq = settings.invoiceSettings?.nextNumber || 1;
    const seqPadded = String(nextSeq).padStart(4, '0');

    let format = settings.invoiceSettings?.numberFormat || '{prefix}-{year}-{seq4}';
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

// @desc    Create new performa invoice
// @route   POST /api/invoices
// @access  Private
const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber: customNumber,
      invoiceDate,
      quotationId,
      customerId,
      currency = 'USD',
      paymentTerms,
      shipmentReference,
      shippedPer,
      vessel,
      voyageNo,
      containerNo,
      sealNumber,
      portOfLoading,
      portOfDischarge,
      finalDestination,
      etd,
      eta,
      stack,
      containerSpecification,
      incoterms,
      items = [],
      freightDescription,
      freightCharges = 0,
      otherCharges = 0,
      discount = 0,
      tax = 0,
      damagePolicy,
      termsAndConditions = [],
      paymentRoutingNote,
      bankDetails,
      signatory,
      status = 'Draft',
      notes,
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const invoiceNumber = customNumber || (await generateInvoiceNumber());

    // Calculate line totals and subtotal
    let calculatedItems = [];
    let itemsSubtotal = 0;

    for (const item of items) {
      const pkgs = Number(item.packages !== undefined ? item.packages : item.quantityCartons) || 0;
      const boxRate = Number(item.boxRate) || 0;
      const cif = Number(item.cifValue !== undefined ? item.cifValue : (item.lineTotal !== undefined ? item.lineTotal : (pkgs * boxRate).toFixed(2)));

      itemsSubtotal += cif;

      calculatedItems.push({
        itemCode: item.itemCode || '',
        packages: pkgs,
        quantityCartons: pkgs,
        description: item.description,
        perBoxWeight: item.perBoxWeight || item.netWeightPerBox || '',
        netWeightPerBox: item.netWeightPerBox || item.perBoxWeight || '',
        ratePerNutKg: Number(item.ratePerNutKg) || 0,
        boxRate,
        cifValue: cif,
        lineTotal: cif,
      });
    }

    const freight = Number(freightCharges) || 0;
    const others = Number(otherCharges) || 0;
    const subtotal = Number((itemsSubtotal + freight + others).toFixed(2));
    const discountVal = Number(discount) || 0;
    const taxVal = Number(tax) || 0;
    const grandTotal = Number((subtotal - discountVal + taxVal).toFixed(2));
    const words = numberToWords(grandTotal, currency);

    const invoice = await PerformaInvoice.create({
      invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      quotationId: quotationId || null,
      customer: customer._id,
      buyerSnapshot: {
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        address: customer.address,
        country: customer.country,
        email: customer.email,
        phone: customer.phone,
        taxNumber: customer.taxNumber,
      },
      currency,
      paymentTerms,
      shipmentReference: shipmentReference || 'SH 226-04',
      shippedPer: shippedPer || 'Maersk , Salalah, Oman (CY)',
      vessel: vessel || '',
      voyageNo: voyageNo || 'OEL VARUN 639N',
      containerNo: containerNo || '',
      sealNumber: sealNumber || '',
      portOfLoading: portOfLoading || 'COLOMBO PORT SRI LANKA',
      portOfDischarge: portOfDischarge || 'Salalah, Oman (CY)',
      finalDestination: finalDestination || '',
      etd: etd || '',
      eta: eta || '',
      stack: stack || '',
      containerSpecification: containerSpecification || '1X40 REEFER',
      incoterms: incoterms || 'CIF',
      items: calculatedItems,
      freightDescription: freightDescription || 'Free time at destination added cost for Freight',
      freightCharges: freight,
      otherCharges: others,
      subtotal,
      discount: discountVal,
      tax: taxVal,
      grandTotal,
      amountInWords: words,
      damagePolicy,
      termsAndConditions: Array.isArray(termsAndConditions) ? termsAndConditions : [],
      paymentRoutingNote,
      bankDetails,
      signatory,
      status,
      notes,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update performa invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = async (req, res) => {
  try {
    const existing = await PerformaInvoice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Performa Invoice not found' });
    }

    const {
      invoiceDate,
      customerId,
      currency,
      paymentTerms,
      shipmentReference,
      shippedPer,
      vessel,
      voyageNo,
      containerNo,
      sealNumber,
      portOfLoading,
      portOfDischarge,
      finalDestination,
      etd,
      eta,
      stack,
      containerSpecification,
      incoterms,
      items,
      freightDescription,
      freightCharges,
      otherCharges,
      discount,
      tax,
      damagePolicy,
      termsAndConditions,
      paymentRoutingNote,
      bankDetails,
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
        };
      }
    }

    let calculatedItems = existing.items;
    let itemsSubtotal = 0;

    if (items && Array.isArray(items)) {
      calculatedItems = [];
      for (const item of items) {
        const pkgs = Number(item.packages !== undefined ? item.packages : item.quantityCartons) || 0;
        const boxRate = Number(item.boxRate) || 0;
        const cif = Number(item.cifValue !== undefined ? item.cifValue : (item.lineTotal !== undefined ? item.lineTotal : (pkgs * boxRate).toFixed(2)));

        itemsSubtotal += cif;

        calculatedItems.push({
          itemCode: item.itemCode || '',
          packages: pkgs,
          quantityCartons: pkgs,
          description: item.description,
          perBoxWeight: item.perBoxWeight || item.netWeightPerBox || '',
          netWeightPerBox: item.netWeightPerBox || item.perBoxWeight || '',
          ratePerNutKg: Number(item.ratePerNutKg) || 0,
          boxRate,
          cifValue: cif,
          lineTotal: cif,
        });
      }
    } else {
      itemsSubtotal = calculatedItems.reduce((sum, it) => sum + (it.cifValue || 0), 0);
    }

    const curr = currency || existing.currency || 'USD';
    const freight = freightCharges !== undefined ? Number(freightCharges) : existing.freightCharges;
    const others = otherCharges !== undefined ? Number(otherCharges) : existing.otherCharges;
    const subtotal = Number((itemsSubtotal + freight + others).toFixed(2));
    const discountVal = discount !== undefined ? Number(discount) : existing.discount;
    const taxVal = tax !== undefined ? Number(tax) : existing.tax;
    const grandTotal = Number((subtotal - discountVal + taxVal).toFixed(2));
    const words = numberToWords(grandTotal, curr);

    existing.invoiceDate = invoiceDate || existing.invoiceDate;
    existing.customer = customerRef;
    existing.buyerSnapshot = buyerSnapshot;
    existing.currency = curr;
    existing.paymentTerms = paymentTerms !== undefined ? paymentTerms : existing.paymentTerms;
    existing.shipmentReference = shipmentReference !== undefined ? shipmentReference : existing.shipmentReference;
    existing.shippedPer = shippedPer !== undefined ? shippedPer : existing.shippedPer;
    existing.vessel = vessel !== undefined ? vessel : existing.vessel;
    existing.voyageNo = voyageNo !== undefined ? voyageNo : existing.voyageNo;
    existing.containerNo = containerNo !== undefined ? containerNo : existing.containerNo;
    existing.sealNumber = sealNumber !== undefined ? sealNumber : existing.sealNumber;
    existing.portOfLoading = portOfLoading !== undefined ? portOfLoading : existing.portOfLoading;
    existing.portOfDischarge = portOfDischarge !== undefined ? portOfDischarge : existing.portOfDischarge;
    existing.finalDestination = finalDestination !== undefined ? finalDestination : existing.finalDestination;
    existing.etd = etd !== undefined ? etd : existing.etd;
    existing.eta = eta !== undefined ? eta : existing.eta;
    existing.stack = stack !== undefined ? stack : existing.stack;
    existing.containerSpecification =
      containerSpecification !== undefined ? containerSpecification : existing.containerSpecification;
    existing.incoterms = incoterms !== undefined ? incoterms : (existing.incoterms || 'CIF');
    existing.items = calculatedItems;
    existing.freightDescription = freightDescription || existing.freightDescription;
    existing.freightCharges = freight;
    existing.otherCharges = others;
    existing.subtotal = subtotal;
    existing.discount = discountVal;
    existing.tax = taxVal;
    existing.grandTotal = grandTotal;
    existing.amountInWords = words;
    existing.damagePolicy = damagePolicy !== undefined ? damagePolicy : existing.damagePolicy;
    if (termsAndConditions !== undefined) {
      existing.termsAndConditions = Array.isArray(termsAndConditions) ? termsAndConditions : [];
    }
    existing.paymentRoutingNote =
      paymentRoutingNote !== undefined ? paymentRoutingNote : existing.paymentRoutingNote;
    existing.bankDetails = bankDetails || existing.bankDetails;
    existing.signatory = signatory || existing.signatory;
    existing.status = status || existing.status;
    existing.notes = notes !== undefined ? notes : existing.notes;

    const saved = await existing.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Draft', 'Issued', 'Sent', 'Partially Paid', 'Paid', 'Cancelled'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const invoice = await PerformaInvoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customer');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Performa Invoice not found' });
    }

    res.json({
      success: true,
      data: invoice,
      message: `Invoice status updated to ${status}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate invoice
// @route   POST /api/invoices/:id/duplicate
// @access  Private
const duplicateInvoice = async (req, res) => {
  try {
    const original = await PerformaInvoice.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original invoice not found' });
    }

    const newNumber = await generateInvoiceNumber();
    const docObject = original.toObject();
    delete docObject._id;
    delete docObject.createdAt;
    delete docObject.updatedAt;
    delete docObject.quotationId;

    docObject.invoiceNumber = newNumber;
    docObject.invoiceDate = new Date();
    docObject.status = 'Draft';
    docObject.createdBy = req.user?._id;

    const duplicated = await PerformaInvoice.create(docObject);
    res.status(201).json({ success: true, data: duplicated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await PerformaInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Performa Invoice not found' });
    }

    await PerformaInvoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Performa Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  getNextNumber,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  duplicateInvoice,
  deleteInvoice,
};
