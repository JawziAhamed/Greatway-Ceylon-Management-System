import React from 'react';
import logoImg from '../../assets/logo.png';
import { formatCurrency, formatDate } from './QuotationDocument';
import { resolveMediaUrl } from '../../api/axiosClient';
import { formatIncotermDisplay, getIncotermCode } from '../../utils/incoterms';

const getItemCode = (item) => {
  if (item.itemCode) return item.itemCode;
  if (item.code) return item.code;
  if (item.name && item.name.length <= 6 && !item.name.includes(' ')) return item.name;
  const desc = (item.description || '').toLowerCase();
  if (desc.includes('king coconut')) return 'KC';
  if (desc.includes('red lady papaya') || desc.includes('red papaya')) return 'RP';
  if (desc.includes('curry papaya') || desc.includes('green papaya')) return 'CP/GP';
  if (desc.includes('tapioca') || desc.includes('kappa')) return 'Kappa';
  if (desc.includes('cavendish banana') || desc.includes('banana')) return 'CB';
  if (desc.includes('pineapple')) return 'PA';
  if (desc.includes('guava')) return 'GV';
  if (desc.includes('soursop')) return 'SS';
  if (desc.includes('passion fruit')) return 'PF';
  return '';
};

const getCurrencySymbol = (curr) => {
  if (curr === 'EUR') return '€';
  if (curr === 'GBP') return '£';
  if (curr === 'AED') return 'AED';
  if (curr === 'LKR') return 'Rs';
  return '$';
};

