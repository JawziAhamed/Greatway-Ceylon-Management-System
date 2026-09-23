const fs = require('fs');
const path = require('path');
const { formatIncotermDisplay, getIncotermCode } = require('./incoterms');

// Helper to format currency numbers
const formatAmount = (num) => {
  return Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getWatermarkBase64 = () => {
  try {
    const wmPath = path.join(__dirname, '../uploads/watermark_logo.png');
    if (fs.existsSync(wmPath)) {
      return fs.readFileSync(wmPath).toString('base64');
    }
  } catch (e) {}
  return '';
};

const DEFAULT_SPECIFIC_TERMS = [
  'All prices are based on CIF terms.',
  'Prices are subject to change due to changes in Sri Lankan market conditions.',
  "Delivery Terms: The quoted CIF rates are applicable only up to Salalah Port, Oman. Transportation, customs clearance, and delivery from Salalah Port to customer's final location shall be arranged and borne by customer.",
  'Approximate order quantity: Number of cartons - 2,950',
  'Payment terms: 50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer\'s warehouse.',
  'Damage Liability: Damages should be reported within 10 days of the arrival of goods at the destination port (Refer to attachment 01 for general terms and conditions). Greatway Ceylon will not accept liability if goods are not cleared within 48 hours or temperature gauge reports are missing.',
  'The standard terms and conditions along with the product specification sheet, herewith attached (Attachment 01).',
];

// Generate Quotation HTML matching quotation_page_1.png
const generateQuotationHTML = (quotation, settings = {}, logoBase64, signatureBase64) => {
  const buyer =
    quotation.buyerSnapshot && (quotation.buyerSnapshot.companyName || quotation.buyerSnapshot.address)
      ? quotation.buyerSnapshot
      : quotation.customer && typeof quotation.customer === 'object'
      ? quotation.customer
      : quotation.buyer || {};
  const companyName = settings.companyName || 'GREATWAY CEYLON (PVT) LTD';
  const companyAddress = settings.address || 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300';
  const email = settings.email || 'info@greatwayceylon.com';
  const phone = settings.phone || '+94 77 123 4567';
  const website = settings.website || 'https://greatwayceylon.com/';
  const regNo = settings.registrationNumber || 'PV 00263042';

  const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : '/uploads/logo.png';

  const itemsRows = (quotation.items || [])
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">${idx + 1}</td>
      <td style="text-align: center; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">${item.itemCode || ''}</td>
      <td style="border: 1px solid #777; padding: 6px 6px; font-size: 11px;">${item.description || ''}</td>
      <td style="text-align: center; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">${item.netWeightPerBox || ''}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">$ ${formatAmount(item.ratePerNutKg)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">$ ${formatAmount(item.boxRate)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">${formatAmount(item.quantityCartons)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">$ ${formatAmount(item.lineTotal)}</td>
    </tr>
  `
    )
    .join('');

  const freightRow =
    Number(quotation.freightCost || 0) > 0
      ? `
    <tr>
      <td colspan="7" style="border: 1px solid #777; padding: 6px 8px; font-size: 11px; font-style: italic;">
        ${quotation.freightDescription || 'Free time at destination added cost for Freight'}
      </td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">
        $ ${formatAmount(quotation.freightCost)}
      </td>
    </tr>
  `
      : '';

  const termsToUse =
    quotation.specificTerms && quotation.specificTerms.length > 0
      ? quotation.specificTerms
      : settings.quotationSettings?.defaultSpecificTerms && settings.quotationSettings.defaultSpecificTerms.length > 0
      ? settings.quotationSettings.defaultSpecificTerms
      : DEFAULT_SPECIFIC_TERMS;

  const specificTermsList = termsToUse
    .filter((term) => term && String(term).trim())
    .map(
      (term, index) =>
        `<li style="margin-bottom: 5px; line-height: 1.35; font-size: 10px;">${term}</li>`
    )
    .join('');

  const watermarkBase64 = getWatermarkBase64();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${quotation.quotationNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    body {
      margin: 0;
      padding: 5mm 8mm;
      background: #fff;
      font-size: 10.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      width: 100%;
      max-width: 800px;
      min-height: 285mm;
      margin: 0 auto;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .company-info {
      width: 55%;
    }
    .company-title {
      color: #14663e;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .company-details {
      font-size: 10.5px;
      line-height: 1.35;
      color: #333;
    }
    .logo-container {
      width: 40%;
      text-align: right;
    }
    .logo-img {
      max-width: 240px;
      max-height: 65px;
      object-fit: contain;
    }
    .document-title {
      text-align: center;
      color: #14663e;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 10px 0 15px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .buyer-block {
      width: 55%;
    }
    .buyer-title {
      color: #14663e;
      font-weight: bold;
      font-size: 11.5px;
      margin-bottom: 4px;
    }
    .buyer-details {
      font-size: 11px;
      line-height: 1.35;
    }
    .doc-meta-table {
      border-collapse: collapse;
      font-size: 11px;
    }
    .doc-meta-table td {
      padding: 3px 6px;
    }
    .meta-label {
      font-weight: bold;
      color: #333;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .items-table th {
      background-color: #cf9e62;
      color: #000000;
      padding: 6px 4px;
      font-size: 10.5px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #b88a52;
    }
    .total-row td {
      border: 1px solid #777;
      padding: 5px 6px;
      font-weight: bold;
      font-size: 11px;
    }
    .shipping-note {
      font-size: 10.5px;
      font-weight: 500;
      margin: 8px 0;
      line-height: 1.4;
    }
    .terms-section {
      margin-top: 8px;
    }
    .terms-title {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .terms-list {
      margin: 0 0 10px 18px;
      padding: 0;
    }
    .sign-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin: 15px 0 10px 0;
    }
    .company-signatory {
      font-size: 10.5px;
    }
    .seal-box {
      border: 1px dashed #14663e;
      padding: 6px 12px;
      font-size: 10px;
      color: #14663e;
      text-align: center;
      border-radius: 4px;
    }
    .ack-section {
      border-top: 1px solid #222;
      padding-top: 8px;
      margin-top: 10px;
    }
    .ack-title {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .ack-text {
      font-size: 10px;
      line-height: 1.35;
      margin-bottom: 8px;
    }
    .ack-table {
      width: 100%;
      border-collapse: collapse;
    }
    .ack-table td {
      border: 1px solid #444;
      padding: 4px 6px;
      font-size: 10px;
    }
    .ack-label {
      width: 140px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header-row">
      <div class="company-info">
        <div class="company-title">${companyName}</div>
        <div class="company-details">
          ${companyAddress}<br>
          Email: ${email} | Web: ${website}<br>
          Reg No: ${regNo} | TAX: ${settings.taxNumber || ''}
        </div>
      </div>
      <div class="logo-container">
        <img class="logo-img" src="${logoSrc}" alt="Greatway Ceylon Logo" />
      </div>
    </div>

    <!-- Title -->
    <div class="document-title">QUOTATION</div>

    <!-- Meta Information -->
    <div class="meta-row">
      <div class="buyer-block">
        <div class="buyer-title">Buyer Details</div>
        <div class="buyer-details">
          <strong>${buyer.companyName || 'N/A'}</strong><br>
          ${buyer.address ? buyer.address + '<br>' : ''}
          ${buyer.country ? buyer.country + '<br>' : ''}
          ${buyer.contactPerson ? 'Attn: ' + buyer.contactPerson + '<br>' : ''}
          ${buyer.email ? 'Email: ' + buyer.email + '<br>' : ''}
          ${buyer.taxNumber ? 'Tax/VAT: ' + buyer.taxNumber : ''}
        </div>
      </div>
      <div>
        <table class="doc-meta-table">
          <tr>
            <td class="meta-label">DATE</td>
            <td>: ${formatDate(quotation.quotationDate)}</td>
          </tr>
          <tr>
            <td class="meta-label">QUOTATION NO</td>
            <td style="font-weight: bold;">: ${quotation.quotationNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">SALE TYPE</td>
            <td style="font-weight: bold; color: #14663e;">: ${quotation.saleType || 'Own Sale'}</td>
          </tr>
          ${quotation.validUntil ? `<tr><td class="meta-label">VALID UNTIL</td><td>: ${formatDate(quotation.validUntil)}</td></tr>` : ''}
          <tr>
            <td class="meta-label">CURRENCY</td>
            <td>: ${quotation.currency || 'USD'}</td>
          </tr>
          <tr>
            <td class="meta-label">INCOTERMS</td>
            <td style="font-weight: bold;">: ${getIncotermCode(quotation.incoterms) || quotation.incoterms || 'CIF'}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th style="width: 70px;">ITEM NAME</th>
          <th>DESCRIPTION</th>
          <th style="width: 90px;">Net Weight Per Box</th>
          <th style="width: 85px;">Rate per Nut/ Kg (${quotation.currency})</th>
          <th style="width: 80px;">Per Box Rate (${quotation.currency})</th>
          <th style="width: 75px;">Quantity Cartons</th>
          <th style="width: 90px;">Total Amount (${quotation.currency})</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        ${
          quotation.additionalCharges && quotation.additionalCharges.length > 0
            ? quotation.additionalCharges
                .filter((c) => Number(c.amount || 0) > 0 || c.description)
                .map(
                  (c) => `
          <tr>
            <td colspan="7" style="border: 1px solid #777; padding: 4px 8px; font-size: 11px; text-align: left; font-style: italic;">
              ${c.description || 'Additional Charge / Freight'}
            </td>
            <td style="text-align: right; border: 1px solid #777; padding: 4px 6px; font-size: 11px; font-weight: 500;">
              $ ${formatAmount(c.amount)}
            </td>
          </tr>
        `
                )
                .join('')
            : freightRow
        }
        <tr class="total-row">
          <td colspan="6" style="text-align: left; font-weight: bold; padding: 5px 8px; border: 1px solid #777;">Total</td>
          <td style="text-align: right; border: 1px solid #777; font-weight: bold; padding: 5px 6px;">${formatAmount(quotation.totalCartons)}</td>
          <td style="text-align: right; border: 1px solid #777; font-weight: bold; padding: 5px 6px;">$ ${formatAmount(quotation.grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Shipping / Vessel Note -->
    <div class="shipping-note">
      Vessel :- ${quotation.vesselDetails || 'Line : MAERSK Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS'}<br>
      Departure:- ${quotation.departureDateText || 'To be scheduled upon PO confirmation'}
    </div>

    <!-- Specific Terms & Conditions -->
    <div class="terms-section">
      <div class="terms-title">Specific Terms and Conditions</div>
      <ol class="terms-list">
        ${specificTermsList}
      </ol>
    </div>

    <!-- Signatory -->
    <div class="sign-section">
      <div class="company-signatory">
        ${signatureBase64 && settings.showSignature !== false ? `
          <div style="margin-bottom: -5px;">
            <img src="data:image/png;base64,${signatureBase64}" style="height: 48px; max-width: 180px; object-fit: contain;" alt="Signature" />
          </div>
        ` : `<div style="margin-bottom: 25px;">...................................</div>`}
        <strong>${quotation.signatory?.name || 'Authorized Signatory'}</strong><br>
        ${quotation.signatory?.designation || 'Chief Executive Officer'}<br>
        <strong>${quotation.signatory?.company || companyName}</strong>
      </div>
      <div class="seal-box">
        OFFICIAL COMPANY SEAL<br>
        <strong>${quotation.signatory?.company || companyName}</strong><br>
        ${regNo}
      </div>
    </div>

    <!-- Customer Acknowledgement -->
    <div class="ack-section">
      <div class="ack-title">Customer Acknowledgement</div>
      <div class="ack-text">
        We, <strong>${buyer.companyName || 'the Customer'}</strong>, hereby acknowledge receipt and acceptance of the above quotation and attached terms and condition along with the product specification sheet (Attachment 01) and confirm our agreement to the terms and conditions stated herein.
      </div>
      <table class="ack-table">
        <tr>
          <td class="ack-label">Signature</td>
          <td style="height: 22px;"></td>
        </tr>
        <tr>
          <td class="ack-label">Signatory Name</td>
          <td style="height: 18px;"></td>
        </tr>
        <tr>
          <td class="ack-label">Designation</td>
          <td style="height: 18px;"></td>
        </tr>
        <tr>
          <td class="ack-label">Date</td>
          <td style="height: 18px;"></td>
        </tr>
        <tr>
          <td class="ack-label">Company Seal</td>
          <td style="height: 30px;"></td>
        </tr>
      </table>
    </div>

    <!-- Transparent Watermark Logo at Right Bottom -->
    ${watermarkBase64 ? `
    <div style="position: absolute; right: 15px; bottom: 15px; pointer-events: none; opacity: 0.20;">
      <img src="data:image/png;base64,${watermarkBase64}" style="width: 65px; height: 65px; object-fit: contain;" alt="Watermark" />
    </div>
    ` : ''}
  </div>
</body>
</html>
`;
};

// Generate Performa Invoice HTML matching invoice_page_1.png
const generateInvoiceHTML = (invoice, settings = {}, logoBase64, signatureBase64) => {
  const buyer =
    invoice.buyerSnapshot && (invoice.buyerSnapshot.companyName || invoice.buyerSnapshot.address)
      ? invoice.buyerSnapshot
      : invoice.customer && typeof invoice.customer === 'object'
      ? invoice.customer
      : invoice.buyer || {};
  const companyName = settings.companyName || 'GREATWAY CEYLON (PVT) LTD';
  const companyAddress = settings.address || 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300';
  const email = settings.email || 'info@greatwayceylon.com';
  const taxNo = settings.taxNumber || '103406048 - 7000';
  const bank = invoice.bankDetails || {};

  const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : '/uploads/logo.png';

  const getItemCode = (item) => {
    if (item.itemCode) return item.itemCode;
    if (item.code) return item.code;
    const desc = (item.description || '').toLowerCase();
    if (desc.includes('king coconut')) return 'KC';
    if (desc.includes('red lady papaya') || desc.includes('red papaya')) return 'RP';
    if (desc.includes('curry papaya') || desc.includes('green papaya')) return 'CP/GP';
    if (desc.includes('tapioca') || desc.includes('kappa')) return 'Kappa';
    return '';
  };

  const totalCartons =
    invoice.totalCartons ||
    (invoice.items || []).reduce(
      (sum, it) =>
        sum + (Number(it.quantityCartons !== undefined ? it.quantityCartons : it.packages) || 0),
      0
    );

  const itemsRows = (invoice.items || [])
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">${idx + 1}</td>
      <td style="text-align: center; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">${getItemCode(item)}</td>
      <td style="border: 1px solid #777; padding: 6px 6px; font-size: 11px;">${item.description || ''}</td>
      <td style="text-align: center; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">${item.netWeightPerBox || item.perBoxWeight || ''}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">$ ${formatAmount(item.ratePerNutKg)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px;">$ ${formatAmount(item.boxRate)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">${formatAmount(item.quantityCartons !== undefined ? item.quantityCartons : item.packages)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">$ ${formatAmount(item.lineTotal !== undefined ? item.lineTotal : item.cifValue)}</td>
    </tr>
  `
    )
    .join('');

  const freightRow =
    (Number(invoice.freightCharges || 0) > 0 || Number(invoice.freightCost || 0) > 0)
      ? `
    <tr>
      <td colspan="7" style="border: 1px solid #777; padding: 6px 8px; font-size: 11px; text-align: left; font-style: italic;">
        ${invoice.freightDescription || 'Free time at destination added cost for Freight'}
      </td>
      <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">
        $ ${formatAmount(invoice.freightCharges || invoice.freightCost)}
      </td>
    </tr>
  `
      : '';

  const additionalChargesRows =
    invoice.additionalCharges && invoice.additionalCharges.length > 0
      ? invoice.additionalCharges
          .filter((c) => Number(c.amount || 0) > 0 || c.description)
          .map(
            (c) => `
      <tr>
        <td colspan="7" style="border: 1px solid #777; padding: 6px 8px; font-size: 11px; text-align: left; font-style: italic;">
          ${c.description || 'Additional Charge / Freight'}
        </td>
        <td style="text-align: right; border: 1px solid #777; padding: 6px 6px; font-size: 11px; font-weight: 500;">
          $ ${formatAmount(c.amount)}
        </td>
      </tr>
    `
          )
          .join('')
      : freightRow;

  const termsList =
    invoice.termsAndConditions && invoice.termsAndConditions.length > 0
      ? invoice.termsAndConditions
      : invoice.damagePolicy
      ? invoice.damagePolicy.split('\n').filter((l) => l.trim())
      : [
          'Damages should be reported within 10 days of the arrival of goods at the destination port (Refer to attachment 01 for general terms and conditions)',
          '*Greatway Ceylon will not accept liability for any damages if,- The goods are not cleared within 48 hours of arrival at the designated port of destination.- The reports of three temperature gauges are not submitted along with the temperature gauges,- The damage report is provided beyond 10 days from the arrival of the shipment.',
          '* Greatway Ceylon will not be responsible for any damage sustained during the voyage, customer handling/ unloading process, or due to the lack of required temperature being maintained and improper cold chain management. No damages shall be accepted if the temperature gauges are not returned to our representatives when the shipment arrives.',
          '*Acceptance of damages shall be at the sole discretion of Greatway Ceylon (Pvt) Ltd.',
          '*Any amount deducted for damages cannot be arbitrarily decided by Nuragro FZE. If any deduction is to be made, it must be decided with the explicit consent of Greatway Ceylon (Pvt) Ltd. Deductions made without such consent shall be considered void and deemed payable to Greatway Ceylon (Pvt) Ltd.',
        ];

  const termsListHTML = termsList
    .map((point) => `<div style="margin-bottom: 5px; line-height: 1.35;">${point}</div>`)
    .join('');

  const watermarkBase64 = getWatermarkBase64();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${invoice.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    body {
      margin: 0;
      padding: 4mm 6mm;
      background: #fff;
      font-size: 10.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .document-frame {
      width: 100%;
      max-width: 800px;
      min-height: 285mm;
      margin: 0 auto;
      border: 1.5px solid #111;
      padding: 10px 12px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .logo-container {
      width: 45%;
    }
    .logo-img {
      max-width: 250px;
      max-height: 70px;
      object-fit: contain;
    }
    .company-info {
      width: 52%;
      text-align: right;
    }
    .company-title {
      color: #237837;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .company-details {
      font-size: 10.5px;
      line-height: 1.35;
      color: #222;
    }
    .banner-title {
      background-color: #cf9e62;
      border: 1.5px solid #111;
      text-align: center;
      padding: 6px;
      font-size: 13px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 0px;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      border-left: 1.5px solid #111;
      border-right: 1.5px solid #111;
      border-bottom: 1.5px solid #111;
    }
    .info-grid td {
      border: 1px solid #111;
      vertical-align: top;
      padding: 6px 8px;
      font-size: 10.5px;
    }
    .sub-field-title {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 0px;
    }
    .items-table th {
      background-color: #cf9e62;
      color: #000000;
      padding: 6px 4px;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #b88a52;
      line-height: 1.25;
    }
    .container-header {
      background-color: #f7f9f6;
      font-weight: bold;
      font-size: 10.5px;
      padding: 4px 8px;
      border: 1px solid #777;
    }
    .total-row td {
      border: 1px solid #777;
      padding: 5px 6px;
      font-weight: bold;
      font-size: 11px;
    }
    .amount-words {
      padding: 5px 8px;
      font-size: 10.5px;
      font-weight: bold;
      background-color: #fcfcfc;
      border: 1px solid #777;
      border-top: none;
      margin-bottom: 8px;
    }
    .terms-box {
      margin-top: 10px;
      font-size: 10.5px;
      line-height: 1.35;
    }
    .terms-title {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 4px;
    }
    .bank-box {
      margin-top: 8px;
      font-size: 10.5px;
      line-height: 1.4;
    }
    .bank-grid {
      margin-top: 4px;
    }
    .bank-grid table {
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .bank-grid td {
      padding: 1.5px 4px;
    }
    .bank-label {
      width: 120px;
      font-weight: 500;
    }
    .sign-section {
      display: flex;
      justify-content: flex-end;
      align-items: flex-end;
      margin-top: 0;
    }
    .sign-box {
      text-align: center;
      width: 200px;
    }
    .sign-line {
      border-bottom: 1px solid #111;
      margin-bottom: 4px;
      height: 40px;
    }
  </style>
</head>
<body>
  <div class="document-frame">
    <!-- Header -->
    <div class="header-section">
      <div class="logo-container">
        <img class="logo-img" src="${logoSrc}" alt="Greatway Ceylon" />
      </div>
      <div class="company-info">
        <div class="company-title">${companyName}</div>
        <div class="company-details">
          ${companyAddress}<br>
          Email: ${email}<br>
          TAX No: ${taxNo}
        </div>
      </div>
    </div>

    <!-- Banner -->
    <div class="banner-title">PROFORMA INVOICE</div>

    <!-- Meta Grid -->
    <table class="info-grid">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <div class="sub-field-title">CUSTOMERS DETAILS:</div>
          <div style="font-weight: bold; font-size: 11px;">${buyer.companyName || 'N/A'}</div>
          <div>${buyer.address ? buyer.address.replace(/\n/g, '<br>') : ''}</div>
          ${buyer.country ? `<div>${buyer.country}</div>` : ''}

          <div style="border-top: 1px solid #ddd; padding-top: 6px; margin-top: 6px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 130px; white-space: nowrap;">PI NO:</td>
                <td style="border: none; padding: 2px 0; font-weight: bold;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 130px; white-space: nowrap;">PI DATE:</td>
                <td style="border: none; padding: 2px 0;">${formatDate(invoice.invoiceDate)}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 130px; white-space: nowrap; vertical-align: top;">PAYMENT TERMS:</td>
                <td style="border: none; padding: 2px 0; font-size: 10px; line-height: 1.3;">${invoice.paymentTerms || ''}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 130px; white-space: nowrap;">SHIPMENT REFERENCE:</td>
                <td style="border: none; padding: 2px 0;">${invoice.shipmentReference || ''}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 130px; white-space: nowrap;">INCOTERMS:</td>
                <td style="border: none; padding: 2px 0; font-weight: bold;">${getIncotermCode(invoice.incoterms) || invoice.incoterms || 'CIF'}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 2px 6px 2px 0; font-weight: bold; width: 130px; white-space: nowrap;">STATUS:</td>
                <td style="border: none; padding: 2px 0; font-weight: bold; color: #16a34a; text-transform: uppercase;">${invoice.status || 'DRAFT'}</td>
              </tr>
            </table>
          </div>
        </td>
        <td style="width: 50%; vertical-align: top;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">Vessel:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.vessel || invoice.shippedPer || 'MSC PRELUDE V'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">Voyage Number:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.voyageNo || 'IW626R'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">Container No:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.containerNo || invoice.containerSpecification || 'TBC'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">Seal Number:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.sealNumber || 'TBC'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">POL:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.portOfLoading || 'DURBAN'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">POD:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.portOfDischarge || 'KHOR AL FAKKAN'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">Final Destination:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.finalDestination !== undefined && invoice.finalDestination !== '' ? invoice.finalDestination : (invoice.portOfDischarge || 'KHOR AL FAKKAN')}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">ETD:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.etd || '29/07/2026'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">ETA:</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.eta || '12/08/2026'}</td></tr>
            <tr><td style="border: none; padding: 2px 8px 2px 0; font-weight: bold; text-align: right; white-space: nowrap;">Stack :</td><td style="border: none; padding: 2px 0; width: 55%; font-weight: normal;">${invoice.stack || '25/07 to 26/07 06:00 P'}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th style="width: 60px;">ITEM NAME</th>
          <th>DESCRIPTION</th>
          <th style="width: 85px;">Net Weight Per Box</th>
          <th style="width: 85px;">Rate per Nut/<br>Kg in ${invoice.currency || 'USD'}</th>
          <th style="width: 75px;">Per Box Rate<br>(${invoice.currency || 'USD'})</th>
          <th style="width: 75px;">Quantity Cartons</th>
          <th style="width: 90px;">Total Amount<br>(${invoice.currency || 'USD'})</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        ${additionalChargesRows}
        <tr class="total-row">
          <td colspan="6" style="border: 1px solid #777; text-align: left; font-weight: bold; padding: 5px 8px;">Total</td>
          <td style="border: 1px solid #777; text-align: right; font-weight: bold; padding: 5px 6px;">${formatAmount(totalCartons)}</td>
          <td style="border: 1px solid #777; text-align: right; font-weight: bold; padding: 5px 6px;">$ ${formatAmount(invoice.grandTotal || invoice.totalAmount || 0)}</td>
        </tr>
      </tbody>
    </table>

    ${invoice.amountInWords ? `<div class="amount-words">Amount in Words: ${invoice.amountInWords}</div>` : ''}

    <!-- Terms & Conditions -->
    <div class="terms-box">
      <div class="terms-title">TERMS & CONDITIONS</div>
      <div>${termsListHTML}</div>
    </div>

    <!-- Bank Details & Signatory Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px;">
      <!-- Bank Details -->
      <div class="bank-box" style="margin-top: 0; max-width: 60%;">
        <div style="margin-bottom: 3px;">${invoice.paymentRoutingNote || 'Direct SWIFT wire transfer to Sampath Bank PLC, Welimada Branch, Sri Lanka.'}</div>
        <div class="bank-grid">
          <table>
            <tr>
              <td class="bank-label">Account Name</td>
              <td style="font-weight: bold;">: ${bank.accountName || companyName}</td>
            </tr>
            <tr>
              <td class="bank-label">Bank Name</td>
              <td style="font-weight: bold;">: ${bank.bankName || ''}</td>
            </tr>
            <tr>
              <td class="bank-label">Bank Branch</td>
              <td style="font-weight: bold;">: ${bank.bankBranch || ''}</td>
            </tr>
            <tr>
              <td class="bank-label">Account Number</td>
              <td style="font-weight: bold;">: ${bank.accountNumber || ''}</td>
            </tr>
            <tr>
              <td class="bank-label">SWIFT</td>
              <td style="font-weight: bold;">: ${bank.swift || ''}</td>
            </tr>
            ${bank.iban ? `<tr><td class="bank-label">IBAN</td><td style="font-weight: bold;">: ${bank.iban}</td></tr>` : ''}
            <tr>
              <td class="bank-label">Currency</td>
              <td style="font-weight: bold;">: ${bank.currency || invoice.currency || 'USD'}</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Signatory -->
      <div class="sign-section" style="margin-top: 0; align-self: flex-end; position: relative;">
        <div class="sign-box" style="position: relative; width: 220px;">
          ${watermarkBase64 ? `
          <div style="position: absolute; right: 0; top: 0; pointer-events: none; opacity: 0.35; z-index: 1;">
            <img src="data:image/png;base64,${watermarkBase64}" style="width: 70px; height: 70px; object-fit: contain;" alt="Watermark Seal" />
          </div>
          ` : ''}
          ${signatureBase64 && settings.showSignature !== false ? `
            <div style="text-align: center; margin-bottom: -6px; position: relative; z-index: 2;">
              <img src="data:image/png;base64,${signatureBase64}" style="height: 52px; max-width: 210px; object-fit: contain;" alt="Authorized Signature" />
            </div>
          ` : ''}
          <div class="sign-line" style="${signatureBase64 && settings.showSignature !== false ? 'height: 0px;' : 'height: 35px;'}"></div>
          <div style="font-weight: 600; font-size: 10.5px;">Authorized Signatory</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

module.exports = {
  generateQuotationHTML,
  generateInvoiceHTML,
  formatAmount,
  formatDate,
};
