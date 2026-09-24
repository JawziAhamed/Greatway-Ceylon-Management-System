import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Building2,
  Image as ImageIcon,
  CreditCard,
  Hash,
  FileText,
  Users,
  Save,
  Plus,
  Trash2,
  Loader2,
  Upload,
  CheckCircle,
  Lock,
  PenTool,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosClient, { resolveMediaUrl } from '../api/axiosClient';
import logoImg from '../assets/logo.png';
import signatureImg from '../assets/signature.png';

export default function SettingsPage() {
  const { settings, setSettings } = useOutletContext();
  const { isAdmin, lockTimeout, setLockTimeout, lockTimeoutOptions, lockSession } = useAuth();

  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState(null);

  // Logo & Signature file upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // User management tab state
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('staff');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      const res = await axiosClient.put('/settings', formData);
      if (res.data.success) {
        setSettings(res.data.data);
        setSuccessMsg('Company settings updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const data = new FormData();
      data.append('logo', file);

      const res = await axiosClient.post('/settings/logo', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setFormData({ ...formData, logoUrl: res.data.data.logoUrl });
        setSettings({ ...settings, logoUrl: res.data.data.logoUrl });
        setSuccessMsg('Logo updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert('Failed to upload logo: ' + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingSignature(true);
      const data = new FormData();
      data.append('signature', file);

      const res = await axiosClient.post('/settings/signature', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        const sigUrl = res.data.data.signatureUrl || res.data.data.signatureImageUrl;
        setFormData((prev) => ({ ...prev, signatureUrl: sigUrl, showSignature: true }));
        setSettings((prev) => ({ ...prev, signatureUrl: sigUrl, showSignature: true }));
        setSuccessMsg('Authorized signature & stamp uploaded successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert('Failed to upload signature: ' + err.message);
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleRemoveSignature = async () => {
    if (!window.confirm('Are you sure you want to remove the authorized signature?')) return;
    try {
      const res = await axiosClient.delete('/settings/signature');
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, signatureUrl: '' }));
        setSettings((prev) => ({ ...prev, signatureUrl: '' }));
        setSuccessMsg('Authorized signature removed successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert('Failed to remove signature: ' + err.message);
    }
  };

  const handleAddBank = () => {
    const banks = formData.bankDetails || [];
    setFormData({
      ...formData,
      bankDetails: [
        ...banks,
        {
          accountName: 'Greatway Ceylon (Pvt) Ltd',
          bankName: 'COMMERCIAL BANK OF CEYLON PLC',
          bankBranch: 'COLOMBO MAIN BRANCH',
          accountNumber: '',
          swift: '',
          iban: '',
          currency: 'USD',
          paymentNote: '',
          isDefault: banks.length === 0,
        },
      ],
    });
  };

  const handleRemoveBank = (index) => {
    const banks = formData.bankDetails.filter((_, i) => i !== index);
    setFormData({ ...formData, bankDetails: banks });
  };

  const handleBankChange = (index, field, val) => {
    const banks = [...formData.bankDetails];
    banks[index] = { ...banks[index], [field]: val };
    setFormData({ ...formData, bankDetails: banks });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      const res = await axiosClient.post('/auth/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      if (res.data.success) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to create user: ' + err.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await axiosClient.patch(`/auth/users/${userId}/status`);
      fetchUsers();
    } catch (err) {
      alert('Error updating user: ' + err.message);
    }
  };

  if (!formData) {
    return (
      <div className="py-20 flex justify-center items-center gap-2 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-800" />
        <span>Loading company settings...</span>
      </div>
    );
  }

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building2 },
    { id: 'logo', label: 'Logo Management', icon: ImageIcon },
    { id: 'signature', label: 'Signature & Stamp', icon: PenTool },
    { id: 'bank', label: 'Bank & Payments', icon: CreditCard },
    { id: 'numbering', label: 'Doc Numbering', icon: Hash },
    { id: 'terms', label: 'Default Terms', icon: FileText },
    { id: 'security', label: 'Security & Auto-Lock', icon: Lock },
    { id: 'users', label: 'Users & Roles', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
          <p className="text-xs text-gray-500">
            Configure official exporter details, bank routing, document formatting, and permissions
          </p>
        </div>

        {activeTab !== 'users' && activeTab !== 'security' && (
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 self-start sm:self-auto"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-accent-gold" />
            )}
            <span>Save Settings</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-brand-800 text-brand-800 bg-brand-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Company Profile */}
        {activeTab === 'company' && (
          <div className="p-6 space-y-4 text-xs max-w-2xl">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Company Legal Name *</label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Business Description</label>
              <textarea
                rows={2}
                value={formData.businessType || ''}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Registered Address *</label>
              <textarea
                rows={2}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Business Registration No. (PV / BR No.) *</label>
                <input
                  type="text"
                  value={formData.registrationNumber || ''}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="e.g. PV 00263042"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-semibold text-brand-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">TAX / VAT / TIN No.</label>
                <input
                  type="text"
                  value={formData.taxNumber || ''}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-brand-800 text-white rounded-xl font-semibold shadow"
              >
                Save Profile Changes
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Logo Management */}
        {activeTab === 'logo' && (
          <div className="p-6 space-y-6 text-xs max-w-xl">
            <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 text-center">
              <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] block mb-3">
                Official Company Logo (Original Aspect Ratio)
              </span>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm inline-block">
                <img
                  src={resolveMediaUrl(formData.logoUrl) || logoImg}
                  alt="Official Greatway Logo"
                  className="max-h-24 max-w-full object-contain mx-auto"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                This logo appears automatically on all generated Quotations, Performa Invoices, and official PDFs.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2">
                Replace Logo File
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl transition">
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Upload Logo Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-gray-400 text-[11px]">
                  PNG or JPG (transparent background recommended)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Authorized Signature & Stamp */}
        {activeTab === 'signature' && (
          <div className="p-6 space-y-6 text-xs max-w-xl">
            <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 text-center">
              <span className="text-gray-500 font-semibold uppercase tracking-wider text-[10px] block mb-3">
                Current Authorized Signature & Stamp
              </span>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm inline-block min-w-[240px]">
                {formData.signatureUrl ? (
                  <img
                    src={resolveMediaUrl(formData.signatureUrl)}
                    alt="Authorized Signature & Stamp"
                    className="max-h-24 max-w-full object-contain mx-auto"
                  />
                ) : (
                  <div className="py-4 text-center">
                    <img
                      src={signatureImg}
                      alt="Default Greatway Signature"
                      className="max-h-24 max-w-full object-contain mx-auto opacity-75"
                    />
                    <span className="text-[10px] text-gray-400 mt-2 block">(Default System Signature Active)</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                This signature and company stamp appears directly above the <strong>Authorized Signatory</strong> line on all exported Performa Invoices and Quotations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-2">
                  Upload Custom Signature / Stamp File
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-xl transition shadow-xs">
                    {uploadingSignature ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Upload Signature Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="hidden"
                    />
                  </label>

                  {formData.signatureUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-red-200 hover:bg-red-50 text-red-700 rounded-xl font-semibold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Signature</span>
                    </button>
                  )}

                  <span className="text-gray-400 text-[11px]">
                    PNG with transparent background recommended
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={formData.showSignature !== false}
                    onChange={(e) =>
                      setFormData({ ...formData, showSignature: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-brand-800 focus:ring-brand-800 border-gray-300"
                  />
                  <span>Show authorized signature on invoices and quotations by default</span>
                </label>
                <p className="text-[11px] text-gray-500 mt-1 pl-6">
                  When enabled, the signature image is automatically included on all PDF downloads and printed documents.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl font-semibold shadow transition disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Signature Preferences</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bank Accounts */}
        {activeTab === 'bank' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Configure international wire transfer bank accounts.
              </p>
              <button
                type="button"
                onClick={handleAddBank}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            <div className="space-y-4">
              {(formData.bankDetails || []).map((bank, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="font-bold text-brand-950 text-xs">
                      Bank Profile #{index + 1} {bank.isDefault && '(Default)'}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[11px] text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(bank.isDefault)}
                          onChange={(e) => {
                            const updated = formData.bankDetails.map((b, i) => ({
                              ...b,
                              isDefault: i === index,
                            }));
                            setFormData({ ...formData, bankDetails: updated });
                          }}
                          className="rounded text-brand-800"
                        />
                        <span>Set Default</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveBank(index)}
                        className="p-1 text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Account Name</label>
                      <input
                        type="text"
                        value={bank.accountName || ''}
                        onChange={(e) => handleBankChange(index, 'accountName', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Bank Name</label>
                      <input
                        type="text"
                        value={bank.bankName || ''}
                        onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Bank Branch</label>
                      <input
                        type="text"
                        value={bank.bankBranch || ''}
                        onChange={(e) => handleBankChange(index, 'bankBranch', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">Account Number</label>
                      <input
                        type="text"
                        value={bank.accountNumber || ''}
                        onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">SWIFT Code</label>
                      <input
                        type="text"
                        value={bank.swift || ''}
                        onChange={(e) => handleBankChange(index, 'swift', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-medium">IBAN (if applicable)</label>
                      <input
                        type="text"
                        value={bank.iban || ''}
                        onChange={(e) => handleBankChange(index, 'iban', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">
                      Routing / Payment Instructions Note
                    </label>
                    <input
                      type="text"
                      value={bank.paymentNote || ''}
                      onChange={(e) => handleBankChange(index, 'paymentNote', e.target.value)}
                      placeholder="e.g. Payment should be made to our agent in the UAE..."
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-brand-800 text-white rounded-xl font-semibold shadow"
              >
                Save Bank Accounts
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Document Numbering */}
        {activeTab === 'numbering' && (
          <div className="p-6 space-y-6 text-xs max-w-xl">
            {/* Quotation Numbering */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Quotation Numbering</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-700 mb-1 block">Prefix</label>
                  <input
                    type="text"
                    value={formData.quotationSettings?.prefix || 'GC-QTN'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quotationSettings: {
                          ...formData.quotationSettings,
                          prefix: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 mb-1 block">Next Sequence Number</label>
                  <input
                    type="number"
                    value={formData.quotationSettings?.nextNumber || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quotationSettings: {
                          ...formData.quotationSettings,
                          nextNumber: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Format: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono">GC-QTN-2026-0001</code>
              </p>
            </div>

            {/* Performa Invoice Numbering */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Performa Invoice Numbering</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-700 mb-1 block">Prefix</label>
                  <input
                    type="text"
                    value={formData.invoiceSettings?.prefix || 'GC-PI'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoiceSettings: {
                          ...formData.invoiceSettings,
                          prefix: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 mb-1 block">Next Sequence Number</label>
                  <input
                    type="number"
                    value={formData.invoiceSettings?.nextNumber || 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        invoiceSettings: {
                          ...formData.invoiceSettings,
                          nextNumber: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Format: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono">GC-PI-2026-0001</code>
              </p>
            </div>

            {/* Shipment Reference Numbering */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Shipment Reference Numbering</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-700 mb-1 block">Prefix</label>
                  <input
                    type="text"
                    value={formData.shipmentReferenceSettings?.prefix ?? 'GWC'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipmentReferenceSettings: {
                          ...(formData.shipmentReferenceSettings || {}),
                          prefix: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. GWC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-gray-700 mb-1 block">Next Sequence Number</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.shipmentReferenceSettings?.nextNumber ?? 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shipmentReferenceSettings: {
                          ...(formData.shipmentReferenceSettings || {}),
                          nextNumber: Math.max(1, Number(e.target.value) || 1),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Format: <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-mono">
                  {formData.shipmentReferenceSettings?.prefix || 'GWC'}-{String(new Date().getFullYear()).slice(-2)}-{String(formData.shipmentReferenceSettings?.nextNumber || 1).padStart(2, '0')}
                </code> (e.g. <span className="font-mono text-brand-800 font-semibold">{formData.shipmentReferenceSettings?.prefix || 'GWC'}-{String(new Date().getFullYear()).slice(-2)}-01</span>)
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-brand-800 text-white rounded-xl font-semibold shadow"
              >
                Save Numbering Rules
              </button>
            </div>
          </div>
        )}

        {/* Tab 5: Default Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="p-6 space-y-4 text-xs max-w-2xl">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Default Quotation Specific Terms (1 per line)
              </label>
              <textarea
                rows={8}
                value={(formData.quotationSettings?.defaultSpecificTerms || []).join('\n')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quotationSettings: {
                      ...formData.quotationSettings,
                      defaultSpecificTerms: e.target.value.split('\n').filter((l) => l.trim()),
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Default Performa Invoice Damage Policy
              </label>
              <textarea
                rows={3}
                value={formData.invoiceSettings?.defaultDamagePolicy || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoiceSettings: {
                      ...formData.invoiceSettings,
                      defaultDamagePolicy: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-xl"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-brand-800 text-white rounded-xl font-semibold shadow"
              >
                Save Terms &amp; Conditions
              </button>
            </div>
          </div>
        )}

        {/* Tab 6: Security & Auto-Lock Session Times */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-6 text-xs max-w-2xl">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-800" />
                <span>Session Security &amp; Inactivity Auto-Lock</span>
              </h2>
              <p className="text-gray-500">
                Configure how long the system waits with no cursor movement or key interaction before automatically engaging the frosted glass lock screen.
              </p>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
              <div>
                <label className="block font-semibold text-gray-800 mb-1.5">
                  Inactivity Auto-Lock Timeout
                </label>
                <select
                  value={lockTimeout}
                  onChange={(e) => {
                    setLockTimeout(Number(e.target.value));
                    setSuccessMsg('Auto-lock timeout updated successfully!');
                    setTimeout(() => setSuccessMsg(''), 3000);
                  }}
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium text-xs focus:ring-2 focus:ring-brand-700"
                >
                  {lockTimeoutOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-2">
                  {lockTimeout === 0
                    ? '⚠️ Auto-lock is currently disabled. You can still lock the screen manually from the sidebar.'
                    : `The screen will automatically lock when inactive for ${lockTimeoutOptions?.find((o) => o.value === lockTimeout)?.label || 'the configured duration'}.`}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={lockSession}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-accent-gold" />
                  <span>Lock Session Now (Test)</span>
                </button>
                <span className="text-gray-500 text-[11px]">
                  Preserves all unsaved quotation/invoice edits in browser memory.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Users & Staff Management */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-6 text-xs">
            {/* Create Staff Form */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl max-w-xl">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Add New Staff User</h3>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Ruwan Silva"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">Email</label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="ruwan@greatwayceylon.com"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">Password</label>
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 mb-1 block">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                    >
                      <option value="staff">Staff (Create &amp; Download Docs)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl font-semibold transition"
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{u.name}</td>
                      <td className="py-2.5 px-4 text-gray-600">{u.email}</td>
                      <td className="py-2.5 px-4 uppercase font-bold text-[10px] tracking-wider text-brand-800">
                        {u.role}
                      </td>
                      <td className="py-2.5 px-4">
                        {u.isActive ? (
                          <span className="text-emerald-700 font-medium">Active</span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u._id)}
                          className="text-brand-800 hover:underline text-[11px] font-medium"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
