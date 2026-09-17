const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  itemCode: { type: String, default: '' },
  description: { type: String, required: true },
  netWeightPerBox: { type: String, default: '' },
  ratePerNutKg: { type: Number, default: 0 },
  boxRate: { type: Number, default: 0 },
  quantityCartons: { type: Number, required: true, default: 1 },
  lineTotal: { type: Number, required: true, default: 0 },
});

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    quotationDate: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    // Snapshot of buyer details at generation time
    buyerSnapshot: {
      companyName: String,
      contactPerson: String,
      address: String,
      country: String,
      email: String,
      phone: String,
      taxNumber: String,
      buyerReference: String,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    vesselDetails: {
      type: String,
      default: 'Line : MAERSK  Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS',
    },
    departureDateText: {
      type: String,
      default: '',
    },
    items: [quotationItemSchema],
    freightDescription: {
      type: String,
      default: 'Free time at destination added cost for Freight',
    },
    freightCost: {
      type: Number,
      default: 0,
    },
    totalCartons: {
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
    paymentTerms: {
      type: String,
      default: '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
    },
    deliveryTerms: {
      type: String,
      default: 'The quoted CIF rates are applicable only up to Salalah Port, Oman. Transportation, customs clearance, and delivery from Salalah Port to the customer\'s final location shall be arranged and borne by the customer.',
    },
    incoterms: {
      type: String,
      default: 'CIF',
    },
    specificTerms: {
      type: [String],
      default: [],
    },
    signatory: {
      name: { type: String, default: 'Authorized Signatory' },
      designation: { type: String, default: 'Chief Executive Officer' },
      company: { type: String, default: 'Greatway Ceylon (Pvt) Ltd' },
    },
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft',
    },
    convertedToInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PerformaInvoice',
      default: null,
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

module.exports = mongoose.model('Quotation', quotationSchema);