export default function PerformaInvoiceDocument({ invoice, settings = {} }) {
  if (!invoice) return null;

  const safeSettings = settings || {};
  const buyer = invoice.buyerSnapshot || (typeof invoice.customer === 'object' ? invoice.customer : null) || {};
  const companyName = safeSettings.companyName || 'GREATWAY CEYLON (PVT) LTD';
  const companyAddress = safeSettings.address || 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300';
  const email = safeSettings.email || 'info@greatwayceylon.com';
  const taxNo = safeSettings.taxNumber || '103406048 - 7000';
  const bank = invoice.bankDetails || {};
  const currSym = getCurrencySymbol(invoice.currency);
  const totalCartons =
    invoice.totalCartons ||
    (invoice.items || []).reduce(
      (sum, it) =>
        sum + (Number(it.quantityCartons !== undefined ? it.quantityCartons : it.packages) || 0),
      0
    );

  return (
    <div className="bg-white text-gray-900 p-8 max-w-[820px] mx-auto text-[11px] leading-relaxed shadow-md print:shadow-none print:p-0 print:max-w-none">
      {/* Outer Enclosing Frame matching the prototype */}
      <div className="border-[1.5px] border-black p-4">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3">
          <div className="w-5/12">
            <img
              src={resolveMediaUrl(safeSettings.logoUrl) || logoImg}
              alt="Greatway Ceylon"
              className="max-h-16 max-w-[240px] object-contain"
            />
          </div>
          <div className="w-7/12 text-right">
            <h2 className="text-[#237837] font-bold text-sm leading-tight">
              {companyName}
            </h2>
            <div className="text-[10.5px] text-gray-800 leading-snug mt-1">
              {companyAddress}
              <br />
              Email: {email}
              <br />
              TAX No: {taxNo}
            </div>
          </div>
        </div>

        {/* Proforma Invoice Banner */}
        <div className="bg-[#dbe8d8] border-[1.5px] border-black py-1.5 px-3 text-center mb-0">
          <h1 className="text-black text-xs font-bold tracking-wider">
            PROFORMA INVOICE
          </h1>
        </div>

        {/* Customer & PI Details Meta Grid */}
        <div className="border-x-[1.5px] border-b-[1.5px] border-black">
          <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
            {/* Customer Details Box */}
            <div className="p-2.5">
              <div className="font-bold underline text-[10.5px] mb-1">
                CUSTOMERS DETAILS:
              </div>
              <div className="font-bold text-[11px]">
                {buyer.companyName || 'N/A'}
              </div>
              {buyer.address && (
                <div className="whitespace-pre-line text-[10.5px] text-gray-800">
                  {buyer.address}
                </div>
              )}
              {buyer.country && (
                <div className="text-[10.5px] text-gray-800">{buyer.country}</div>
              )}
            </div>

            {/* PI Details Box */}
            <div className="p-2.5 space-y-1 text-[10.5px]">
              <div className="flex items-start">
                <span className="font-bold w-[138px] shrink-0 whitespace-nowrap">PI NO:</span>
                <span className="font-bold flex-1 min-w-0">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold w-[138px] shrink-0 whitespace-nowrap">PI DATE:</span>
                <span className="flex-1 min-w-0">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold w-[138px] shrink-0 whitespace-nowrap">PAYMENT TERMS:</span>
                <span className="text-[10px] leading-snug flex-1 min-w-0">{invoice.paymentTerms}</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold w-[138px] shrink-0 whitespace-nowrap">SHIPMENT REFERENCE:</span>
                <span className="flex-1 min-w-0">{invoice.shipmentReference}</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold w-[138px] shrink-0 whitespace-nowrap">INCOTERMS:</span>
                <span className="font-bold text-gray-900 flex-1 min-w-0 leading-tight">
                  {formatIncotermDisplay(invoice.incoterms, invoice.portOfDischarge, invoice.portOfLoading)}
                </span>
              </div>
              {invoice.status && (
                <div className="flex items-center">
                  <span className="font-bold w-[138px] shrink-0 whitespace-nowrap">STATUS:</span>
                  <span className="font-bold uppercase text-[10px] tracking-wider text-[#237837] flex-1 min-w-0">
                    {invoice.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipped Per & Voyage No Row */}
          <div className="grid grid-cols-2 divide-x divide-black border-b border-black text-[10.5px]">
            <div className="p-2">
              <strong>SHIPPED PER</strong> : {invoice.shippedPer || 'Maersk , Salalah, Oman (CY)'}
            </div>
            <div className="p-2">
              <strong>VOYAGE NO.</strong> : {invoice.voyageNo || 'OEL VARUN 639N'}
            </div>
          </div>

          {/* Port of Loading & Discharge Row */}
          <div className="grid grid-cols-2 divide-x divide-black text-[10.5px]">
            <div className="p-2">
              <div className="font-bold underline mb-0.5">PORT OF LOADING</div>
              <div>{invoice.portOfLoading || 'COLOMBO PORT SRI LANKA'}</div>
            </div>
            <div className="p-2">
              <div className="font-bold underline mb-0.5">PORT OF DISCHARGE</div>
              <div>{invoice.portOfDischarge || 'Salalah, Oman (CY)'}</div>
            </div>
          </div>

          {invoice.containerSpecification && (
            <div className="border-t border-black p-2 text-[10.5px]">
              <strong>CONTAINER SPECIFICATION</strong> : {invoice.containerSpecification}
            </div>
          )}
        </div>

        {/* Items Table matching Quotation view */}
        <table className="w-full border-collapse my-2 text-[10.5px]">
          <thead>
            <tr className="bg-[#14663e] text-white">
              <th className="border border-[#14663e] py-1.5 px-1 text-center w-7 font-bold">#</th>
              <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-16 font-bold">ITEM NAME</th>
              <th className="border border-[#14663e] py-1.5 px-2 text-center font-bold">DESCRIPTION</th>
              <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-24 font-bold">Net Weight Per Box</th>
              <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-24 font-bold leading-tight">
                Rate per Nut/ Kg in {invoice.currency || 'USD'}
              </th>
              <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-20 font-bold leading-tight">
                Per Box Rate ({invoice.currency || 'USD'})
              </th>
              <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-20 font-bold leading-tight">
                Quantity Cartons
              </th>
              <th className="border border-[#14663e] py-1.5 px-2 text-center w-24 font-bold leading-tight">
                Total Amount ({invoice.currency || 'USD'})
              </th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50">
                <td className="border border-gray-400 py-1 px-1 text-center font-normal">{idx + 1}</td>
                <td className="border border-gray-400 py-1 px-1.5 text-center font-normal">
                  {getItemCode(item)}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-left font-normal">{item.description}</td>
                <td className="border border-gray-400 py-1 px-1.5 text-center font-normal">
                  {item.netWeightPerBox || item.perBoxWeight || ''}
                </td>
                <td className="border border-gray-400 py-1 px-1.5 text-right font-normal">
                  {currSym} {formatCurrency(item.ratePerNutKg)}
                </td>
                <td className="border border-gray-400 py-1 px-1.5 text-right font-normal">
                  {currSym} {formatCurrency(item.boxRate)}
                </td>
                <td className="border border-gray-400 py-1 px-1.5 text-right font-normal">
                  {formatCurrency(item.quantityCartons !== undefined ? item.quantityCartons : item.packages)}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-normal">
                  {currSym} {formatCurrency(item.lineTotal !== undefined ? item.lineTotal : item.cifValue)}
                </td>
              </tr>
            ))}

            {(Number(invoice.freightCharges || 0) > 0 || Number(invoice.freightCost || 0) > 0) && (
              <tr>
                <td colSpan={7} className="border border-gray-400 py-1 px-2 text-left italic text-gray-700">
                  {invoice.freightDescription || 'Free time at destination added cost for Freight'}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-normal">
                  {currSym} {formatCurrency(invoice.freightCharges || invoice.freightCost)}
                </td>
              </tr>
            )}

            <tr className="font-bold bg-white">
              <td className="border border-gray-400 py-1.5 px-1"></td>
              <td className="border border-gray-400 py-1.5 px-1.5 text-left font-bold">Total</td>
              <td className="border border-gray-400 py-1.5 px-2"></td>
              <td className="border border-gray-400 py-1.5 px-1.5"></td>
              <td className="border border-gray-400 py-1.5 px-1.5"></td>
              <td className="border border-gray-400 py-1.5 px-1.5"></td>
              <td className="border border-gray-400 py-1.5 px-1.5 text-right font-bold">
                {formatCurrency(totalCartons)}
              </td>
              <td className="border border-gray-400 py-1.5 px-2 text-right font-bold">
                {currSym} {formatCurrency(invoice.grandTotal || invoice.totalAmount || 0)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        {invoice.amountInWords && (
          <div className="border border-gray-400 border-t-0 py-1.5 px-2 text-[10.5px] font-bold bg-gray-50/40 mb-3">
            Amount in Words: {invoice.amountInWords}
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mt-3 text-[10px] leading-snug">
          <div className="font-bold underline text-[10.5px] mb-1">
            TERMS & CONDITIONS
          </div>
          <div className="text-gray-800">
            {invoice.damagePolicy ||
              'Damage Policy: If any of the Goods are found to be damaged upon receipt, the Purchaser shall notify the Supplier in writing, providing evidence such as photographs and videos, within seven (3) days of receipt of the Good (terms and conditions apply).'}
          </div>
        </div>

        {/* Bank & Payment Details */}
        <div className="mt-2.5 text-[10px] leading-snug">
          <div className="text-gray-800 mb-1">
            {invoice.paymentRoutingNote ||
              "Payment should be made to our agent in the UAE, 'Greatway Ceylon Fruits and Vegetables Trading LLC'."}
          </div>

          <div className="space-y-0.5 mt-1 font-mono text-[10px]">
            <div className="flex">
              <span className="w-28 text-gray-700">Account Name</span>
              <span>: {bank.accountName || companyName}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-gray-700">Bank Name</span>
              <span>: {bank.bankName || ''}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-gray-700">Bank Branch</span>
              <span>: {bank.bankBranch || ''}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-gray-700">Account Number</span>
              <span>: {bank.accountNumber || ''}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-gray-700">SWIFT</span>
              <span>: {bank.swift || ''}</span>
            </div>
            {bank.iban && (
              <div className="flex">
                <span className="w-28 text-gray-700">IBAN</span>
                <span>: {bank.iban}</span>
              </div>
            )}
            <div className="flex">
              <span className="w-28 text-gray-700">Currency</span>
              <span>: {bank.currency || invoice.currency || 'USD'}</span>
            </div>
          </div>
        </div>

        {/* Signatory Area */}
        <div className="flex justify-end mt-4">
          <div className="text-center w-52">
            <div className="border-b border-black h-10 mb-1"></div>
            <div className="text-[10.5px] font-medium">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
