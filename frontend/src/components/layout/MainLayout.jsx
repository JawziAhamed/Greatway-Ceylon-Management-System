import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import axiosClient from '../../api/axiosClient';

const routeTitles = {
  '/': 'Overview & Recent Documents',
  '/quotations': 'Quotation Management',
  '/quotations/new': 'Create New Quotation',
  '/invoices': 'Performa Invoice Management',
  '/invoices/new': 'Create New Performa Invoice',
  '/customers': 'Customer Management',
  '/products': 'Export Product Catalogue',
  '/settings': 'Company & Document Settings',
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get('/settings');
        if (res.data && res.data.success) {
          setSettings(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load settings in layout:', err);
      }
    };
    fetchSettings();
  }, []);

  const getTitle = () => {
    const path = location.pathname;
    if (routeTitles[path]) return routeTitles[path];
    if (path.startsWith('/quotations/') && path.endsWith('/edit')) return 'Edit Quotation';
    if (path.startsWith('/invoices/') && path.endsWith('/edit')) return 'Edit Performa Invoice';
    if (path.startsWith('/customers/')) return 'Customer History & Statement';
    return 'Greatway Ceylon';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title={getTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ settings, setSettings }} />
        </main>
      </div>
    </div>
  );
}
