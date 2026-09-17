const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const Quotation = require('../models/Quotation');
const PerformaInvoice = require('../models/PerformaInvoice');
const CompanySettings = require('../models/CompanySettings');
const {
  generateQuotationHTML,
  generateInvoiceHTML,
} = require('../utils/documentTemplates');

const getLogoBase64 = (settings) => {
  try {
    let logoPath = path.join(__dirname, '../uploads/logo.png');
    if (settings && settings.logoUrl) {
      const customPath = path.join(__dirname, '..', settings.logoUrl);
      if (fs.existsSync(customPath)) {
        logoPath = customPath;
      }
    }
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath).toString('base64');
    }
  } catch (err) {
    console.error('Error reading logo file for PDF:', err.message);
  }
  return null;
};

// @desc    Generate and stream Quotation PDF
// @route   GET /api/quotations/:id/pdf
// @access  Private
const generateQuotationPdf = async (req, res) => {
  let browser = null;
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});

    const logoBase64 = getLogoBase64(settings);
    const html = generateQuotationHTML(quotation, settings, logoBase64);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '12mm',
        bottom: '10mm',
        left: '12mm',
      },
    });

    await browser.close();
    browser = null;

    const filename = `${quotation.quotationNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF Generation Error (Quotation):', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF: ' + error.message });
  }
};

// @desc    Generate and stream Performa Invoice PDF
// @route   GET /api/invoices/:id/pdf
// @access  Private
const generateInvoicePdf = async (req, res) => {
  let browser = null;
  try {
    const invoice = await PerformaInvoice.findById(req.params.id).populate('customer');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Performa Invoice not found' });
    }

    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});

    const logoBase64 = getLogoBase64(settings);
    const html = generateInvoiceHTML(invoice, settings, logoBase64);

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '8mm',
        right: '10mm',
        bottom: '8mm',
        left: '10mm',
      },
    });

    await browser.close();
    browser = null;

    const filename = `${invoice.invoiceNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF Generation Error (Invoice):', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF: ' + error.message });
  }
};

module.exports = {
  generateQuotationPdf,
  generateInvoicePdf,
};
