import React from 'react';
import { createRoot } from 'react-dom/client';
import html2pdf from 'html2pdf.js';
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
 * Direct 1-click PDF generation from a DOM element using html2pdf.js.
 * Produces crisp vector/image A4 PDF directly in the browser.
 * Absolutely NO browser print dialog, NO date/time header, NO URL footer!
 */
export const exportElementToPdf = async (element, rawFilename) => {
  if (!element) {
    throw new Error('Target element for PDF export does not exist');
  }

  const filename = sanitizeFilename(rawFilename);

  // Directly target the inner document if a wrapper or modal container was passed
  const targetElement =
    element.querySelector?.('.invoice-document-root, .quotation-document-root') ||
    element.firstElementChild ||
    element;

  const opt = {
    margin: [0, 0, 0, 0],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2, // High resolution crisp rendering
      useCORS: true,
      logging: false,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1200, // Standardize layout typography across desktop & laptop screens
      onclone: (clonedDoc) => {
        // Strip box shadows that look weird in PDF
        const docs = clonedDoc.querySelectorAll(
          '.shadow-md, .shadow-lg, .shadow-sm, .shadow-xl, .shadow-2xl'
        );
        docs.forEach((d) => {
          d.style.boxShadow = 'none';
        });

        // Strip outer wrapper padding that could expand canvas height
        const wrap = clonedDoc.getElementById('printable-document-content');
        if (wrap) {
          wrap.style.padding = '0';
          wrap.style.margin = '0';
        }
      },
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  const worker = html2pdf().set(opt).from(targetElement);
  await worker.toCanvas();
  const canvas = worker.prop.canvas;
  const a4Ratio = 297 / 210; // ~1.41428
  const currentRatio = canvas ? canvas.height / canvas.width : 0;

  await worker.toPdf();
  const pdf = worker.prop.pdf;
  const pageCount = pdf ? pdf.internal.getNumberOfPages() : 1;

  // Smart 1-Page Fitting: If document has spilled slightly over 1 page (<= 1.20x A4 ratio),
  // scale it cleanly to fit on exactly 1 single A4 page so no trailing blank/partial 2nd page is created.
  if (canvas && currentRatio > 0 && currentRatio <= a4Ratio * 1.20 && pageCount > 1 && pdf) {
    const JsPdfClass = pdf.constructor;
    const singlePdf = new JsPdfClass({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pdfW = 210;
    const pdfH = 297;
    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const scale = Math.min(1, pdfH / imgH);
    const finalW = imgW * scale;
    const finalH = imgH * scale;
    const x = (pdfW - finalW) / 2;
    const y = (pdfH - finalH) / 2;
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    singlePdf.addImage(imgData, 'JPEG', x, y, finalW, finalH);
    return singlePdf.save(filename);
  }

  return worker.save();
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
          { style: { width: '794px', background: '#ffffff', color: '#111827', margin: 0, padding: 0 } },
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
