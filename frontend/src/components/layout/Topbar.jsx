import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, FileSpreadsheet, FileCheck2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMenuClick, title }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-gray-200 h-16 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          {title || 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/quotations/new')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-brand-700" />
          <span>New Quotation</span>
        </button>

        <button
          onClick={() => navigate('/invoices/new')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-accent-gold" />
          <span>New Performa Invoice</span>
        </button>
      </div>
    </header>
  );
}
