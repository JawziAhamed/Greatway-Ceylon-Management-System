const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const CompanySettings = require('../models/CompanySettings');
const Quotation = require('../models/Quotation');
const PerformaInvoice = require('../models/PerformaInvoice');
const { numberToWords } = require('./numberToWords');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/greatway_ceylon';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // 1. Seed Users
    let admin = await User.findOne({ email: 'admin@greatwayceylon.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Greatway Administrator',
        email: 'admin@greatwayceylon.com',
        password: 'Admin@123',
        role: 'admin',
      });
      console.log('Admin user created: admin@greatwayceylon.com / Admin@123');
    } else {
      console.log('Admin user already exists.');
    }

    let staff = await User.findOne({ email: 'staff@greatwayceylon.com' });
    if (!staff) {
      staff = await User.create({
        name: 'Export Sales Staff',
        email: 'staff@greatwayceylon.com',
        password: 'Staff@123',
        role: 'staff',
      });
      console.log('Staff user created: staff@greatwayceylon.com / Staff@123');
    }

    // 2. Seed Company Settings
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'GREATWAY CEYLON (PVT) LTD',
        businessType:
          'Exporter of fresh fruits, vegetables, King Coconut and aromatic spices from Sri Lanka to international markets.',
        address: 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300',
        phone: '+94 77 123 4567',
        email: 'info@greatwayceylon.com',
        website: 'https://greatwayceylon.com/',
        taxNumber: '103406048 - 7000',
        registrationNumber: 'PV 00263042',
        logoUrl: '/uploads/logo.png',
        iconUrl: '/uploads/icon.jpg',
        defaultCurrency: 'USD',
        bankDetails: [
          {
            accountName: 'Greatway Ceylon Fruits And Vegetables Trading L.L.C',
            bankName: 'EMIRATES NBD',
            bankBranch: 'RAS AL KHOR',
            accountNumber: '1025872806402',
            swift: 'EBILAEADXXX',
            iban: 'AE52 0260 0010 2587 2806 402',
            currency: 'USD',
            paymentNote: "Payment should be made to our agent in the UAE, 'Greatway Ceylon Fruits and Vegetables Trading LLC'.",
            isDefault: true,
          },
          {
            accountName: 'GREATWAY CEYLON (PVT) LTD',
            bankName: 'COMMERCIAL BANK OF CEYLON PLC',
            bankBranch: 'COLOMBO MAIN BRANCH',
            accountNumber: '100098234812',
            swift: 'CCEYLKAX',
            iban: '',
            currency: 'USD',
            paymentNote: 'Direct SWIFT wire transfer to Commercial Bank of Ceylon PLC, Colombo.',
            isDefault: false,
          },
        ],
        quotationSettings: {
          prefix: 'GC-QTN',
          nextNumber: 2,
          numberFormat: '{prefix}-{year}-{seq4}',
          defaultValidityDays: 14,
          defaultPaymentTerms:
            '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
          defaultDeliveryTerms:
            'The quoted CIF rates are applicable only up to Salalah Port, Oman. Transportation, customs clearance, and delivery from Salalah Port to customer\'s final location shall be arranged and borne by customer.',
          defaultIncoterms: 'CIF',
          defaultSpecificTerms: [
            'All prices are based on CIF terms.',
            'Prices are subject to change due to changes in Sri Lankan market conditions.',
            'Delivery Terms: The quoted CIF rates are applicable only up to Salalah Port, Oman. Transportation, customs clearance, and delivery from Salalah Port to customer\'s final location shall be arranged and borne by customer.',
            'Approximate order quantity: Number of cartons - 2,950',
            'Payment terms: 50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
            'Damage Liability: Damages should be reported within 10 days of the arrival of goods at the destination port (Refer to attachment 01 for general terms and conditions). Greatway Ceylon will not accept liability if goods are not cleared within 48 hours or temperature gauge reports are missing.',
            'The standard terms and conditions along with the product specification sheet, herewith attached (Attachment 01).'
          ],
        },
        invoiceSettings: {
          prefix: 'GC-PI',
          nextNumber: 2,
          numberFormat: '{prefix}-{year}-{seq4}',
          defaultPortOfLoading: 'COLOMBO PORT SRI LANKA',
          defaultPaymentTerms:
            '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customers warehouse.',
          defaultDamagePolicy:
            'Damage Policy: If any of the Goods are found to be damaged upon receipt, the Purchaser shall notify the Supplier in writing, providing evidence such as photographs and videos, within seven (3) days of receipt of the Good (terms and conditions apply).',
        },
        defaultSignatory: {
          name: 'C C Ranesh Anthony',
          designation: 'Chief Executive Officer',
          signatureImageUrl: '',
        },
      });
      console.log('Company Settings seeded.');
    }

    // 3. Seed Products
    const productsToSeed = [
      {
        name: 'King Coconut',
        code: 'KC',
        description: 'Export Grade Fresh King Coconut',
        category: 'Fresh Fruits',
        unit: 'Cartons',
        defaultWeightPerBox: '6 nuts',
        defaultRatePerNutKg: 1.27,
        defaultBoxRate: 7.60,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Red Lady Papaya',
        code: 'RP',
        description: 'Fresh Red Papaya / Red Lady export quality',
        category: 'Fresh Fruits',
        unit: 'Cartons',
        defaultWeightPerBox: '5.5 kg',
        defaultRatePerNutKg: 1.36,
        defaultBoxRate: 7.49,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Curry Papaya / Green Papaya',
        code: 'CP/GP',
        description: 'Fresh Green Cooking Papaya',
        category: 'Fresh Vegetables',
        unit: 'Cartons',
        defaultWeightPerBox: '5.5 kg',
        defaultRatePerNutKg: 0.87,
        defaultBoxRate: 4.80,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Kappa / Tapioca',
        code: 'Kappa',
        description: 'Fresh Cassava / Tapioca Root',
        category: 'Roots & Tubers',
        unit: 'Cartons',
        defaultWeightPerBox: '5.5 kg',
        defaultRatePerNutKg: 1.22,
        defaultBoxRate: 6.70,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Ceylon Pure Cinnamon Alba',
        code: 'CIN-ALBA',
        description: 'Finest Alba Grade Ceylon Cinnamon quills',
        category: 'Spices',
        unit: 'Cartons',
        defaultWeightPerBox: '10 kg',
        defaultRatePerNutKg: 24.50,
        defaultBoxRate: 245.00,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Ceylon Green Cardamom',
        code: 'CARD-01',
        description: 'Grade 1 Green Cardamom pods',
        category: 'Spices',
        unit: 'Cartons',
        defaultWeightPerBox: '5 kg',
        defaultRatePerNutKg: 32.00,
        defaultBoxRate: 160.00,
        currency: 'USD',
        active: true,
      },
      {
        name: 'Ceylon Handpicked Cloves',
        code: 'CLOVE-01',
        description: 'Lal Pari Handpicked Cloves',
        category: 'Spices',
        unit: 'Cartons',
        defaultWeightPerBox: '10 kg',
        defaultRatePerNutKg: 14.50,
        defaultBoxRate: 145.00,
        currency: 'USD',
        active: true,
      },
    ];

    for (const prod of productsToSeed) {
      const exists = await Product.findOne({ code: prod.code });
      if (!exists) {
        await Product.create(prod);
      }
    }
    console.log('Export products verified.');

    // 4. Seed Customers
    let customer = await Customer.findOne({ companyName: 'Nuragro FZE' });
    if (!customer) {
      customer = await Customer.create({
        companyName: 'Nuragro FZE',
        contactPerson: 'Tariq Al-Mansoor',
        address: 'P.O Box No: 51505',
        country: 'Sharjah, UAE',
        email: 'info@nuragro.ae',
        phone: '+971 6 512 8899',
        taxNumber: 'TRN-10029384910003',
        buyerReference: 'NRG-EXP-2026',
        notes: 'Primary UAE importer of fresh coconut and papaya.',
      });
      console.log('Seeded Customer: Nuragro FZE');
    }

    let customer2 = await Customer.findOne({ companyName: 'Al-Maya Trading LLC' });
    if (!customer2) {
      await Customer.create({
        companyName: 'Al-Maya Trading LLC',
        contactPerson: 'Sunil Vaswani',
        address: 'Al-Maya Building, Al Quoz 3',
        country: 'Dubai, UAE',
        email: 'imports@almaya.ae',
        phone: '+971 4 347 1222',
        taxNumber: 'TRN-10048291020002',
        buyerReference: 'ALM-2026-DXB',
      });
    }

    // 5. Seed Prototype Quotation if none exists
    const qCount = await Quotation.countDocuments();
    let sampleQuotation = null;
    if (qCount === 0 && customer) {
      const qItems = [
        {
          itemCode: 'KC',
          description: 'King Coconut',
          netWeightPerBox: '6 nuts',
          ratePerNutKg: 1.27,
          boxRate: 7.60,
          quantityCartons: 1900,
          lineTotal: 14432.94,
        },
        {
          itemCode: 'RP',
          description: 'Red Lady Papaya',
          netWeightPerBox: '5.5 kg',
          ratePerNutKg: 1.36,
          boxRate: 7.49,
          quantityCartons: 350,
          lineTotal: 2623.23,
        },
        {
          itemCode: 'CP/GP',
          description: 'Curry Papaya / Green Papaya',
          netWeightPerBox: '5.5 kg',
          ratePerNutKg: 0.87,
          boxRate: 4.80,
          quantityCartons: 300,
          lineTotal: 1439.60,
        },
        {
          itemCode: 'Kappa',
          description: 'Kappa / Tapioca',
          netWeightPerBox: '5.5 kg',
          ratePerNutKg: 1.22,
          boxRate: 6.70,
          quantityCartons: 400,
          lineTotal: 2681.76,
        },
      ];

      const freightCost = 250.00;
      const subtotal = 21427.53;
      const grandTotal = 21427.53;

      sampleQuotation = await Quotation.create({
        quotationNumber: 'GC-QTN-2026-0001',
        quotationDate: new Date('2026-09-09'),
        validUntil: new Date('2026-09-23'),
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
        currency: 'USD',
        vesselDetails: 'Line : MAERSK  Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS',
        departureDateText: '22nd September 2026',
        items: qItems,
        freightDescription: 'Free time at destination added cost for Freight',
        freightCost: freightCost,
        totalCartons: 2950,
        subtotal: subtotal,
        discount: 0,
        tax: 0,
        grandTotal: grandTotal,
        amountInWords: numberToWords(grandTotal, 'USD'),
        paymentTerms:
          '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
        deliveryTerms:
          'The quoted CIF rates are applicable only up to Salalah Port, Oman. Transportation, customs clearance, and delivery from Salalah Port to the customer\'s final location shall be arranged and borne by the customer.',
        incoterms: 'CIF',
        specificTerms: settings.quotationSettings.defaultSpecificTerms,
        signatory: {
          name: 'C C Ranesh Anthony',
          designation: 'Chief Executive Officer',
          company: 'Greatway Ceylon (Pvt) Ltd',
        },
        status: 'Accepted',
        createdBy: admin._id,
      });
      console.log('Prototype Quotation GC-QTN-2026-0001 created.');
    }

    // 6. Seed Prototype Performa Invoice if none exists
    const invCount = await PerformaInvoice.countDocuments();
    if (invCount === 0 && customer) {
      const invItems = [
        {
          packages: 1900,
          description: 'FRESH KING COCONUT',
          perBoxWeight: '6 nuts',
          ratePerNutKg: 1.27,
          boxRate: 7.60,
          cifValue: 14440.00,
        },
        {
          packages: 400,
          description: 'FRESH TAPIOCA',
          perBoxWeight: '5.5 kg',
          ratePerNutKg: 1.22,
          boxRate: 6.70,
          cifValue: 2680.00,
        },
        {
          packages: 350,
          description: 'FRESH RED PAPAYA',
          perBoxWeight: '5.5 kg',
          ratePerNutKg: 1.36,
          boxRate: 7.49,
          cifValue: 2621.50,
        },
        {
          packages: 300,
          description: 'FRESH CURRY PAPAYA',
          perBoxWeight: '5.5 kg',
          ratePerNutKg: 0.87,
          boxRate: 4.80,
          cifValue: 1440.00,
        },
      ];

      const grandTotal = 21431.50;

      const sampleInvoice = await PerformaInvoice.create({
        invoiceNumber: 'GC-PI-2026-0001',
        invoiceDate: new Date('2026-09-14'),
        quotationId: sampleQuotation ? sampleQuotation._id : null,
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
        currency: 'USD',
        paymentTerms:
          '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customers warehouse.',
        shipmentReference: 'SH 226-04',
        shippedPer: 'Maersk , Salalah, Oman (CY)',
        voyageNo: 'OEL VARUN 639N',
        portOfLoading: 'COLOMBO PORT SRI LANKA',
        portOfDischarge: 'Salalah, Oman (CY)',
        containerSpecification: '1X40 REEFER',
        items: invItems,
        freightDescription: 'Free time at destination added cost for Freight',
        freightCharges: 250.00,
        otherCharges: 0,
        subtotal: 21431.50,
        discount: 0,
        tax: 0,
        grandTotal: grandTotal,
        amountInWords: numberToWords(grandTotal, 'USD'),
        damagePolicy:
          'Damage Policy: If any of the Goods are found to be damaged upon receipt, the Purchaser shall notify the Supplier in writing, providing evidence such as photographs and videos, within seven (3) days of receipt of the Good (terms and conditions apply).',
        paymentRoutingNote:
          "Payment should be made to our agent in the UAE, 'Greatway Ceylon Fruits and Vegetables Trading LLC'.",
        bankDetails: {
          accountName: 'Greatway Ceylon Fruits And Vegetables Trading L.L.C',
          bankName: 'EMIRATES NBD',
          bankBranch: 'RAS AL KHOR',
          accountNumber: '1025872806402',
          swift: 'EBILAEADXXX',
          iban: 'AE52 0260 0010 2587 2806 402',
          currency: 'USD',
        },
        signatory: {
          name: 'C C Ranesh Anthony',
          designation: 'Chief Executive Officer',
          company: 'Greatway Ceylon (Pvt) Ltd',
        },
        status: 'Sent',
        createdBy: admin._id,
      });

      if (sampleQuotation) {
        sampleQuotation.convertedToInvoiceId = sampleInvoice._id;
        await sampleQuotation.save();
      }
      console.log('Prototype Performa Invoice GC-PI-2026-0001 created.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
