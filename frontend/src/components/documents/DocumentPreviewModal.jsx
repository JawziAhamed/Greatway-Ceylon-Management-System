import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
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
  document: docProp,
  settings,
  onRefresh,
  autoDownload = false,
}) {
  const navigate = useNavigate();
  const [currentDoc, setCurrentDoc] = useState(docProp);
  const [currentSettings, setCurrentSettings] = useState(settings || {});
  const [downloading, setDownloading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const printContentRef = useRef(null);

  const autoDownloadedRef = useRef(false);

  useEffect(() => {
    setCurrentDoc(docProp);
  }, [docProp]);

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setCurrentSettings(settings);
    } else {
      axiosClient
        .get('/settings')
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setCurrentSettings(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [settings, isOpen]);

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSig(true);
      const formData = new FormData();
      formData.append('signature', file);
      const res = await axiosClient.post('/settings/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        const newSigUrl =
          res.data.data?.signatureUrl ||
          res.data.data?.defaultSignatory?.signatureImageUrl ||
          '/uploads/signature.png';
        setCurrentSettings((prev) => ({
          ...prev,
          signatureUrl: newSigUrl,
          showSignature: true,
        }));
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert('Failed to upload signature & stamp: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingSig(false);
      e.target.value = '';
    }
  };

  const isQuotation = docType === 'Quotation';
  const docNumber = currentDoc
    ? isQuotation
      ? currentDoc.quotationNumber
      : currentDoc.invoiceNumber
    : '';
  const docId = currentDoc?._id;

  const handleDownloadPdf = async () => {
    if (!currentDoc) return;
    try {
      setDownloading(true);
      const containerEl =
        printContentRef.current ||
        window.document.getElementById('printable-document-content');
      const docElement =
        containerEl?.querySelector('.invoice-document-root, .quotation-document-root') ||
        containerEl?.firstElementChild ||
        containerEl;
      await downloadDocumentPdf({
        docType: isQuotation ? 'quotation' : 'invoice',
        docId,
        docNumber,
        documentData: currentDoc,
        settings: currentSettings,
        element: docElement,
      });
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Failed to download PDF: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Auto-download trigger when modal is invoked directly from table action button
  useEffect(() => {
    if (!isOpen) {
      autoDownloadedRef.current = false;
      return;
    }

    let timer;
    if (autoDownload && currentDoc && !autoDownloadedRef.current) {
      autoDownloadedRef.current = true;
      timer = setTimeout(async () => {
        try {
          await handleDownloadPdf();
        } finally {
          setTimeout(() => {
            if (onClose) onClose();
          }, 600);
        }
      }, 400);
    }
    return () => clearTimeout(timer);
  }, [isOpen, autoDownload, currentDoc]);

  if (!isOpen || !currentDoc) return null;

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

          {/* Upload Sign & Stamp from Device */}
          <label
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition select-none disabled:opacity-50"
            title="Upload signature and company stamp from your device"
          >
            {uploadingSig ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-amber-700" />
            )}
            <span>{currentSettings.signatureUrl ? 'Change Sign & Stamp' : 'Add Sign & Stamp'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureUpload}
              disabled={uploadingSig}
            />
          </label>

          {autoDownload && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              Generating PDF...
            </span>
          )}

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

      {/* Render Document Frame */}
      <div
        ref={printContentRef}
        id="printable-document-content"
        className="w-full max-w-[840px] mb-8 print:mb-0 print:max-w-none print-document-container"
      >
        {isQuotation ? (
          <QuotationDocument
            quotation={currentDoc}
            settings={currentSettings}
            onUploadSignature={handleSignatureUpload}
          />
        ) : (
          <PerformaInvoiceDocument
            invoice={currentDoc}
            settings={currentSettings}
            onUploadSignature={handleSignatureUpload}
          />
        )}
      </div>
    </div>
  );
}
