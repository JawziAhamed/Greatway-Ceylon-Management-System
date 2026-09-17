import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Edit3,
  Trash2,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Building,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [buyerReference, setBuyerReference] = useState('');
  const [notes, setNotes] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/customers');
      if (res.data && res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setContactPerson('');
    setAddress('');
    setCountry('');
    setEmail('');
    setPhone('');
    setTaxNumber('');
    setBuyerReference('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingCustomer(c);
    setCompanyName(c.companyName || '');
    setContactPerson(c.contactPerson || '');
    setAddress(c.address || '');
    setCountry(c.country || '');
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setTaxNumber(c.taxNumber || '');
    setBuyerReference(c.buyerReference || '');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!companyName) return;

    try {
      setSaving(true);
      const payload = {
        companyName,
        contactPerson,
        address,
        country,
        email,
        phone,
        taxNumber,
        buyerReference,
        notes,
      };

      if (editingCustomer) {
        await axiosClient.put(`/customers/${editingCustomer._id}`, payload);
      } else {
        await axiosClient.post('/customers', payload);
      }

      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      alert('Failed to save customer: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove customer "${name}"?`)) return;
    try {
      await axiosClient.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      alert('Failed to remove customer: ' + err.message);
    }
  };

  const filtered = customers.filter((c) => {
    const s = searchTerm.toLowerCase();
    return (
      c.companyName.toLowerCase().includes(s) ||
      (c.country || '').toLowerCase().includes(s) ||
      (c.contactPerson || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-xs text-gray-500">
            Maintain international buyers, importer tax details, and transaction history
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-accent-gold" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer, country, email..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-700 w-full"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Tax/VAT No</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/customers/${c._id}`)}
                        className="font-bold text-gray-900 hover:text-brand-800 flex items-center gap-1.5"
                      >
                        <span>{c.companyName}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </button>
                      {c.buyerReference && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          Ref: {c.buyerReference}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      {c.contactPerson || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {c.country || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 space-y-0.5">
                      {c.email && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {c.email}
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {c.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-700">
                      {c.taxNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-500">
                        <button
                          onClick={() => navigate(`/customers/${c._id}`)}
                          title="View Statement & Documents"
                          className="p-1.5 hover:text-brand-800 hover:bg-brand-50 rounded transition"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Customer"
                          className="p-1.5 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c._id, c.companyName)}
                          title="Remove Customer"
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

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-brand-700" />
              <span>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Nuragro FZE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Tariq Al-Mansoor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Country / City
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. Sharjah, UAE"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Company Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="P.O Box No: 51505, Sharjah, UAE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@nuragro.ae"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 6 512 8899"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tax / VAT / TRN Number
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="TRN-1002938491"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Buyer Reference Code
                  </label>
                  <input
                    type="text"
                    value={buyerReference}
                    onChange={(e) => setBuyerReference(e.target.value)}
                    placeholder="NRG-EXP-2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special packaging or logistics notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl shadow transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
