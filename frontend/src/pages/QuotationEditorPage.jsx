import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import {
  Save,
  Eye,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  Building2,
  DollarSign,
  Ship,
  FileCheck,
} from 'lucide-react';
import QuotationDocument, { formatCurrency } from '../components/documents/QuotationDocument';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import { INCOTERMS_OPTIONS, getIncotermCode } from '../utils/incoterms';
import axiosClient from '../api/axiosClient';

export default function QuotationEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useOutletContext();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'

  // Master records
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [incoterms, setIncoterms] = useState('CIF');
  const [vesselDetails, setVesselDetails] = useState(
    'Line : MAERSK  Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS'
  );
  const [departureDateText, setDepartureDateText] = useState('22nd September 2026');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([
    {
      itemCode: 'KC',
      description: 'King Coconut',
      netWeightPerBox: '6 nuts',
      ratePerNutKg: 1.27,
      boxRate: 7.60,
      quantityCartons: 1900,
      lineTotal: 14440.00,
    },
  ]);

  // Freight and financial adjustments
  const [freightDescription, setFreightDescription] = useState('Free time at destination added cost for Freight');
  const [freightCost, setFreightCost] = useState(250.00);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  // Terms & Conditions
  const [paymentTerms, setPaymentTerms] = useState(
    "50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customer's warehouse."
  );
  const [deliveryTerms, setDeliveryTerms] = useState(
    "The quoted CIF rates are applicable only up to Salalah Port, Oman. Transportation, customs clearance, and delivery from Salalah Port to the customer's final location shall be arranged and borne by the customer."
  );
  const [specificTerms, setSpecificTerms] = useState([]);

  // Quick Customer Creation modal inline
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCountry, setNewCustCountry] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Initial Load
  useEffect(() => {
    const loadInitData = async () => {
      try {
        setLoading(true);
        // Load customers & products
        const [cRes, pRes] = await Promise.all([
          axiosClient.get('/customers'),
          axiosClient.get('/products'),
        ]);
        if (cRes.data.success) setCustomers(cRes.data.data);
        if (pRes.data.success) setProducts(pRes.data.data);

        if (isEditMode) {
          // Load quotation
          const qRes = await axiosClient.get(`/quotations/${id}`);
          if (qRes.data.success) {
            const q = qRes.data.data;
            setQuotationNumber(q.quotationNumber);
            setQuotationDate(
              q.quotationDate ? new Date(q.quotationDate).toISOString().split('T')[0] : ''
            );
            setValidUntil(
              q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : ''
            );
            setCustomerId(q.customer?._id || q.customer || '');
            setCurrency(q.currency || 'USD');
            setVesselDetails(q.vesselDetails || '');
            setDepartureDateText(q.departureDateText || '');
            setStatus(q.status || 'Draft');
            setNotes(q.notes || '');
            setItems(q.items || []);
            setFreightDescription(q.freightDescription || '');
            setFreightCost(q.freightCost || 0);
            setDiscount(q.discount || 0);
            setTax(q.tax || 0);
            setPaymentTerms(q.paymentTerms || '');
            setDeliveryTerms(q.deliveryTerms || '');
            setIncoterms(q.incoterms || 'CIF');
            setSpecificTerms(q.specificTerms || []);
          }
        } else {
          // Get next quotation number
          const numRes = await axiosClient.get('/quotations/next-number');
          if (numRes.data.success) {
            setQuotationNumber(numRes.data.nextNumber);
          }
          if (settings?.quotationSettings?.defaultIncoterms) {
            setIncoterms(settings.quotationSettings.defaultIncoterms);
          }
          if (settings?.quotationSettings?.defaultSpecificTerms) {
            setSpecificTerms(settings.quotationSettings.defaultSpecificTerms);
          }
          // Default to first customer if available
          if (cRes.data.data.length > 0) {
            setCustomerId(cRes.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading editor data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitData();
  }, [id, isEditMode, settings]);

  // Calculations
  const totalCartons = items.reduce((sum, item) => sum + (Number(item.quantityCartons) || 0), 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0);
  const subtotal = Number((itemsSubtotal + (Number(freightCost) || 0)).toFixed(2));
  const grandTotal = Number((subtotal - (Number(discount) || 0) + (Number(tax) || 0)).toFixed(2));

  // Item row change handler
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    if (field === 'quantityCartons' || field === 'boxRate') {
      const qty = field === 'quantityCartons' ? Number(value) || 0 : Number(row.quantityCartons) || 0;
      const rate = field === 'boxRate' ? Number(value) || 0 : Number(row.boxRate) || 0;
      row.lineTotal = Number((qty * rate).toFixed(2));
    }

    updated[index] = row;
    setItems(updated);
  };

  const handleSelectProduct = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;

    const updated = [...items];
    const qty = Number(updated[index].quantityCartons) || 100;
    const boxRate = prod.defaultBoxRate || 0;

    updated[index] = {
      ...updated[index],
      itemCode: prod.code,
      description: prod.name,
      netWeightPerBox: prod.defaultWeightPerBox || '',
      ratePerNutKg: prod.defaultRatePerNutKg || 0,
      boxRate: boxRate,
      lineTotal: Number((qty * boxRate).toFixed(2)),
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        itemCode: '',
        description: '',
        netWeightPerBox: '5.5 kg',
        ratePerNutKg: 0,
        boxRate: 0,
        quantityCartons: 100,
        lineTotal: 0,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuickCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName) return;
    try {
      const res = await axiosClient.post('/customers', {
        companyName: newCustName,
        country: newCustCountry,
        email: newCustEmail,
      });
      if (res.data.success) {
        setCustomers([...customers, res.data.data]);
        setCustomerId(res.data.data._id);
        setShowNewCustomerModal(false);
        setNewCustName('');
        setNewCustCountry('');
        setNewCustEmail('');
      }
    } catch (err) {
      alert('Failed to create customer: ' + err.message);
    }
  };

  const handleSave = async (redirectBack = true) => {
    if (!customerId) {
      alert('Please select a customer for this quotation.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        quotationNumber,
        quotationDate,
        validUntil: validUntil || undefined,
        customerId,
        currency,
        vesselDetails,
        departureDateText,
        items,
        freightDescription,
        freightCost: Number(freightCost) || 0,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paymentTerms,
        deliveryTerms,
        incoterms: getIncotermCode(incoterms),
        specificTerms,
        status,
        notes,
      };

      let res;
      if (isEditMode) {
        res = await axiosClient.put(`/quotations/${id}`, payload);
      } else {
        res = await axiosClient.post('/quotations', payload);
      }

      if (res.data.success) {
        if (redirectBack) {
          navigate('/quotations');
        } else {
          setActiveTab('preview');
        }
      }
    } catch (err) {
      alert('Failed to save quotation: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Construct draft object for live preview
  const selectedCustomerObj = customers.find((c) => c._id === customerId);
  const previewDraftDoc = {
    quotationNumber,
    quotationDate,
    validUntil,
    buyerSnapshot: selectedCustomerObj || { companyName: 'Select Customer' },
    currency,
    incoterms,
    vesselDetails,
    departureDateText,
    items,
    freightDescription,
    freightCost: Number(freightCost) || 0,
    totalCartons,
    subtotal,
    discount: Number(discount) || 0,
    tax: Number(tax) || 0,
    grandTotal,
    paymentTerms,
    deliveryTerms,
    specificTerms,
    status,
    signatory: {
      name: settings?.defaultSignatory?.name || 'C C Ranesh Anthony',
      designation: settings?.defaultSignatory?.designation || 'Chief Executive Officer',
    },
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center gap-2 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-800" />
        <span>Loading Quotation details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quotations')}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditMode ? `Edit Quotation: ${quotationNumber}` : 'Create New Quotation'}
            </h1>
            <p className="text-xs text-gray-500">
              Fill all export details. All calculations update dynamically.
            </p>
          </div>
        </div>

        {/* Tab switcher & Action buttons */}
        <div className="flex items-center gap-2.5">
          <div className="bg-gray-200 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'edit'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Form Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-white text-brand-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-accent-gold" />
            )}
            <span>Save Quotation</span>
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className="bg-gray-100 p-6 rounded-2xl">
          <div className="mb-4 flex justify-between items-center max-w-[820px] mx-auto">
            <span className="text-xs text-gray-500 font-medium">
              Real-time prototype reproduction preview:
            </span>
            <button
              onClick={() => {
                const originalTitle = window.document.title;
                window.document.title = quotationNumber || 'Quotation';
                window.print();
                setTimeout(() => {
                  window.document.title = originalTitle;
                }, 1500);
              }}
              className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900"
            >
              Print Preview
            </button>
          </div>
          <QuotationDocument quotation={previewDraftDoc} settings={settings} />
        </div>
      ) : (
        /* Form Editor */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Header Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Building2 className="w-4 h-4 text-brand-700" />
                <span>Buyer &amp; Document Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Customer / Buyer *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomerModal(true)}
                      className="text-brand-700 hover:underline text-[11px] font-medium"
                    >
                      + Quick Add Buyer
                    </button>
                  </div>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-brand-700 bg-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName} ({c.country || 'No Country'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quotation Number
                  </label>
                  <input
                    type="text"
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quotation Date
                  </label>
                  <input
                    type="date"
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Valid Until Date
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (AED)</option>
                    <option value="LKR">LKR (Rs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Incoterms
                  </label>
                  <select
                    value={getIncotermCode(incoterms)}
                    onChange={(e) => setIncoterms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium focus:ring-1 focus:ring-brand-700"
                  >
                    {INCOTERMS_OPTIONS.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quotation Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping & Vessel Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Ship className="w-4 h-4 text-brand-700" />
                <span>Shipping &amp; Vessel Details</span>
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vessel Line &amp; Transit Terms
                  </label>
                  <input
                    type="text"
                    value={vesselDetails}
                    onChange={(e) => setVesselDetails(e.target.value)}
                    placeholder="e.g. Line : MAERSK Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Departure Date Note
                  </label>
                  <input
                    type="text"
                    value={departureDateText}
                    onChange={(e) => setDepartureDateText(e.target.value)}
                    placeholder="e.g. 22nd September 2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-700" />
                  <span>Items &amp; Pricing</span>
                </h2>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Row</span>
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-brand-900 text-xs">
                        Item #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Quick pick product dropdown */}
                        <select
                          onChange={(e) => handleSelectProduct(idx, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg text-[11px] bg-white"
                          defaultValue=""
                        >
                          <option value="" disabled>
                            -- Fill from Catalogue --
                          </option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-gray-400 hover:text-rose-600 transition disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-gray-500 font-medium">Item Code</label>
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                          placeholder="e.g. KC"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] text-gray-500 font-medium">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Product Name"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-500 font-medium">Net Weight/Box</label>
                        <input
                          type="text"
                          value={item.netWeightPerBox}
                          onChange={(e) => handleItemChange(idx, 'netWeightPerBox', e.target.value)}
                          placeholder="e.g. 6 nuts / 5.5 kg"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-500 font-medium">Rate / Nut or Kg ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.ratePerNutKg}
                          onChange={(e) => handleItemChange(idx, 'ratePerNutKg', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-500 font-medium">Box Rate ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.boxRate}
                          onChange={(e) => handleItemChange(idx, 'boxRate', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-500 font-medium">Cartons (Qty)</label>
                        <input
                          type="number"
                          value={item.quantityCartons}
                          onChange={(e) => handleItemChange(idx, 'quantityCartons', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="text-right text-xs pt-1 font-bold text-gray-900">
                      Line Total: $ {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Extra Freight / Charge Row */}
              <div className="pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Freight / Additional Charge Description
                    </label>
                    <input
                      type="text"
                      value={freightDescription}
                      onChange={(e) => setFreightDescription(e.target.value)}
                      placeholder="e.g. Free time at destination added cost for Freight"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Freight Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={freightCost}
                      onChange={(e) => setFreightCost(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5">
                Terms &amp; Conditions
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Terms
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 sticky top-20">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-700" />
                <span>Financial Summary</span>
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Cartons:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalCartons)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-gray-900">$ {formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Freight / Destination Cost:</span>
                  <span className="font-semibold text-gray-900">$ {formatCurrency(freightCost)}</span>
                </div>

                <div className="border-t border-gray-100 pt-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Discount ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Tax / VAT ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-brand-800 pt-3 flex justify-between items-center text-sm font-bold">
                  <span className="text-brand-900">Grand Total:</span>
                  <span className="text-brand-800 text-lg font-mono">
                    $ {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 text-accent-gold" />
                  )}
                  <span>Save Quotation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Buyer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 mb-3">Quick Add New Buyer</h3>
            <form onSubmit={handleQuickCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Nuragro FZE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Country / City</label>
                <input
                  type="text"
                  value={newCustCountry}
                  onChange={(e) => setNewCustCountry(e.target.value)}
                  placeholder="e.g. Sharjah, UAE"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="e.g. info@nuragro.ae"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 text-white font-semibold rounded-lg"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
