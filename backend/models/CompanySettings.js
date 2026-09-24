const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: 'GREATWAY CEYLON (PVT) LTD',
    },
    businessType: {
      type: String,
      default: 'Exporter of fresh fruits, vegetables, King Coconut and aromatic spices from Sri Lanka to international markets.',
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
      default: 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300',
    },
    phone: {
      type: String,
      default: '+94 77 123 4567',
    },
    email: {
      type: String,
      default: 'info@greatwayceylon.com',
    },
    website: {
      type: String,
      default: 'https://greatwayceylon.com/',
    },
    taxNumber: {
      type: String,
      default: '103406048 - 7000',
    },
    registrationNumber: {
      type: String,
      default: 'PV 00263042',
    },
    logoUrl: {
      type: String,
      default: '/uploads/logo.png',
    },
    signatureUrl: {
      type: String,
      default: '/uploads/signature.png',
    },
    showSignature: {
      type: Boolean,
      default: true,
    },
    iconUrl: {
      type: String,
      default: '/uploads/icon.jpg',
    },
    defaultCurrency: {
      type: String,
      default: 'USD',
    },
    bankDetails: [
      {
        accountName: { type: String, default: 'Greatway Ceylon (Pvt) Ltd' },
        bankName: { type: String, default: 'COMMERCIAL BANK OF CEYLON PLC' },
        bankBranch: { type: String, default: 'COLOMBO MAIN BRANCH' },
        accountNumber: { type: String, default: '1025872806402' },
        swift: { type: String, default: 'CCEYLKAX' },
        iban: { type: String, default: '' },
        currency: { type: String, default: 'USD' },
        paymentNote: { type: String, default: '' },
        isDefault: { type: Boolean, default: true },
      },
    ],
    quotationSettings: {
      prefix: { type: String, default: 'GC-QTN' },
      nextNumber: { type: Number, default: 1 },
      numberFormat: { type: String, default: '{prefix}-{year}-{seq4}' },
      defaultValidityDays: { type: Number, default: 14 },
      defaultPaymentTerms: {
        type: String,
        default: '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
      },
      defaultDeliveryTerms: {
        type: String,
        default: 'The quoted CIF rates are applicable only up to destination port. Transportation, customs clearance, and delivery from port to final location shall be arranged and borne by customer.',
      },
      defaultIncoterms: { type: String, default: 'CIF' },
      defaultSpecificTerms: {
        type: [String],
        default: [
          'All prices are based on CIF terms.',
          'Prices are subject to change due to changes in Sri Lankan market conditions.',
          'Delivery Terms: The quoted CIF rates are applicable only up to destination port. Transportation, customs clearance, and delivery from port to customer\'s final location shall be arranged and borne by the customer.',
          'Approximate order quantity as indicated in item list.',
          'Payment terms: 50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
          'Damage Liability: Damages should be reported within 10 days of arrival of goods at destination port with photos and temperature gauge readings.',
          'The standard terms and conditions along with the product specification sheet, herewith attached (Attachment 01).'
        ],
      },
    },
    invoiceSettings: {
      prefix: { type: String, default: 'GC-PI' },
      nextNumber: { type: Number, default: 1 },
      numberFormat: { type: String, default: '{prefix}-{year}-{seq4}' },
      defaultPortOfLoading: { type: String, default: 'COLOMBO PORT SRI LANKA' },
      defaultPaymentTerms: {
        type: String,
        default: '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customers warehouse.',
      },
      defaultDamagePolicy: {
        type: String,
        default: 'Damage Policy: If any of the Goods are found to be damaged upon receipt, the Purchaser shall notify the Supplier in writing, providing evidence such as photographs and videos, within seven (3) days of receipt of the Good (terms and conditions apply).',
      },
    },
    shipmentReferenceSettings: {
      prefix: { type: String, default: 'GWC' },
      nextNumber: { type: Number, default: 1 },
      numberFormat: { type: String, default: '{prefix}-{yy}-{seq2}' },
    },
    defaultSignatory: {
      name: { type: String, default: 'Authorized Signatory' },
      designation: { type: String, default: 'Director / Chief Executive Officer' },
      signatureImageUrl: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
