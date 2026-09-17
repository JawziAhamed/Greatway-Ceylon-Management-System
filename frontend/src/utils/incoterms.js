export const INCOTERMS_OPTIONS = [
  { code: 'EXW', label: 'EXW — Ex Works' },
  { code: 'FCA', label: 'FCA — Free Carrier' },
  { code: 'FOB', label: 'FOB — Free On Board' },
  { code: 'CFR', label: 'CFR — Cost and Freight' },
  { code: 'CIF', label: 'CIF — Cost, Insurance and Freight' },
  { code: 'CPT', label: 'CPT — Carriage Paid To' },
  { code: 'DAP', label: 'DAP — Delivered at Place' },
  { code: 'DDP', label: 'DDP — Delivered Duty Paid' },
];

export const getIncotermCode = (val) => {
  if (!val) return 'CIF';
  const str = String(val).trim();
  if (str.includes('—')) return str.split('—')[0].trim().toUpperCase();
  if (str.includes('-')) return str.split('-')[0].trim().toUpperCase();
  const firstWord = str.split(' ')[0].trim().toUpperCase();
  return firstWord || 'CIF';
};

export const cleanNamedPlace = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  // Strip container yard / shipping terms in parentheses like (CY), (CY/CY), (CFS), etc.
  str = str.replace(/\s*\([A-Z\s/]+\)\s*$/i, '').trim();
  // Strip trailing commas, colons or hyphens
  str = str.replace(/[,:-\s]+$/, '').trim();
  return str;
};

export const formatIncotermDisplay = (incoterm, destinationPort, loadingPort) => {
  const code = getIncotermCode(incoterm || 'CIF');
  const rawPlace = (destinationPort || loadingPort || '').trim();
  const namedPlace = cleanNamedPlace(rawPlace);
  if (namedPlace) {
    return `${code} ${namedPlace} — Incoterms®\u00A02020`;
  }
  return `${code} — Incoterms®\u00A02020`;
};

