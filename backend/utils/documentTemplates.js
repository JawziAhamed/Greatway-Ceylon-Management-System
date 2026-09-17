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

// Generate Quotation HTML matching quotation_page_1.png
const generateQuotationHTML = (quotation, settings, logoBase64) => {
  const buyer = quotation.buyerSnapshot || {};
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
      <td style="text-align: center; border: 1px solid #777; padding: 4px 6px; font-size: 11px;">${idx + 1}</td>
      <td style="text-align: center; border: 1px solid #777; padding: 4px 6px; font-size: 11px; font-weight: 500;">${item.itemCode || ''}</td>
      <td style="border: 1px solid #777; padding: 4px 6px; font-size: 11px;">${item.description || ''}</td>
      <td style="text-align: center; border: 1px solid #777; padding: 4px 6px; font-size: 11px;">${item.netWeightPerBox || ''}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 4px 6px; font-size: 11px;">$ ${formatAmount(item.ratePerNutKg)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 4px 6px; font-size: 11px;">$ ${formatAmount(item.boxRate)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 4px 6px; font-size: 11px; font-weight: 500;">${formatAmount(item.quantityCartons)}</td>
      <td style="text-align: right; border: 1px solid #777; padding: 4px 6px; font-size: 11px; font-weight: 500;">$ ${formatAmount(item.lineTotal)}</td>
    </tr>
  `
    )
    .join('');

  const freightRow =
    Number(quotation.freightCost || 0) > 0
      ? `
    <tr>
      <td colspan="7" style="border: 1px solid #777; padding: 4px 8px; font-size: 11px; font-style: italic;">
        ${quotation.freightDescription || 'Free time at destination added cost for Freight'}
      </td>
      <td style="text-align: right; border: 1px solid #777; padding: 4px 6px; font-size: 11px; font-weight: 500;">
        $ ${formatAmount(quotation.freightCost)}
      </td>
    </tr>
  `
      : '';

  const specificTermsList = (quotation.specificTerms && quotation.specificTerms.length > 0
    ? quotation.specificTerms
    : (settings.quotationSettings?.defaultSpecificTerms || [])
  )
    .map(
      (term, index) =>
        `<li style="margin-bottom: 3px; line-height: 1.35; font-size: 10px;">${term}</li>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation - ${quotation.quotationNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-size: 11px;
    }
    .container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
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
      background-color: #14663e;
      color: #ffffff;
      padding: 6px 4px;
      font-size: 10.5px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #14663e;
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
          ${quotation.validUntil ? `<tr><td class="meta-label">VALID UNTIL</td><td>: ${formatDate(quotation.validUntil)}</td></tr>` : ''}
          <tr>
            <td class="meta-label">CURRENCY</td>
            <td>: ${quotation.currency || 'USD'}</td>
          </tr>
          <tr>
            <td class="meta-label">INCOTERMS</td>
            <td style="font-weight: bold;">: ${formatIncotermDisplay(quotation.incoterms, buyer.country || 'Destination Port')}</td>
          </tr>
          ${quotation.status ? `<tr><td class="meta-label">STATUS</td><td style="font-weight: bold; color: #14663e;">: ${quotation.status.toUpperCase()}</td></tr>` : ''}
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
        ${freightRow}
        <tr class="total-row">
          <td colspan="6" style="text-align: right; border: 1px solid #777;">Total</td>
          <td style="text-align: right; border: 1px solid #777;">${formatAmount(quotation.totalCartons)}</td>
          <td style="text-align: right; border: 1px solid #777;">$ ${formatAmount(quotation.grandTotal)}</td>
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
        <div style="margin-bottom: 25px;">...................................</div>
        <strong>${quotation.signatory?.name || 'Authorized Signatory'}</strong><br>
        ${quotation.signatory?.designation || 'Chief Executive Officer'}<br>
        <strong>${companyName}</strong>
      </div>
      <div class="seal-box">
        OFFICIAL COMPANY SEAL<br>
        <strong>${companyName}</strong><br>
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
  </div>
</body>
</html>
`;
};

// Generate Performa Invoice HTML matching invoice_page_1.png
const generateInvoiceHTML = (invoice, settings, logoBase64) => {
  const buyer = invoice.buyerSnapshot || {};
  const companyName = settings.companyName || 'GREATWAY CEYLON (PVT) LTD';
  const companyAddress = settings.address || 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300';
  const email = settings.email || 'info@greatwayceylon.com';
  const taxNo = settings.taxNumber || '103406048 - 7000';
  const bank = invoice.bankDetails || {};

  const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : '/uploads/logo.png';

  const itemsRows = (invoice.items || [])
    .map(
      (item) => `
    <tr>
      <td style="text-align: center; border: 1px solid #111; padding: 4px 6px; font-size: 11px;">${item.packages || ''}</td>
      <td style="border: 1px solid #111; padding: 4px 6px; font-size: 11px; font-weight: 500;">${item.description || ''}</td>
      <td style="text-align: center; border: 1px solid #111; padding: 4px 6px; font-size: 11px;">${item.perBoxWeight || ''}</td>
      <td style="text-align: right; border: 1px solid #111; padding: 4px 6px; font-size: 11px;">${formatAmount(item.ratePerNutKg)}</td>
      <td style="text-align: right; border: 1px solid #111; padding: 4px 6px; font-size: 11px;">${formatAmount(item.boxRate)}</td>
      <td style="text-align: right; border: 1px solid #111; padding: 4px 6px; font-size: 11px; font-weight: 500;">${formatAmount(item.cifValue)}</td>
    </tr>
  `
    )
    .join('');

  const freightRow =
    Number(invoice.freightCharges || 0) > 0
      ? `
    <tr>
      <td colspan="5" style="border: 1px solid #111; padding: 4px 8px; font-size: 11px; text-align: center; font-style: italic;">
        ${invoice.freightDescription || 'Free time at destination added cost for Freight'}
      </td>
      <td style="text-align: right; border: 1px solid #111; padding: 4px 6px; font-size: 11px; font-weight: 500;">
        ${formatAmount(invoice.freightCharges)}
      </td>
    </tr>
  `
      : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Performa Invoice - ${invoice.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-size: 11px;
    }
    .document-frame {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      border: 1.5px solid #111;
      padding: 12px 14px;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
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
      background-color: #dbe8d8;
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
      margin-top: 0px;
      border-left: 1.5px solid #111;
      border-right: 1.5px solid #111;
      border-bottom: 1.5px solid #111;
    }
    .items-table th {
      background-color: #fff;
      color: #111;
      padding: 6px 4px;
      font-size: 10px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #111;
      line-height: 1.25;
    }
    .container-header {
      background-color: #f7f9f6;
      font-weight: bold;
      font-size: 10.5px;
      padding: 4px 8px;
      border: 1px solid #111;
    }
    .total-row td {
      border: 1px solid #111;
      padding: 6px 8px;
      font-weight: bold;
      font-size: 11px;
    }
    .amount-words {
      padding: 4px 8px;
      font-size: 10px;
      font-weight: bold;
      background-color: #fcfcfc;
      border: 1px solid #111;
      border-top: none;
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
      margin-top: 15px;
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
        <td style="width: 50%;">
          <div class="sub-field-title">CUSTOMERS DETAILS:</div>
          <div style="font-weight: bold; font-size: 11px;">${buyer.companyName || 'N/A'}</div>
          <div>${buyer.address ? buyer.address.replace(/\n/g, '<br>') : ''}</div>
          ${buyer.country ? `<div>${buyer.country}</div>` : ''}
          ${buyer.taxNumber ? `<div>TAX/VAT: ${buyer.taxNumber}</div>` : ''}
        </td>
        <td style="width: 50%;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border: none; padding: 2px 0; font-weight: bold; width: 130px;">PI NO:</td>
              <td style="border: none; padding: 2px 0; font-weight: bold;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 2px 0; font-weight: bold;">PI DATE:</td>
              <td style="border: none; padding: 2px 0;">${formatDate(invoice.invoiceDate)}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 2px 0; font-weight: bold; vertical-align: top;">PAYMENT TERMS:</td>
              <td style="border: none; padding: 2px 0; font-size: 10px; line-height: 1.3;">${invoice.paymentTerms || ''}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 2px 0; font-weight: bold;">SHIPMENT REFERENCE:</td>
              <td style="border: none; padding: 2px 0;">${invoice.shipmentReference || ''}</td>
            </tr>
            <tr>
              <td style="border: none; padding: 2px 0; font-weight: bold;">INCOTERMS:</td>
              <td style="border: none; padding: 2px 0; font-weight: bold;">${formatIncotermDisplay(invoice.incoterms, invoice.portOfDischarge, invoice.portOfLoading)}</td>
            </tr>
            ${invoice.status ? `<tr><td style="border: none; padding: 2px 0; font-weight: bold;">STATUS:</td><td style="border: none; padding: 2px 0; font-weight: bold; color: #237837;">${invoice.status.toUpperCase()}</td></tr>` : ''}
          </table>
        </td>
      </tr>
      <tr>
        <td><strong>SHIPPED PER:</strong> ${invoice.shippedPer || ''}</td>
        <td><strong>VOYAGE NO.:</strong> ${invoice.voyageNo || ''}</td>
      </tr>
      <tr>
        <td>
          <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">PORT OF LOADING</div>
          <div>${invoice.portOfLoading || 'COLOMBO PORT SRI LANKA'}</div>
        </td>
        <td>
          <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px;">PORT OF DISCHARGE</div>
          <div>${invoice.portOfDischarge || ''}</div>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 80px;">NO.OF<br>PACKAGES</th>
          <th>DESCRIPTION</th>
          <th style="width: 100px;">PER BOX/<br>WEIGHT (KG)</th>
          <th style="width: 100px;">RATE PER NUT<br>KG (${invoice.currency})</th>
          <th style="width: 85px;">BOX RATE<br>(${invoice.currency})</th>
          <th style="width: 100px;">${getIncotermCode(invoice.incoterms)} VALUE<br>(${invoice.currency})</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.containerSpecification ? `<tr><td colspan="6" class="container-header">${invoice.containerSpecification}</td></tr>` : ''}
        ${itemsRows}
        ${freightRow}
        <tr class="total-row">
          <td colspan="5" style="text-align: center; border: 1px solid #111;">TOTAL INVOICE VALUE (${invoice.currency || 'USD'})</td>
          <td style="text-align: right; border: 1px solid #111;">${formatAmount(invoice.grandTotal)}</td>
        </tr>
      </tbody>
    </table>

    ${invoice.amountInWords ? `<div class="amount-words">Amount in Words: ${invoice.amountInWords}</div>` : ''}

    <!-- Terms & Conditions -->
    <div class="terms-box">
      <div class="terms-title">TERMS & CONDITIONS</div>
      <div>${invoice.damagePolicy || ''}</div>
    </div>

    <!-- Bank Details -->
    <div class="bank-box">
      <div>${invoice.paymentRoutingNote || 'Payment should be made to our bank account as follows:'}</div>
      <div class="bank-grid">
        <table>
          <tr>
            <td class="bank-label">Account Name</td>
            <td>: ${bank.accountName || companyName}</td>
          </tr>
          <tr>
            <td class="bank-label">Bank Name</td>
            <td>: ${bank.bankName || ''}</td>
          </tr>
          <tr>
            <td class="bank-label">Bank Branch</td>
            <td>: ${bank.bankBranch || ''}</td>
          </tr>
          <tr>
            <td class="bank-label">Account Number</td>
            <td>: ${bank.accountNumber || ''}</td>
          </tr>
          <tr>
            <td class="bank-label">SWIFT</td>
            <td>: ${bank.swift || ''}</td>
          </tr>
          ${bank.iban ? `<tr><td class="bank-label">IBAN</td><td>: ${bank.iban}</td></tr>` : ''}
          <tr>
            <td class="bank-label">Currency</td>
            <td>: ${bank.currency || invoice.currency || 'USD'}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Signatory -->
    <div class="sign-section">
      <div class="sign-box">
        <div class="sign-line"></div>
        <div style="font-weight: 500;">Authorized Signatory</div>
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
