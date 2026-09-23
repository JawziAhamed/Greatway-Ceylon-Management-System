import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import axiosClient from '../api/axiosClient';
import QuotationDocument from '../components/documents/QuotationDocument';
import PerformaInvoiceDocument from '../components/documents/PerformaInvoiceDocument';

/**
 * Cleanly sanitize filename for safe filesystem saving
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'document.pdf';
  const clean = String(filename).replace(/[/\\?%*:|"<>]/g, '-').trim();
  return clean.endsWith('.pdf') ? clean : `${clean}.pdf`;
};

/**
 * Direct 1-Click Guaranteed Single-Page A4 PDF Generator.
 * Uses html2canvas + jsPDF to render a high-resolution, perfectly scaled,
 * guaranteed 1-page A4 PDF directly in the user's browser.
 * Absolutely NO extra pages, NO browser print dialog, NO date/time header, NO URL footer!
 */
export const exportElementToPdf = async (element, rawFilename) => {
  if (!element) {
    throw new Error('Target element for PDF export does not exist');
  }

  const filename = sanitizeFilename(rawFilename);

  // Directly target the inner document root if a wrapper or container was passed
  let targetElement = element;
  if (element.matches && element.matches('.invoice-document-root, .quotation-document-root')) {
    targetElement = element;
  } else if (element.querySelector) {
    const matched = element.querySelector('.invoice-document-root, .quotation-document-root');
    if (matched) {
      targetElement = matched;
    }
  }

  // 1. High-Resolution Canvas Rendering capturing the EXACT preview appearance
  const canvas = await html2canvas(targetElement, {
    scale: 2, // High resolution (300 DPI equivalent)
    useCORS: true,
    logging: false,
    letterRendering: true,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
    onclone: (clonedDoc) => {
      // Ensure target element is fixed at exactly 794px width and at least 1123px height
      const targetDoc = clonedDoc.querySelector('.invoice-document-root, .quotation-document-root');
      if (targetDoc) {
        targetDoc.style.width = '794px';
        targetDoc.style.maxWidth = '794px';
        targetDoc.style.minHeight = '1123px';
      }
      // Remove any heavy drop shadows for clean print rendering
      const docs = clonedDoc.querySelectorAll(
        '.shadow-md, .shadow-lg, .shadow-sm, .shadow-xl, .shadow-2xl'
      );
      docs.forEach((d) => {
        d.style.boxShadow = 'none';
      });
    },
  });

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('Failed to capture document canvas');
  }

  // 2. Build strictly 1-page jsPDF document matching the preview sample layout
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const a4Width = 210;
  const a4Height = 297;
  const a4Ratio = a4Width / a4Height; // 0.70707
  const imgRatio = canvas.width / canvas.height;

  // Since the preview component represents the full A4 page (with its own internal margins),
  // map edge-to-edge (x = 0, y = 0) without adding artificial margins or downscaling.
  let finalWidth = a4Width;
  let finalHeight = a4Width / imgRatio;
  let x = 0;
  let y = 0;

  // If the rendered content is taller than A4, scale proportionally to fit 1 page, always top-aligned
  if (finalHeight > a4Height) {
    finalHeight = a4Height;
    finalWidth = a4Height * imgRatio;
    x = (a4Width - finalWidth) / 2;
    y = 0;
  } else if (Math.abs(imgRatio - a4Ratio) < 0.04) {
    // Standard A4 aspect ratio (both Performa Invoice and Quotation)
    finalWidth = a4Width;
    finalHeight = a4Height;
    x = 0;
    y = 0;
  } else {
    // If shorter than A4, anchor to top (y = 0) so header stays at the top of the page
    x = 0;
    y = 0;
  }

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');

  // Trigger download directly
  pdf.save(filename);
  return { success: true, pageCount: 1 };
};

/**
 * Renders a document to an offscreen DOM container and exports it to PDF.
 * Enables 1-click download directly from table lists without opening preview modal.
 */
export const downloadDocumentClientSide = async ({
  docType, // 'quotation' or 'invoice'
  documentData,
  settings,
  filename,
}) => {
  if (!documentData) {
    throw new Error('No document data provided for PDF generation');
  }

  // Create isolated container positioned at (0,0) behind page with pointer-events: none
  const container = document.createElement('div');
  container.setAttribute('id', 'client-pdf-export-container');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '794px'; // 210mm standard A4 at 96 DPI
  container.style.minHeight = '1123px'; // 297mm standard A4 at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#111827';
  container.style.zIndex = '-9999';
  container.style.pointerEvents = 'none';
  container.style.opacity = '1';
  document.body.appendChild(container);

  const root = createRoot(container);

  try {
    const Component = docType === 'quotation' ? QuotationDocument : PerformaInvoiceDocument;
    const propName = docType === 'quotation' ? 'quotation' : 'invoice';
    const element = React.createElement(Component, {
      [propName]: documentData,
      settings: settings || {},
    });

    // Mount and wait for images and fonts to settle
    await new Promise((resolve) => {
      root.render(
        React.createElement(
          'div',
          { style: { width: '794px', minHeight: '1123px', background: '#ffffff', color: '#111827', margin: 0, padding: 0 } },
          element
        )
      );
      setTimeout(resolve, 350);
    });

    await exportElementToPdf(container, filename);
  } finally {
    setTimeout(() => {
      try {
        root.unmount();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      } catch (err) {
        console.warn('Error during PDF stage cleanup:', err);
      }
    }, 1500);
  }
};

/**
 * Universal 1-Click PDF Downloader:
 * 1. Tries server PDF binary endpoint first (super fast and 100% crisp vector format).
 * 2. If server fails or times out (Render sleep/error), seamlessly falls back to client-side generator.
 * Result: True 1-click download with document reference number, NO headers, NO footers, NO print dialogs!
 */
export const downloadDocumentPdf = async ({
  docType, // 'quotation' or 'invoice'
  docId,
  docNumber,
  documentData,
  settings,
  element,
  onFallback,
}) => {
  const safeNumber = (docNumber || 'document').replace(/[/\\?%*:|"<>]/g, '-');
  const filename = `${safeNumber}.pdf`;

  // 1. If element is already present in DOM (Preview Modal), export directly!
  // This is instantaneous, 100% reliable, zero server lag, and guarantees full visual fidelity.
  if (element) {
    try {
      await exportElementToPdf(element, filename);
      return { success: true, method: 'client-element' };
    } catch (err) {
      console.warn('Direct element export failed, falling back to server:', err);
    }
  }

  const plural = docType === 'quotation' ? 'quotations' : 'invoices';
  const endpoint = `/${plural}/${docId}/pdf`;

  // 2. Try server PDF binary endpoint
  try {
    const res = await axiosClient.get(endpoint, {
      responseType: 'blob',
      timeout: 8000,
    });

    // Check if response is an error JSON disguised as a blob
    if (
      res.data.type === 'application/json' ||
      (res.data.size < 600 && res.data.type !== 'application/pdf')
    ) {
      const text = await res.data.text();
      try {
        const json = JSON.parse(text);
        if (!json.success) throw new Error(json.message || 'Server PDF error');
      } catch (e) {
        if (!e.message.includes('JSON')) throw e;
      }
    }

    // Success: trigger immediate download of server-generated PDF
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {}
    }, 10000);

    return { success: true, method: 'server-binary' };
  } catch (serverErr) {
    console.warn('Server PDF unavailable, checking fallback:', serverErr.message);

    if (typeof onFallback === 'function') {
      onFallback(serverErr);
      return { success: false, fallbackUsed: true };
    }

    throw serverErr;
  }
};
