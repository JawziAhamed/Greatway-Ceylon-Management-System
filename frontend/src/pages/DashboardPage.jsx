import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  FileSpreadsheet,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Plus,
  Eye,
  Edit3,
  Copy,
  Download,
  Printer,
  Trash2,
  Search,
  ArrowRightCircle,
  Filter,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import { formatCurrency, formatDate } from '../components/documents/QuotationDocument';
import axiosClient from '../api/axiosClient';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for recent docs
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewType, setPreviewType] = useState('Quotation');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/stats');
      if (res.data && res.data.success) {
        setStats(res.data.data.summary);
        setRecentDocs(res.data.data.recentDocuments);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenPreview = async (doc) => {
    try {
      const isQuotation = doc.docType === 'Quotation';
      const endpoint = isQuotation
        ? `/quotations/${doc._id}`
        : `/invoices/${doc._id}`;
      const res = await axiosClient.get(endpoint);
      if (res.data && res.data.success) {
        setPreviewDoc(res.data.data);
        setPreviewType(doc.docType);
        setPreviewModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load document details: ' + err.message);
    }
  };

  const handleDuplicate = async (doc) => {
    try {
      const isQuotation = doc.docType === 'Quotation';
      const endpoint = isQuotation
        ? `/quotations/${doc._id}/duplicate`
        : `/invoices/${doc._id}/duplicate`;
      const res = await axiosClient.post(endpoint);
      if (res.data && res.data.success) {
        fetchDashboardData();
        navigate(
          isQuotation
            ? `/quotations/${res.data.data._id}/edit`
            : `/invoices/${res.data.data._id}/edit`
        );
      }
    } catch (err) {
      alert('Failed to duplicate document: ' + err.message);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete ${doc.docNumber}?`)) {
      return;
    }
    try {
      const isQuotation = doc.docType === 'Quotation';
      const endpoint = isQuotation
        ? `/quotations/${doc._id}`
        : `/invoices/${doc._id}`;
      await axiosClient.delete(endpoint);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  const handleDownloadPdf = async (doc) => {
    try {
      const isQuotation = doc.docType === 'Quotation';
      const endpoint = isQuotation
        ? `/quotations/${doc._id}/pdf`
        : `/invoices/${doc._id}/pdf`;
      const res = await axiosClient.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${doc.docNumber}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      alert('Failed to download PDF: ' + err.message);
    }
  };

  const handlePrintDoc = async (doc) => {
    await handleOpenPreview(doc);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const filteredDocs = recentDocs.filter((doc) => {
    const matchesSearch =
      doc.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || doc.docType === typeFilter;
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-brand-900 to-brand-800 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-gold">
            Greatway Ceylon (Pvt) Ltd
          </span>
          <h1 className="text-xl font-bold mt-1">Export Sales Documents Portal</h1>
          <p className="text-xs text-brand-200 mt-1 max-w-xl">
            Create, manage, download, and print official Quotations and Performa Invoices for international buyers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/quotations/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-brand-900 hover:bg-gray-100 rounded-xl text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4 text-brand-800" />
            <span>New Quotation</span>
          </button>
          <button
            onClick={() => navigate('/invoices/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-gold hover:bg-[#b0891f] text-brand-950 rounded-xl text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Performa Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Quotations"
          value={stats?.totalQuotations ?? '...'}
          subtext={`${stats?.pendingQuotations ?? 0} Pending • ${stats?.acceptedQuotations ?? 0} Accepted`}
          icon={FileSpreadsheet}
          color="brand"
        />
        <StatCard
          title="Performa Invoices"
          value={stats?.totalInvoices ?? '...'}
          subtext={`${stats?.pendingPayments ?? 0} Pending • ${stats?.paidInvoices ?? 0} Paid`}
          icon={FileCheck2}
          color="blue"
        />
        <StatCard
          title="Total Sales Value"
          value={`$ ${formatCurrency(stats?.totalSalesValue)}`}
          subtext={`From ${stats?.totalInvoices ?? 0} Performa Invoices`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Active Catalogue"
          value={stats?.totalProducts ?? '...'}
          subtext={`${stats?.totalCustomers ?? 0} Registered Buyers`}
          icon={CheckCircle2}
          color="amber"
        />
      </div>

      {/* Recent Documents Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Filter Header */}
        <div className="p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Documents</h2>
            <p className="text-xs text-gray-500">
              Overview of all latest Quotations and Performa Invoices
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search number or customer..."
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-700 w-48 sm:w-56"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="All">All Types</option>
              <option value="Quotation">Quotations</option>
              <option value="Performa Invoice">Performa Invoices</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-brand-700"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Issued">Issued</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Doc Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Customer / Buyer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No documents found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isQuotation = doc.docType === 'Quotation';

                  return (
                    <tr key={doc._id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                        {doc.docNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isQuotation
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isQuotation ? (
                            <FileSpreadsheet className="w-3 h-3" />
                          ) : (
                            <FileCheck2 className="w-3 h-3" />
                          )}
                          {doc.docType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        {doc.customer}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatDate(doc.date)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        $ {formatCurrency(doc.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-gray-500">
                          <button
                            onClick={() => handleOpenPreview(doc)}
                            title="Preview Document"
                            className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                isQuotation
                                  ? `/quotations/${doc._id}/edit`
                                  : `/invoices/${doc._id}/edit`
                              )
                            }
                            title="Edit Document"
                            className="p-1.5 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(doc)}
                            title="Duplicate Document"
                            className="p-1.5 hover:text-gray-800 hover:bg-gray-100 rounded transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(doc)}
                            title="Download PDF"
                            className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handlePrintDoc(doc)}
                            title="Print"
                            className="p-1.5 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(doc)}
                            title="Delete Document"
                            className="p-1.5 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        docType={previewType}
        document={previewDoc}
        settings={settings}
        onRefresh={fetchDashboardData}
      />
    </div>
  );
}
