const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  itemCode: { type: String, default: '' },
  packages: { type: Number, required: true, default: 1 },
  quantityCartons: { type: Number, default: 0 },
  description: { type: String, required: true },
  perBoxWeight: { type: String, default: '' },
  netWeightPerBox: { type: String, default: '' },
  ratePerNutKg: { type: Number, default: 0 },
  boxRate: { type: Number, default: 0 },
  cifValue: { type: Number, required: true, default: 0 },
  lineTotal: { type: Number, default: 0 },
});

const performaInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    buyerSnapshot: {
      companyName: String,
      contactPerson: String,
      address: String,
      country: String,
      email: String,
      phone: String,
      taxNumber: String,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentTerms: {
      type: String,
      default: '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customers warehouse.',
    },
    shipmentReference: {
      type: String,
      default: 'SH 226-04',
    },
    shippedPer: {
      type: String,
      default: 'Maersk , Salalah, Oman (CY)',
    },
    voyageNo: {
      type: String,
      default: 'OEL VARUN 639N',
    },
    portOfLoading: {
      type: String,
      default: 'COLOMBO PORT SRI LANKA',
    },
    portOfDischarge: {
      type: String,
      default: 'Salalah, Oman (CY)',
    },
    containerSpecification: {
      type: String,
      default: '1X40 REEFER',
    },
    incoterms: {
      type: String,
      default: 'CIF',
    },
    items: [invoiceItemSchema],
    freightDescription: {
      type: String,
      default: 'Free time at destination added cost for Freight',
    },
    freightCharges: {
      type: Number,
      default: 0,
    },
    otherCharges: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    amountInWords: {
      type: String,
      default: '',
    },
    damagePolicy: {
      type: String,
      default: 'Damage Policy: If any of the Goods are found to be damaged upon receipt, the Purchaser shall notify the Supplier in writing, providing evidence such as photographs and videos, within seven (3) days of receipt of the Good (terms and conditions apply).',
    },
    paymentRoutingNote: {
      type: String,
      default: 'Payment should be made to our bank account as follows:',
    },
    bankDetails: {
      accountName: { type: String, default: 'Greatway Ceylon (Pvt) Ltd' },
      bankName: { type: String, default: 'COMMERCIAL BANK OF CEYLON PLC' },
      bankBranch: { type: String, default: 'COLOMBO MAIN BRANCH' },
      accountNumber: { type: String, default: '1025872806402' },
      swift: { type: String, default: 'CCEYLKAX' },
      iban: { type: String, default: '' },
      currency: { type: String, default: 'USD' },
    },
    signatory: {
      name: { type: String, default: 'Authorized Signatory' },
      designation: { type: String, default: 'Chief Executive Officer' },
      company: { type: String, default: 'Greatway Ceylon (Pvt) Ltd' },
    },
    status: {
      type: String,
      enum: ['Draft', 'Issued', 'Sent', 'Partially Paid', 'Paid', 'Cancelled'],
      default: 'Draft',
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PerformaInvoice', performaInvoiceSchema);
