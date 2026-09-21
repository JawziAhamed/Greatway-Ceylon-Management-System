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
  CreditCard,
} from 'lucide-react';
import PerformaInvoiceDocument from '../components/documents/PerformaInvoiceDocument';
import { formatCurrency } from '../components/documents/QuotationDocument';
import { INCOTERMS_OPTIONS, getIncotermCode } from '../utils/incoterms';
import axiosClient from '../api/axiosClient';

export default function InvoiceEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useOutletContext();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');

  // Master records
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerId, setCustomerId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');

  // Shipping & Transport State
  const [shipmentReference, setShipmentReference] = useState('SH 226-04');
  const [shippedPer, setShippedPer] = useState('Maersk , Salalah, Oman (CY)');
  const [vessel, setVessel] = useState('MSC PRELUDE V');
  const [voyageNo, setVoyageNo] = useState('IW626R');
  const [containerNo, setContainerNo] = useState('TBC');
  const [sealNumber, setSealNumber] = useState('TBC');
  const [portOfLoading, setPortOfLoading] = useState('DURBAN');
  const [portOfDischarge, setPortOfDischarge] = useState('KHOR AL FAKKAN');
  const [finalDestination, setFinalDestination] = useState('KHOR AL FAKKAN');
  const [etd, setEtd] = useState('29/07/2026');
  const [eta, setEta] = useState('12/08/2026');
  const [stack, setStack] = useState('25/07 to 26/07 06:00 P');
  const [containerSpecification, setContainerSpecification] = useState('1X40 REEFER');
  const [incoterms, setIncoterms] = useState('CIF');

  // Items State
  const [items, setItems] = useState([
    {
      itemCode: 'KC',
      packages: 1900,
      quantityCartons: 1900,
      description: 'King Coconut',
      perBoxWeight: '6 nuts',
      netWeightPerBox: '6 nuts',
      ratePerNutKg: 1.27,
      boxRate: 7.60,
      cifValue: 14440.00,
      lineTotal: 14440.00,
    },
  ]);

  // Financial adjustments
  const [freightDescription, setFreightDescription] = useState('Free time at destination added cost for Freight');
  const [freightCharges, setFreightCharges] = useState(250.00);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  // Terms and Bank
  const [paymentTerms, setPaymentTerms] = useState(
    '50% advance payment on PO, 40% payment upon shipment handover to CMB Port, 10% within 3 days of receiving the shipment at customers warehouse.'
  );
  const [termsAndConditions, setTermsAndConditions] = useState([
    'Damages should be reported within 10 days of the arrival of goods at the destination port (Refer to attachment 01 for general terms and conditions)',
    '*Greatway Ceylon will not accept liability for any damages if,- The goods are not cleared within 48 hours of arrival at the designated port of destination.- The reports of three temperature gauges are not submitted along with the temperature gauges,- The damage report is provided beyond 10 days from the arrival of the shipment.',
    '* Greatway Ceylon will not be responsible for any damage sustained during the voyage, customer handling/ unloading process, or due to the lack of required temperature being maintained and improper cold chain management. No damages shall be accepted if the temperature gauges are not returned to our representatives when the shipment arrives.',
    '*Acceptance of damages shall be at the sole discretion of Greatway Ceylon (Pvt) Ltd.',
    '*Any amount deducted for damages cannot be arbitrarily decided by Nuragro FZE. If any deduction is to be made, it must be decided with the explicit consent of Greatway Ceylon (Pvt) Ltd. Deductions made without such consent shall be considered void and deemed payable to Greatway Ceylon (Pvt) Ltd.',
  ]);
  const [damagePolicy, setDamagePolicy] = useState('');

  const handleAddTerm = () => {
    setTermsAndConditions([...termsAndConditions, '']);
  };

  const handleRemoveTerm = (index) => {
    if (termsAndConditions.length <= 1) return;
    setTermsAndConditions(termsAndConditions.filter((_, i) => i !== index));
  };

  const handleTermChange = (index, value) => {
    const updated = [...termsAndConditions];
    updated[index] = value;
    setTermsAndConditions(updated);
  };
  const [paymentRoutingNote, setPaymentRoutingNote] = useState(
    "Payment should be made to our agent in the UAE, 'Greatway Ceylon Fruits and Vegetables Trading LLC'."
  );
  const [bankDetails, setBankDetails] = useState({
    accountName: 'Greatway Ceylon Fruits And Vegetables Trading L.L.C',
    bankName: 'EMIRATES NBD',
    bankBranch: 'RAS AL KHOR',
    accountNumber: '1025872806402',
    swift: 'EBILAEADXXX',
    iban: 'AE52 0260 0010 2587 2806 402',
    currency: 'USD',
  });

  // Quick Customer Creation modal inline
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCountry, setNewCustCountry] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  useEffect(() => {
    const loadInitData = async () => {
      try {
        setLoading(true);
        const [cRes, pRes] = await Promise.all([
          axiosClient.get('/customers'),
          axiosClient.get('/products'),
        ]);
        if (cRes.data.success) setCustomers(cRes.data.data);
        if (pRes.data.success) setProducts(pRes.data.data);

        if (isEditMode) {
          const invRes = await axiosClient.get(`/invoices/${id}`);
          if (invRes.data.success) {
            const inv = invRes.data.data;
            setInvoiceNumber(inv.invoiceNumber);
            setInvoiceDate(
              inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : ''
            );
            setCustomerId(inv.customer?._id || inv.customer || '');
            setCurrency(inv.currency || 'USD');
            setStatus(inv.status || 'Draft');
            setNotes(inv.notes || '');
            setShipmentReference(inv.shipmentReference || '');
            setShippedPer(inv.shippedPer || '');
            setVessel(inv.vessel || inv.shippedPer || 'MSC PRELUDE V');
            setVoyageNo(inv.voyageNo || 'IW626R');
            setContainerNo(inv.containerNo || inv.containerSpecification || 'TBC');
            setSealNumber(inv.sealNumber || 'TBC');
            setPortOfLoading(inv.portOfLoading || 'DURBAN');
            setPortOfDischarge(inv.portOfDischarge || 'KHOR AL FAKKAN');
            setFinalDestination(inv.finalDestination || inv.portOfDischarge || 'KHOR AL FAKKAN');
            setEtd(inv.etd || '29/07/2026');
            setEta(inv.eta || '12/08/2026');
            setStack(inv.stack || '25/07 to 26/07 06:00 P');
            setContainerSpecification(inv.containerSpecification || '');
            setIncoterms(inv.incoterms || 'CIF');
            setItems(inv.items || []);
            setFreightDescription(inv.freightDescription || '');
            setFreightCharges(inv.freightCharges || 0);
            setOtherCharges(inv.otherCharges || 0);
            setDiscount(inv.discount || 0);
            setTax(inv.tax || 0);
            setPaymentTerms(inv.paymentTerms || '');
            setDamagePolicy(inv.damagePolicy || '');
            if (inv.termsAndConditions && inv.termsAndConditions.length > 0) {
              setTermsAndConditions(inv.termsAndConditions);
            } else if (inv.damagePolicy) {
              setTermsAndConditions(inv.damagePolicy.split('\n').filter((l) => l.trim()));
            }
            setPaymentRoutingNote(inv.paymentRoutingNote || '');
            if (inv.bankDetails) setBankDetails(inv.bankDetails);
          }
        } else {
          // Get next number
          const numRes = await axiosClient.get('/invoices/next-number');
          if (numRes.data.success) {
            setInvoiceNumber(numRes.data.nextNumber);
          }
          if (settings?.invoiceSettings) {
            setPortOfLoading(settings.invoiceSettings.defaultPortOfLoading || 'COLOMBO PORT SRI LANKA');
            setPaymentTerms(settings.invoiceSettings.defaultPaymentTerms || paymentTerms);
            setDamagePolicy(settings.invoiceSettings.defaultDamagePolicy || damagePolicy);
          }
          if (settings?.bankDetails?.length > 0) {
            const defBank = settings.bankDetails.find((b) => b.isDefault) || settings.bankDetails[0];
            setBankDetails(defBank);
          }
          if (cRes.data.data.length > 0) {
            setCustomerId(cRes.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading invoice editor data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitData();
  }, [id, isEditMode, settings]);

  // Calculations
  const totalPackages = items.reduce((sum, item) => sum + (Number(item.packages) || 0), 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.cifValue) || 0), 0);
  const subtotal = Number(
    (itemsSubtotal + (Number(freightCharges) || 0) + (Number(otherCharges) || 0)).toFixed(2)
  );
  const grandTotal = Number((subtotal - (Number(discount) || 0) + (Number(tax) || 0)).toFixed(2));

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const row = { ...updated[index], [field]: value };

    if (field === 'packages' || field === 'quantityCartons') {
      row.packages = value;
      row.quantityCartons = value;
      const pkgs = value === '' ? 0 : (Number(value) || 0);
      const rate = Number(row.boxRate) || 0;
      row.cifValue = Number((pkgs * rate).toFixed(2));
      row.lineTotal = row.cifValue;
    } else if (field === 'boxRate') {
      row.boxRate = value;
      const rate = value === '' ? 0 : (Number(value) || 0);
      const pkgs = Number(row.packages !== undefined ? row.packages : row.quantityCartons) || 0;
      row.cifValue = Number((pkgs * rate).toFixed(2));
      row.lineTotal = row.cifValue;
    } else if (field === 'ratePerNutKg') {
      row.ratePerNutKg = value;
    } else if (field === 'perBoxWeight' || field === 'netWeightPerBox') {
      row.perBoxWeight = value;
      row.netWeightPerBox = value;
    }

    updated[index] = row;
    setItems(updated);
  };

  const handleSelectProduct = (index, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    if (!prod) return;

    const updated = [...items];
    const pkgs = Number(updated[index].packages !== undefined ? updated[index].packages : updated[index].quantityCartons) || 100;
    const boxRate = prod.defaultBoxRate || 0;

    updated[index] = {
      ...updated[index],
      itemCode: prod.code || '',
      description: prod.name,
      perBoxWeight: prod.defaultWeightPerBox || '',
      netWeightPerBox: prod.defaultWeightPerBox || '',
      ratePerNutKg: prod.defaultRatePerNutKg || 0,
      boxRate: boxRate,
      packages: pkgs,
      quantityCartons: pkgs,
      cifValue: Number((pkgs * boxRate).toFixed(2)),
      lineTotal: Number((pkgs * boxRate).toFixed(2)),
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        itemCode: '',
        packages: 100,
        quantityCartons: 100,
        description: '',
        perBoxWeight: '5.5 kg',
        netWeightPerBox: '5.5 kg',
        ratePerNutKg: 0,
        boxRate: 0,
        cifValue: 0,
        lineTotal: 0,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSelectBankPreset = (bankIndex) => {
    if (settings?.bankDetails?.[bankIndex]) {
      const b = settings.bankDetails[bankIndex];
      setBankDetails({
        accountName: b.accountName,
        bankName: b.bankName,
        bankBranch: b.bankBranch,
        accountNumber: b.accountNumber,
        swift: b.swift,
        iban: b.iban,
        currency: b.currency || currency,
      });
      if (b.paymentNote) {
        setPaymentRoutingNote(b.paymentNote);
      }
    }
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
      alert('Please select a customer for this performa invoice.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        invoiceNumber,
        invoiceDate,
        customerId,
        currency,
        status,
        notes,
        shipmentReference,
        shippedPer,
        vessel,
        voyageNo,
        containerNo,
        sealNumber,
        portOfLoading,
        portOfDischarge,
        finalDestination,
        etd,
        eta,
        stack,
        containerSpecification,
        incoterms: getIncotermCode(incoterms),
        items: items.map((it) => ({
          ...it,
          quantityCartons: it.quantityCartons === '' ? 0 : Number(it.quantityCartons) || 0,
          packages: it.packages === '' ? 0 : Number(it.packages) || 0,
          ratePerNutKg: it.ratePerNutKg === '' ? 0 : Number(it.ratePerNutKg) || 0,
          boxRate: it.boxRate === '' ? 0 : Number(it.boxRate) || 0,
          lineTotal: it.lineTotal === '' ? 0 : Number(it.lineTotal) || 0,
          cifValue: it.cifValue === '' ? 0 : Number(it.cifValue) || 0,
        })),
        freightDescription,
        freightCharges: Number(freightCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paymentTerms,
        damagePolicy: termsAndConditions.join('\n'),
        termsAndConditions,
        paymentRoutingNote,
        bankDetails,
      };

      let res;
      if (isEditMode) {
        res = await axiosClient.put(`/invoices/${id}`, payload);
      } else {
        res = await axiosClient.post('/invoices', payload);
      }

      if (res.data.success) {
        if (redirectBack) {
          navigate('/invoices');
        } else {
          setActiveTab('preview');
        }
      }
    } catch (err) {
      alert('Failed to save invoice: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Draft object for live preview
  const selectedCustomerObj = customers.find((c) => c._id === customerId);
  const previewDraftDoc = {
    invoiceNumber,
    invoiceDate,
    buyerSnapshot: selectedCustomerObj || { companyName: 'Select Customer' },
    currency,
    shipmentReference,
    shippedPer,
    vessel,
    voyageNo,
    containerNo,
    sealNumber,
    portOfLoading,
    portOfDischarge,
    finalDestination,
    etd,
    eta,
    stack,
    containerSpecification,
    incoterms,
    items,
    freightDescription,
    freightCharges: Number(freightCharges) || 0,
    subtotal,
    discount: Number(discount) || 0,
    tax: Number(tax) || 0,
    grandTotal,
    paymentTerms,
    damagePolicy: termsAndConditions.join('\n'),
    termsAndConditions,
    paymentRoutingNote,
    bankDetails,
    status,
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center gap-2 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-800" />
        <span>Loading Performa Invoice details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isEditMode ? `Edit Performa Invoice: ${invoiceNumber}` : 'Create New Performa Invoice'}
            </h1>
            <p className="text-xs text-gray-500">
              Official export invoice with complete shipping and bank routing information.
            </p>
          </div>
        </div>

        {/* Tab & Save Buttons */}
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
            <span>Save Invoice</span>
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className="bg-gray-100 p-6 rounded-2xl">
          <div className="mb-4 flex justify-between items-center max-w-[820px] mx-auto">
            <span className="text-xs text-gray-500 font-medium">
              Prototype Performa Invoice preview:
            </span>
            <button
              onClick={() => {
                const originalTitle = window.document.title;
                window.document.title = invoiceNumber || 'Performa-Invoice';
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
          <PerformaInvoiceDocument invoice={previewDraftDoc} settings={settings} />
        </div>
      ) : (
        /* Form Editor */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Building2 className="w-4 h-4 text-brand-700" />
                <span>Buyer &amp; Invoice Details</span>
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
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-semibold text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    PI Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
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
                    Shipment Reference
                  </label>
                  <input
                    type="text"
                    value={shipmentReference}
                    onChange={(e) => setShipmentReference(e.target.value)}
                    placeholder="e.g. SH 226-04"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Invoice Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Issued">Issued</option>
                    <option value="Sent">Sent</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping & Transport Grid */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Ship className="w-4 h-4 text-brand-700" />
                <span>Shipping &amp; Vessel Ports</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vessel
                  </label>
                  <input
                    type="text"
                    value={vessel}
                    onChange={(e) => setVessel(e.target.value)}
                    placeholder="e.g. MSC PRELUDE V"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Voyage Number
                  </label>
                  <input
                    type="text"
                    value={voyageNo}
                    onChange={(e) => setVoyageNo(e.target.value)}
                    placeholder="e.g. IW626R"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Container No
                  </label>
                  <input
                    type="text"
                    value={containerNo}
                    onChange={(e) => setContainerNo(e.target.value)}
                    placeholder="e.g. TBC or 1X40 REEFER"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Seal Number
                  </label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    placeholder="e.g. TBC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    POL (Port of Loading)
                  </label>
                  <input
                    type="text"
                    value={portOfLoading}
                    onChange={(e) => setPortOfLoading(e.target.value)}
                    placeholder="e.g. DURBAN or COLOMBO PORT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    POD (Port of Discharge)
                  </label>
                  <input
                    type="text"
                    value={portOfDischarge}
                    onChange={(e) => setPortOfDischarge(e.target.value)}
                    placeholder="e.g. KHOR AL FAKKAN or Salalah, Oman"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Final Destination
                  </label>
                  <input
                    type="text"
                    value={finalDestination}
                    onChange={(e) => setFinalDestination(e.target.value)}
                    placeholder="e.g. KHOR AL FAKKAN"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ETD
                  </label>
                  <input
                    type="text"
                    value={etd}
                    onChange={(e) => setEtd(e.target.value)}
                    placeholder="e.g. 29/07/2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ETA
                  </label>
                  <input
                    type="text"
                    value={eta}
                    onChange={(e) => setEta(e.target.value)}
                    placeholder="e.g. 12/08/2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stack
                  </label>
                  <input
                    type="text"
                    value={stack}
                    onChange={(e) => setStack(e.target.value)}
                    placeholder="e.g. 25/07 to 26/07 06:00 P"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
                  />
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
                    Container Specification
                  </label>
                  <input
                    type="text"
                    value={containerSpecification}
                    onChange={(e) => setContainerSpecification(e.target.value)}
                    placeholder="e.g. 1X40 REEFER"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Items Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-700" />
                  <span>Items &amp; {getIncotermCode(incoterms)} Valuation</span>
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
                              {p.name}
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
                          value={item.itemCode || ''}
                          onChange={(e) => handleItemChange(idx, 'itemCode', e.target.value)}
                          placeholder="e.g. KC"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-gray-500 font-medium">Quantity Cartons</label>
                        <input
                          type="number"
                          value={item.quantityCartons !== undefined ? item.quantityCartons : (item.packages !== undefined ? item.packages : '')}
                          onChange={(e) => handleItemChange(idx, 'quantityCartons', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.target.select()}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-500 font-medium">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="King Coconut"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-medium"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-gray-500 font-medium">Net Weight/Box</label>
                        <input
                          type="text"
                          value={item.perBoxWeight || item.netWeightPerBox || ''}
                          onChange={(e) => handleItemChange(idx, 'perBoxWeight', e.target.value)}
                          placeholder="6 nuts / 5.5 kg"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="text-[10px] text-gray-500 font-medium">Rate/Nut/Kg ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.ratePerNutKg !== undefined ? item.ratePerNutKg : ''}
                          onChange={(e) => handleItemChange(idx, 'ratePerNutKg', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.target.select()}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-gray-500 font-medium">Box Rate ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.boxRate !== undefined ? item.boxRate : ''}
                          onChange={(e) => handleItemChange(idx, 'boxRate', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.target.select()}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-4 text-right flex flex-col justify-end">
                        <div className="text-[10px] text-gray-500">{getIncotermCode(incoterms)} Value:</div>
                        <div className="text-sm font-bold text-gray-900">
                          $ {formatCurrency(item.cifValue !== undefined ? item.cifValue : item.lineTotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Freight Add-on */}
              <div className="pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Freight Description
                    </label>
                    <input
                      type="text"
                      value={freightDescription}
                      onChange={(e) => setFreightDescription(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Freight Cost ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={freightCharges !== undefined ? freightCharges : ''}
                      onChange={(e) => setFreightCharges(e.target.value === '' ? '' : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.target.select()}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Bank routing */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-700" />
                <span>Payment Terms &amp; Bank Details</span>
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

                {/* Terms & Conditions (Points-wise) */}
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-gray-800">
                      Terms &amp; Conditions (Points-wise)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddTerm}
                      className="inline-flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Point</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Add terms and conditions point-by-point. Each point appears on its own line in the document.
                  </p>
                  <div className="space-y-2">
                    {termsAndConditions.map((term, tIdx) => (
                      <div key={tIdx} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-gray-400 mt-2 w-5 text-right shrink-0">
                          {tIdx + 1}.
                        </span>
                        <textarea
                          rows={2}
                          value={term}
                          onChange={(e) => handleTermChange(tIdx, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder={`Point ${tIdx + 1}...`}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-xl text-xs focus:ring-1 focus:ring-brand-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(tIdx)}
                          disabled={termsAndConditions.length <= 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 mt-1"
                          title="Remove Point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Details Selector */}
                {settings?.bankDetails?.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fill from Company Bank Accounts
                    </label>
                    <select
                      onChange={(e) => handleSelectBankPreset(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>-- Select Bank Profile --</option>
                      {settings.bankDetails.map((b, i) => (
                        <option key={i} value={i}>
                          {b.bankName} - {b.accountNumber} ({b.accountName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="font-semibold text-gray-800">Assigned Bank Account Info:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-500 text-[10px]">Account Name:</span>
                      <input
                        type="text"
                        value={bankDetails.accountName || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px]">Bank Name:</span>
                      <input
                        type="text"
                        value={bankDetails.bankName || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px]">Account Number:</span>
                      <input
                        type="text"
                        value={bankDetails.accountNumber || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px]">SWIFT Code:</span>
                      <input
                        type="text"
                        value={bankDetails.swift || ''}
                        onChange={(e) => setBankDetails({ ...bankDetails, swift: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Financial Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 sticky top-20">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2.5 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-brand-700" />
                <span>Invoice Valuation</span>
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Total Packages:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalPackages)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Items {getIncotermCode(incoterms)} Total:</span>
                  <span className="font-semibold text-gray-900">$ {formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Freight / Extra Cost:</span>
                  <span className="font-semibold text-gray-900">$ {formatCurrency(freightCharges)}</span>
                </div>

                <div className="border-t border-gray-100 pt-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Discount ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={discount !== undefined ? discount : ''}
                      onChange={(e) => setDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.target.select()}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-600">Tax / VAT ($):</span>
                    <input
                      type="number"
                      step="0.01"
                      value={tax !== undefined ? tax : ''}
                      onChange={(e) => setTax(e.target.value === '' ? '' : Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => e.target.select()}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs"
                    />
                  </div>
                </div>

                <div className="border-t-2 border-brand-800 pt-3 flex justify-between items-center text-sm font-bold">
                  <span className="text-brand-900">Total Invoice Value:</span>
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
                  <span>Save Performa Invoice</span>
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
