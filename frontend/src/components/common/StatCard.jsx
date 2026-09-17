import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'brand',
}) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-800 border-brand-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const iconBgMap = {
    brand: 'bg-brand-800 text-white',
    blue: 'bg-blue-600 text-white',
    green: 'bg-emerald-600 text-white',
    amber: 'bg-amber-600 text-white',
    purple: 'bg-purple-600 text-white',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shadow-sm ${iconBgMap[color] || iconBgMap.brand}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
