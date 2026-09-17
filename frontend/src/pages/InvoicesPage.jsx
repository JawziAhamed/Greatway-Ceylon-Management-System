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
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import { formatCurrency, formatDate } from '../components/documents/QuotationDocument';
import axiosClient from '../api/axiosClient';

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/invoices');
      if (res.data && res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePreview = (item) => {
    setActiveInvoice(item);
    setPreviewOpen(true);
  };

  const handleDuplicate = async (id) => {
    try {
      const res = await axiosClient.post(`/invoices/${id}/duplicate`);
      if (res.data && res.data.success) {
        fetchInvoices();
        navigate(`/invoices/${res.data.data._id}/edit`);
      }
    } catch (err) {
      alert('Error duplicating invoice: ' + err.message);
    }
  };

  const handleDelete = async (id, num) => {
    if (!window.confirm(`Are you sure you want to delete Performa Invoice ${num}?`)) return;
    try {
      await axiosClient.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      alert('Error deleting invoice: ' + err.message);
    }
  };

  const handleDownloadPdf = async (item) => {
    try {
      const res = await axiosClient.get(`/invoices/${item._id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      alert('Failed to download PDF: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axiosClient.patch(`/invoices/${id}/status`, { status: newStatus });
      if (res.data && res.data.success) {
        setInvoices((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const statuses = [
    'All',
    'Draft',
    'Issued',
    'Sent',
    'Partially Paid',
    'Paid',
    'Cancelled',
  ];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.buyerSnapshot?.companyName || inv.customer?.companyName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (inv.shipmentReference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Performa Invoices</h1>
          <p className="text-xs text-gray-500">
            Official export shipping and customs performa invoices
          </p>
        </div>

        <button
          onClick={() => navigate('/invoices/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-accent-gold" />
          <span>New Performa Invoice</span>
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
              placeholder="Search invoice or reference..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-700 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="overflow-x-auto min-h-[180px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Shipment Ref</th>
                <th className="py-3 px-4 text-right">Invoice Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Source Quotation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    No performa invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {inv.buyerSnapshot?.companyName || inv.customer?.companyName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-600 font-mono">
                      {inv.shipmentReference || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      $ {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={inv.status}
                        options={['Draft', 'Issued', 'Sent', 'Partially Paid', 'Paid', 'Cancelled']}
                        onStatusChange={(newStatus) => handleStatusChange(inv._id, newStatus)}
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.quotationId ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/quotations/${inv.quotationId._id || inv.quotationId}/edit`
                            )
                          }
                          title="View Source Quotation"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 font-mono bg-amber-50 hover:bg-amber-100 hover:underline px-2 py-0.5 rounded cursor-pointer transition shadow-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {inv.quotationId?.quotationNumber || 'QTN'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Direct PI</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-500">
                        <button
                          onClick={() => handlePreview(inv)}
                          title="Preview Invoice"
                          className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => navigate(`/invoices/${inv._id}/edit`)}
                          title="Edit Invoice"
                          className="p-1.5 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(inv._id)}
                          title="Duplicate Invoice"
                          className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          title="Download PDF"
                          className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                          title="Delete Invoice"
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
        onClose={() => setPreviewOpen(false)}
        docType="Performa Invoice"
        document={activeInvoice}
        settings={settings}
        onRefresh={fetchInvoices}
      />
    </div>
  );
}
