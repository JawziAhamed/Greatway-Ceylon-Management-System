import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Download,
  Printer,
  Trash2,
  ArrowRightCircle,
  FileSpreadsheet,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import { formatCurrency, formatDate } from '../components/documents/QuotationDocument';
import axiosClient from '../api/axiosClient';
import { downloadDocumentPdf } from '../utils/downloadPdf';

export default function QuotationsPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState(null);
  const [autoDownload, setAutoDownload] = useState(false);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/quotations');
      if (res.data && res.data.success) {
        setQuotations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handlePreview = (item) => {
    setActiveQuotation(item);
    setAutoDownload(false);
    setPreviewOpen(true);
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await axiosClient.post(`/quotations/${id}/duplicate`);
      if (res.data && res.data.success) {
        fetchQuotations();
        navigate(`/quotations/${res.data.data._id}/edit`);
      }
    } catch (err) {
      alert('Error duplicating quotation: ' + err.message);
    }
  };

  const handleDelete = async (id, num) => {
    if (!window.confirm(`Are you sure you want to delete quotation ${num}?`)) return;
    try {
      await axiosClient.delete(`/quotations/${id}`);
      fetchQuotations();
    } catch (err) {
      alert('Error deleting quotation: ' + err.message);
    }
  };

  const handleConvertToInvoice = async (id) => {
    if (!window.confirm('Convert this Quotation into a Performa Invoice?')) return;
    try {
      const res = await axiosClient.post(`/quotations/${id}/convert-to-invoice`);
      if (res.data && res.data.success) {
        fetchQuotations();
        navigate(`/invoices/${res.data.data._id}/edit`);
      }
    } catch (err) {
      alert('Error converting to invoice: ' + err.message);
    }
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadPdf = (item) => {
    setActiveQuotation(item);
    setAutoDownload(true);
    setPreviewOpen(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axiosClient.patch(`/quotations/${id}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        setQuotations((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const statuses = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'];

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.buyerSnapshot?.companyName || q.customer?.companyName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || q.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quotations</h1>
          <p className="text-xs text-gray-500">
            Create, track, and manage official export price quotations
          </p>
        </div>

        <button
          onClick={() => navigate('/quotations/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-accent-gold" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Filter and Status Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedStatus === st
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search quotation or buyer..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-700 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Quotations List Table */}
        <div className="overflow-x-auto min-h-[180px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Quotation No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Cartons</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Linked PI</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                      {q.quotationNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {q.buyerSnapshot?.companyName || q.customer?.companyName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatDate(q.quotationDate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {q.totalCartons || 0}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      $ {formatCurrency(q.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={q.status}
                        options={['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']}
                        onStatusChange={(newStatus) => handleStatusChange(q._id, newStatus)}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {q.convertedToInvoiceId ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/invoices/${q.convertedToInvoiceId._id || q.convertedToInvoiceId}/edit`
                            )
                          }
                          title="View Linked Performa Invoice"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 font-mono bg-brand-50 hover:bg-brand-100 hover:underline px-2 py-0.5 rounded cursor-pointer transition shadow-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {q.convertedToInvoiceId?.invoiceNumber || 'PI Linked'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-500">
                        {!q.convertedToInvoiceId && (
                          <button
                            onClick={() => handleConvertToInvoice(q._id)}
                            title="Convert to Performa Invoice"
                            className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition text-brand-700"
                          >
                            <ArrowRightCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handlePreview(q)}
                          title="Preview Quotation"
                          className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => navigate(`/quotations/${q._id}/edit`)}
                          title="Edit Quotation"
                          className="p-1.5 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(q._id)}
                          title="Duplicate Quotation"
                          className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(q)}
                          disabled={downloadingId === q._id}
                          title="Download PDF"
                          className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition disabled:opacity-50"
                        >
                          {downloadingId === q._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand-800" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(q._id, q.quotationNumber)}
                          title="Delete Quotation"
                          className="p-1.5 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setAutoDownload(false);
        }}
        docType="Quotation"
        document={activeQuotation}
        settings={settings}
        onRefresh={fetchQuotations}
        autoDownload={autoDownload}
      />
    </div>
  );
}
