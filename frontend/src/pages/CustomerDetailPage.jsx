import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  FileCheck2,
  DollarSign,
  Eye,
  Edit3,
  Loader2,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import { formatCurrency, formatDate } from '../components/documents/QuotationDocument';
import axiosClient from '../api/axiosClient';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useOutletContext();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [docType, setDocType] = useState('Quotation');

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/customers/${id}`);
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customer history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerHistory();
  }, [id]);

  const handleOpenDocPreview = (doc, type) => {
    setActiveDoc(doc);
    setDocType(type);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center gap-2 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-800" />
        <span>Loading Customer profile and statement...</span>
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="p-8 text-center text-gray-500">
        Customer not found.
      </div>
    );
  }

  const { customer, quotations = [], invoices = [], stats = {} } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{customer.companyName}</h1>
          <p className="text-xs text-gray-500">
            Customer Statement &bull; Total sales and documents history
          </p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Contact &amp; Importer
            </span>
            <div className="font-bold text-gray-900 text-sm">
              {customer.contactPerson || 'N/A'}
            </div>
            <div className="text-gray-600 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{customer.country || 'N/A'}</span>
            </div>
            {customer.address && (
              <div className="text-gray-500 mt-1 whitespace-pre-line pl-5">
                {customer.address}
              </div>
            )}
          </div>

          <div>
            <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Communication Details
            </span>
            <div className="text-gray-700 space-y-1">
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.taxNumber && (
                <div className="text-gray-600 font-mono text-[11px] pt-1">
                  Tax/VAT: {customer.taxNumber}
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-gray-400 uppercase font-semibold text-[10px] tracking-wider block mb-1">
              Internal Reference &amp; Notes
            </span>
            {customer.buyerReference && (
              <div className="font-mono text-xs text-brand-800 font-semibold bg-brand-50 px-2 py-1 rounded inline-block">
                Ref: {customer.buyerReference}
              </div>
            )}
            {customer.notes && (
              <p className="text-gray-600 mt-1 text-[11px] italic">
                {customer.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Quotations Created"
          value={stats.totalQuotations || 0}
          subtext="Total Price Proposals"
          icon={FileSpreadsheet}
          color="brand"
        />
        <StatCard
          title="Quotation Value"
          value={`$ ${formatCurrency(stats.totalQuotationValue)}`}
          subtext="Total value quoted"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Performa Invoices"
          value={stats.totalInvoices || 0}
          subtext="Export Invoices Issued"
          icon={FileCheck2}
          color="amber"
        />
        <StatCard
          title="Total Invoiced Value"
          value={`$ ${formatCurrency(stats.totalInvoiceValue)}`}
          subtext={`$ ${formatCurrency(stats.paidInvoiceValue)} Paid`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Quotations History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-brand-700" />
            <span>Quotation History ({quotations.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold uppercase text-[11px] border-b border-gray-200">
                <th className="py-2.5 px-4">Number</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Cartons</th>
                <th className="py-2.5 px-4 text-right">Grand Total</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No quotations on record for this customer.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-gray-50/70">
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{q.quotationNumber}</td>
                    <td className="py-2.5 px-4 text-gray-500">{formatDate(q.quotationDate)}</td>
                    <td className="py-2.5 px-4">{q.totalCartons || 0}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">$ {formatCurrency(q.grandTotal)}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={q.status} /></td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDocPreview(q, 'Quotation')}
                        className="p-1 hover:text-brand-800 text-gray-500"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performa Invoices History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-brand-700" />
            <span>Performa Invoices History ({invoices.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold uppercase text-[11px] border-b border-gray-200">
                <th className="py-2.5 px-4">Invoice No</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Shipment Ref</th>
                <th className="py-2.5 px-4 text-right">Invoice Value</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-400">
                    No invoices on record for this customer.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-gray-50/70">
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-4 text-gray-500">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-2.5 px-4 font-mono text-gray-600">{inv.shipmentReference || '—'}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-gray-900">$ {formatCurrency(inv.grandTotal)}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={inv.status} /></td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDocPreview(inv, 'Performa Invoice')}
                        className="p-1 hover:text-brand-800 text-gray-500"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
        docType={docType}
        document={activeDoc}
        settings={settings}
      />
    </div>
  );
}
