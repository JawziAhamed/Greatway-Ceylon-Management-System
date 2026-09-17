import axiosClient, { getBackendOrigin } from '../api/axiosClient';

/**
 * Downloads a document PDF cleanly with automatic error detection,
 * delayed blob revocation (preventing Chrome/Edge cancel bug),
 * and automatic printable fallback if cloud Puppeteer is initializing.
 */
export const downloadDocumentPdf = async ({
  docType, // 'invoice' or 'quotation'
  docId,
  docNumber,
  onFallback,
}) => {
  const plural = docType === 'quotation' ? 'quotations' : 'invoices';
  const endpoint = `/${plural}/${docId}/pdf`;

  try {
    const res = await axiosClient.get(endpoint, {
      responseType: 'blob',
    });

    // Check if server returned a JSON error disguised inside a blob
    if (
      res.data.type === 'application/json' ||
      (res.data.size < 600 && res.data.type !== 'application/pdf')
    ) {
      const text = await res.data.text();
      try {
        const json = JSON.parse(text);
        if (!json.success) {
          throw new Error(json.message || 'Server error generating PDF');
        }
      } catch (e) {
        if (!e.message.includes('JSON')) throw e;
      }
    }

    // Success: Create blob and trigger download
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    const safeNumber = (docNumber || 'document').replace(/[/\\?%*:|"<>]/g, '-');
    link.download = `${safeNumber}.pdf`;
    document.body.appendChild(link);
    link.click();

    // Do NOT immediately revoke: give browser download manager 10s to stream the blob
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (e) {}
    }, 10000);

    return { success: true };
  } catch (err) {
    console.warn('Direct PDF binary stream failed:', err.message);

    // If caller provided a modal fallback (e.g. InvoicesPage, QuotationsPage, DashboardPage), use it
    if (typeof onFallback === 'function') {
      onFallback(err);
      return { success: false, fallbackUsed: true };
    }

    // Otherwise, open standalone printable HTML view in a new tab
    try {
      const user = JSON.parse(localStorage.getItem('gw_user') || '{}');
      const token = user.token || '';
      const backendOrigin = getBackendOrigin();
      const htmlUrl = `${backendOrigin}/api/${plural}/${docId}/html?token=${token}`;
      window.open(htmlUrl, '_blank');
      return { success: true, fallbackUsed: 'new_tab' };
    } catch (fallbackErr) {
      console.error('All PDF fallback mechanisms exhausted:', fallbackErr);
      throw err;
    }
  }
};
