import React from 'react';
import logoImg from '../../assets/logo.png';
import { formatCurrency, formatDate } from './QuotationDocument';
import { resolveMediaUrl } from '../../api/axiosClient';
import { formatIncotermDisplay, getIncotermCode } from '../../utils/incoterms';

export default function PerformaInvoiceDocument({ invoice, settings = {} }) {
  if (!invoice) return null;

  const buyer = invoice.buyerSnapshot || invoice.customer || {};
  const companyName = settings.companyName || 'GREATWAY CEYLON (PVT) LTD';
  const companyAddress = settings.address || 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300';
  const email = settings.email || 'info@greatwayceylon.com';
  const taxNo = settings.taxNumber || '103406048 - 7000';
  const bank = invoice.bankDetails || {};

  return (
    <div className="bg-white text-gray-900 p-8 max-w-[820px] mx-auto text-[11px] leading-relaxed shadow-md print:shadow-none print:p-0 print:max-w-none">
      {/* Outer Enclosing Frame matching the prototype */}
      <div className="border-[1.5px] border-black p-4">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-3">
          <div className="w-5/12">
            <img
              src={resolveMediaUrl(settings.logoUrl) || logoImg}
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
              {buyer.taxNumber && (
                <div className="text-[10.5px] text-gray-800">
                  TAX/VAT: {buyer.taxNumber}
                </div>
              )}
            </div>

            {/* PI Details Box */}
            <div className="p-2.5 space-y-1 text-[10.5px]">
              <div className="flex">
                <span className="font-bold w-36">PI NO:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-36">PI DATE:</span>
                <span>{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold w-36 shrink-0">PAYMENT TERMS:</span>
                <span className="text-[10px] leading-snug">{invoice.paymentTerms}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-36">SHIPMENT REFERENCE:</span>
                <span>: {invoice.shipmentReference}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-36">INCOTERMS:</span>
                <span className="font-bold">: {formatIncotermDisplay(invoice.incoterms, invoice.portOfDischarge, invoice.portOfLoading)}</span>
              </div>
              {invoice.status && (
                <div className="flex items-center">
                  <span className="font-bold w-36">STATUS:</span>
                  <span>: <span className="font-bold uppercase text-[10px] tracking-wider text-[#237837]">{invoice.status}</span></span>
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
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse border-x-[1.5px] border-b-[1.5px] border-black text-[10.5px]">
          <thead>
            <tr className="bg-white text-black divide-x divide-black border-b border-black">
              <th className="py-2 px-1 text-center w-20 font-bold border-r border-black leading-tight">
                NO.OF
                <br />
                PACKAGES
              </th>
              <th className="py-2 px-2 text-center font-bold border-r border-black">
                DESCRIPTION
              </th>
              <th className="py-2 px-1 text-center w-28 font-bold border-r border-black leading-tight">
                PER BOX/
                <br />
                WEIGHT (KG)
              </th>
              <th className="py-2 px-1 text-center w-28 font-bold border-r border-black leading-tight">
                RATE PER NUT
                <br />
                KG ({invoice.currency || 'USD'})
              </th>
              <th className="py-2 px-1 text-center w-24 font-bold border-r border-black leading-tight">
                BOX RATE
                <br />
                ({invoice.currency || 'USD'})
              </th>
              <th className="py-2 px-2 text-center w-28 font-bold leading-tight">
                {getIncotermCode(invoice.incoterms)} VALUE
                <br />
                ({invoice.currency || 'USD'})
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.containerSpecification && (
              <tr className="border-b border-black bg-gray-50/70">
                <td colSpan={6} className="py-1 px-2 font-bold text-[10px] tracking-wide">
                  {invoice.containerSpecification}
                </td>
              </tr>
            )}

            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-black divide-x divide-black">
                <td className="py-1 px-1 text-center font-medium">{item.packages}</td>
                <td className="py-1 px-2 font-medium">{item.description}</td>
                <td className="py-1 px-1 text-center">{item.perBoxWeight}</td>
                <td className="py-1 px-1 text-right">{formatCurrency(item.ratePerNutKg)}</td>
                <td className="py-1 px-1 text-right">{formatCurrency(item.boxRate)}</td>
                <td className="py-1 px-2 text-right font-medium">{formatCurrency(item.cifValue)}</td>
              </tr>
            ))}

            {Number(invoice.freightCharges || 0) > 0 && (
              <tr className="border-b border-black divide-x divide-black">
                <td colSpan={5} className="py-1 px-2 text-center italic text-gray-700">
                  {invoice.freightDescription || 'Free time at destination added cost for Freight'}
                </td>
                <td className="py-1 px-2 text-right font-medium">
                  {formatCurrency(invoice.freightCharges)}
                </td>
              </tr>
            )}

            <tr className="border-b border-black divide-x divide-black font-bold">
              <td colSpan={5} className="py-1.5 px-2 text-center">
                TOTAL INVOICE VALUE ({invoice.currency || 'USD'})
              </td>
              <td className="py-1.5 px-2 text-right">
                {formatCurrency(invoice.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in Words */}
        {invoice.amountInWords && (
          <div className="border-x-[1.5px] border-b-[1.5px] border-black py-1 px-2 text-[10px] font-bold bg-gray-50/50">
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
