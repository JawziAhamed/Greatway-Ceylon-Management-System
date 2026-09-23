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

const getLaunchOptions = () => {
  const options = {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
    ],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    return options;
  }

  const commonPaths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    // Linux
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      options.executablePath = p;
      break;
    }
  }

  if (!options.executablePath) {
    const possibleCacheDirs = [
      path.join(__dirname, '../.cache/puppeteer'),
      path.join(process.cwd(), '.cache', 'puppeteer'),
      path.join(process.cwd(), 'backend', '.cache', 'puppeteer'),
      '/opt/render/.cache/puppeteer',
      path.join(process.env.HOME || '', '.cache', 'puppeteer'),
    ];
    for (const cDir of possibleCacheDirs) {
      if (fs.existsSync(cDir)) {
        try {
          const findChrome = (dir, depth = 0) => {
            if (depth > 6) return null;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                const sub = findChrome(fullPath, depth + 1);
                if (sub) return sub;
              } else if (
                entry.name === 'chrome' ||
                entry.name === 'chrome.exe' ||
                entry.name === 'chromium'
              ) {
                return fullPath;
              }
            }
            return null;
          };
          const found = findChrome(cDir);
          if (found) {
            options.executablePath = found;
            break;
          }
        } catch (e) {}
      }
    }
  }

  return options;
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

    try {
      browser = await puppeteer.launch(getLaunchOptions());
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '5mm',
          right: '8mm',
          bottom: '5mm',
          left: '8mm',
        },
      });

      await browser.close();
      browser = null;

      const safeNumber = (quotation.quotationNumber || 'quotation').replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `${safeNumber}.pdf`;
      const isDownload = req.query.download === '1' || req.query.download === 'true';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (launchErr) {
      if (browser) await browser.close();
      console.warn('Puppeteer browser launch failed, checking fallback:', launchErr.message);
      // If client requests HTML fallback or browser navigation
      if (req.query.fallback === 'html' || req.headers.accept?.includes('text/html')) {
        const autoPrintHtml = html.replace(
          '</body>',
          `<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.print(); }, 400); });</script></body>`
        );
        res.setHeader('Content-Type', 'text/html');
        return res.send(autoPrintHtml);
      }
      throw launchErr;
    }
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF Generation Error (Quotation):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF: ' + error.message,
      canPrintHtml: true,
    });
  }
};

// @desc    Generate standalone printable Quotation HTML
// @route   GET /api/quotations/:id/html
// @access  Private
const generateQuotationHtml = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('customer');
    if (!quotation) return res.status(404).send('Quotation not found');

    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});

    const logoBase64 = getLogoBase64(settings);
    let html = generateQuotationHTML(quotation, settings, logoBase64);
    const autoPrint = req.query.print !== '0';
    if (autoPrint) {
      html = html.replace(
        '</body>',
        `<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.print(); }, 400); });</script></body>`
      );
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('Error rendering Quotation: ' + err.message);
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

    try {
      browser = await puppeteer.launch(getLaunchOptions());
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '4mm',
          right: '6mm',
          bottom: '4mm',
          left: '6mm',
        },
      });

      await browser.close();
      browser = null;

      const safeNumber = (invoice.invoiceNumber || 'invoice').replace(/[/\\?%*:|"<>]/g, '-');
      const filename = `${safeNumber}.pdf`;
      const isDownload = req.query.download === '1' || req.query.download === 'true';
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.end(pdfBuffer);
    } catch (launchErr) {
      if (browser) await browser.close();
      console.warn('Puppeteer browser launch failed, checking fallback:', launchErr.message);
      // If client requests HTML fallback or browser navigation
      if (req.query.fallback === 'html' || req.headers.accept?.includes('text/html')) {
        const autoPrintHtml = html.replace(
          '</body>',
          `<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.print(); }, 400); });</script></body>`
        );
        res.setHeader('Content-Type', 'text/html');
        return res.send(autoPrintHtml);
      }
      throw launchErr;
    }
  } catch (error) {
    if (browser) await browser.close();
    console.error('PDF Generation Error (Invoice):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF: ' + error.message,
      canPrintHtml: true,
    });
  }
};

// @desc    Generate standalone printable Performa Invoice HTML
// @route   GET /api/invoices/:id/html
// @access  Private
const generateInvoiceHtml = async (req, res) => {
  try {
    const invoice = await PerformaInvoice.findById(req.params.id).populate('customer');
    if (!invoice) return res.status(404).send('Performa Invoice not found');

    let settings = await CompanySettings.findOne();
    if (!settings) settings = await CompanySettings.create({});

    const logoBase64 = getLogoBase64(settings);
    let html = generateInvoiceHTML(invoice, settings, logoBase64);
    const autoPrint = req.query.print !== '0';
    if (autoPrint) {
      html = html.replace(
        '</body>',
        `<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { window.print(); }, 400); });</script></body>`
      );
    }
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send('Error rendering Performa Invoice: ' + err.message);
  }
};

module.exports = {
  generateQuotationPdf,
  generateQuotationHtml,
  generateInvoicePdf,
  generateInvoiceHtml,
};

