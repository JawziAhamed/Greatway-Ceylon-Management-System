import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Package,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Tag,
} from 'lucide-react';
import { formatCurrency } from '../components/documents/QuotationDocument';
import axiosClient from '../api/axiosClient';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fresh Fruits');
  const [unit, setUnit] = useState('Cartons');
  const [defaultWeightPerBox, setDefaultWeightPerBox] = useState('5.5 kg');
  const [defaultRatePerNutKg, setDefaultRatePerNutKg] = useState(0);
  const [defaultBoxRate, setDefaultBoxRate] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [active, setActive] = useState(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/products');
      if (res.data && res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setCode('');
    setDescription('');
    setCategory('Fresh Fruits');
    setUnit('Cartons');
    setDefaultWeightPerBox('5.5 kg');
    setDefaultRatePerNutKg(0);
    setDefaultBoxRate(0);
    setCurrency('USD');
    setActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setName(p.name || '');
    setCode(p.code || '');
    setDescription(p.description || '');
    setCategory(p.category || 'Fresh Fruits');
    setUnit(p.unit || 'Cartons');
    setDefaultWeightPerBox(p.defaultWeightPerBox || '5.5 kg');
    setDefaultRatePerNutKg(p.defaultRatePerNutKg || 0);
    setDefaultBoxRate(p.defaultBoxRate || 0);
    setCurrency(p.currency || 'USD');
    setActive(p.active !== false);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      setSaving(true);
      const payload = {
        name,
        code: code.toUpperCase(),
        description,
        category,
        unit,
        defaultWeightPerBox,
        defaultRatePerNutKg: Number(defaultRatePerNutKg),
        defaultBoxRate: Number(defaultBoxRate),
        currency,
        active,
      };

      if (editingProduct) {
        await axiosClient.put(`/products/${editingProduct._id}`, payload);
      } else {
        await axiosClient.post('/products', payload);
      }

      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert('Failed to save product: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id, pName) => {
    if (!window.confirm(`Delete product "${pName}" from catalogue?`)) return;
    try {
      await axiosClient.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  const categories = [
    'All',
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const filtered = products.filter((p) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(s) ||
      (p.code || '').toLowerCase().includes(s) ||
      (p.description || '').toLowerCase().includes(s);
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Management</h1>
          <p className="text-xs text-gray-500">
            Export produce catalogue, packaging standards, and default unit rates
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-accent-gold" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product code or name..."
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-700 w-full"
            />
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Packaging / Weight</th>
                <th className="py-3 px-4 text-right">Rate/Nut or Kg</th>
                <th className="py-3 px-4 text-right">Box Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500">
                    No products found in catalogue.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-bold text-gray-900 font-mono">
                      {p.code || '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div>{p.name}</div>
                      {p.description && (
                        <div className="text-[11px] text-gray-500 font-normal">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-800 border border-brand-200">
                        <Tag className="w-3 h-3 text-brand-600" />
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {p.defaultWeightPerBox || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-700">
                      $ {formatCurrency(p.defaultRatePerNutKg)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                      $ {formatCurrency(p.defaultBoxRate)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-gray-500">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product"
                          className="p-1.5 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p._id, p.name)}
                          title="Delete Product"
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

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-700" />
              <span>{editingProduct ? 'Edit Product' : 'Add New Product'}</span>
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. King Coconut"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Item Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. KC"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Export Grade Fresh King Coconut"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Fresh Fruits">Fresh Fruits</option>
                    <option value="Fresh Vegetables">Fresh Vegetables</option>
                    <option value="Roots & Tubers">Roots &amp; Tubers</option>
                    <option value="Spices">Spices</option>
                    <option value="Other Export Goods">Other Export Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Net Weight / Packaging
                  </label>
                  <input
                    type="text"
                    value={defaultWeightPerBox}
                    onChange={(e) => setDefaultWeightPerBox(e.target.value)}
                    placeholder="e.g. 6 nuts or 5.5 kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Rate per Nut / Kg ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultRatePerNutKg}
                    onChange={(e) => setDefaultRatePerNutKg(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Default Box Rate ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={defaultBoxRate}
                    onChange={(e) => setDefaultBoxRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-brand-800 focus:ring-brand-700 h-4 w-4"
                />
                <label htmlFor="prodActive" className="text-xs font-medium text-gray-700">
                  Active in Catalogue
                </label>
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
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
