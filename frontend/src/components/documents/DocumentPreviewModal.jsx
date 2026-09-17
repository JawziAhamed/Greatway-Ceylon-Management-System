import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Printer,
  Download,
  Edit3,
  Copy,
  ArrowRightCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import QuotationDocument from './QuotationDocument';
import PerformaInvoiceDocument from './PerformaInvoiceDocument';
import StatusBadge from '../common/StatusBadge';
import axiosClient from '../../api/axiosClient';
import { downloadDocumentPdf } from '../../utils/downloadPdf';

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  docType, // 'Quotation' or 'Performa Invoice'
  document,
  settings,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [currentDoc, setCurrentDoc] = useState(document);
  const [downloading, setDownloading] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    setCurrentDoc(document);
  }, [document]);

  if (!isOpen || !currentDoc) return null;

  const isQuotation = docType === 'Quotation';
  const docNumber = isQuotation ? currentDoc.quotationNumber : currentDoc.invoiceNumber;
  const docId = currentDoc._id;

  const handleStatusChange = async (newStatus) => {
    try {
      const endpoint = isQuotation ? `/quotations/${docId}/status` : `/invoices/${docId}/status`;
      const res = await axiosClient.patch(endpoint, { status: newStatus });
      if (res.data && res.data.success) {
        setCurrentDoc({ ...currentDoc, status: newStatus });
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handlePrint = () => {
    const originalTitle = window.document.title;
    window.document.title = docNumber || (isQuotation ? 'Quotation' : 'Performa-Invoice');
    window.print();
    setTimeout(() => {
      window.document.title = originalTitle;
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadDocumentPdf({
        docType: isQuotation ? 'quotation' : 'invoice',
        docId,
        docNumber,
        onFallback: () => {
          handlePrint();
        },
      });
    } catch (err) {
      console.warn('PDF download fallback to print:', err);
      handlePrint();
    } finally {
      setDownloading(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const endpoint = isQuotation
        ? `/quotations/${docId}/duplicate`
        : `/invoices/${docId}/duplicate`;
      const res = await axiosClient.post(endpoint);
      if (res.data && res.data.success) {
        onClose();
        if (onRefresh) onRefresh();
        const targetRoute = isQuotation
          ? `/quotations/${res.data.data._id}/edit`
          : `/invoices/${res.data.data._id}/edit`;
        navigate(targetRoute);
      }
    } catch (err) {
      alert('Failed to duplicate document: ' + err.message);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!window.confirm('Convert this Quotation into a Performa Invoice?')) {
      return;
    }
    try {
      setConverting(true);
      const res = await axiosClient.post(`/quotations/${docId}/convert-to-invoice`);
      if (res.data && res.data.success) {
        onClose();
        if (onRefresh) onRefresh();
        navigate(`/invoices/${res.data.data._id}/edit`);
      }
    } catch (err) {
      alert('Failed to convert quotation: ' + err.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex flex-col justify-start items-center p-4 sm:p-6 print:p-0 print:bg-white">
      {/* Top Toolbar */}
      <div className="no-print bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-[840px] px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-50 text-brand-700 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{docNumber}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <span>{docType}</span>
              <span>&bull;</span>
              <StatusBadge
                status={currentDoc.status}
                options={
                  isQuotation
                    ? ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']
                    : ['Draft', 'Issued', 'Sent', 'Partially Paid', 'Paid', 'Cancelled']
                }
                onStatusChange={handleStatusChange}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isQuotation && !currentDoc.convertedToInvoiceId && (
            <button
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {converting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRightCircle className="w-3.5 h-3.5 text-accent-gold" />
              )}
              Convert to PI
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              navigate(
                isQuotation
                  ? `/quotations/${docId}/edit`
                  : `/invoices/${docId}/edit`
              );
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>

          <button
            onClick={handleDuplicate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-medium shadow-sm transition disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Download PDF
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition hover:bg-gray-100 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Render Document Document Frame */}
      <div className="w-full max-w-[840px] pb-10 print:max-w-none print:pb-0 print-document-container">
        {isQuotation ? (
          <QuotationDocument quotation={currentDoc} settings={settings} />
        ) : (
          <PerformaInvoiceDocument invoice={currentDoc} settings={settings} />
        )}
      </div>
    </div>
  );
}
