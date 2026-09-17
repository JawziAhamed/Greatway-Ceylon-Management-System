import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  Users,
  Package,
  Settings,
  LogOut,
  Lock,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import iconImg from '../../assets/icon.jpg';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, lockSession, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/quotations', label: 'Quotations', icon: FileSpreadsheet },
    { to: '/invoices', label: 'Performa Invoices', icon: FileCheck2 },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/settings', label: 'Company Settings', icon: Settings, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-brand-950 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Company Header */}
        <div className="p-5 border-b border-brand-900 bg-brand-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 flex items-center justify-center shrink-0 shadow">
              <img src={iconImg} alt="Greatway Emblem" className="w-full h-full object-contain" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-sm tracking-wide text-white truncate">
                GREATWAY CEYLON
              </h1>
              <p className="text-[11px] text-brand-300 truncate">
                Sales Documents
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-800 text-white font-semibold shadow-inner'
                      : 'text-brand-100/80 hover:bg-brand-900 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0 opacity-80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-brand-900 bg-brand-900/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.name}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-brand-300 capitalize">
                  <ShieldCheck className="w-3 h-3 text-accent-gold" />
                  {user?.role}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={lockSession}
                title="Lock Session Now"
                className="p-1.5 text-brand-300 hover:text-amber-300 hover:bg-brand-800 rounded-lg transition"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-brand-300 hover:text-white hover:bg-brand-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
