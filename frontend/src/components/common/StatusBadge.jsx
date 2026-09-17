import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const statusConfig = {
  // Quotation statuses
  Draft: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  Sent: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Expired: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },

  // Performa Invoice statuses
  Issued: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Partially Paid': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  Paid: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
  Cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function StatusBadge({
  status,
  options,
  onStatusChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = (options?.length || 5) * 32 + 40;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;

    const width = 150;
    let left = rect.left + rect.width / 2 - width / 2;
    if (left < 10) left = 10;
    if (left + width > window.innerWidth - 10) left = window.innerWidth - width - 10;

    setCoords({
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left,
    });
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!open) {
      updatePosition();
    }
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const config = statusConfig[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  if (!options || !onStatusChange || disabled) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
        {status}
      </span>
    );
  }

  return (
    <div className="inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        title="Click to change status"
        className={`group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} hover:opacity-80 transition cursor-pointer shadow-sm`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-0.5 opacity-70"></span>
        <span>{status}</span>
        <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition" />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: '150px',
              zIndex: 99999,
            }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 py-1 text-xs select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 tracking-wider">
              Change Status
            </div>
            <div className="py-1">
              {options.map((opt) => {
                const isCurrent = opt === status;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen(false);
                      if (opt !== status) onStatusChange(opt);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-gray-100 transition cursor-pointer ${
                      isCurrent
                        ? 'font-bold text-brand-900 bg-brand-50/70'
                        : 'text-gray-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-700"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
