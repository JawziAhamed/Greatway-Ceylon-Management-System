import React from 'react';
import { Upload } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import watermarkLogoImg from '../../assets/watermark_logo.png';
import signatureImg from '../../assets/signature.png';
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

export default function PerformaInvoiceDocument({ invoice, settings = {}, onUploadSignature }) {
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

  const termsList =
    invoice.termsAndConditions && invoice.termsAndConditions.length > 0
      ? invoice.termsAndConditions
      : invoice.damagePolicy
      ? invoice.damagePolicy.split('\n').filter((l) => l.trim())
      : [
          'Damages should be reported within 10 days of the arrival of goods at the destination port (Refer to attachment 01 for general terms and conditions)',
          '*Greatway Ceylon will not accept liability for any damages if,- The goods are not cleared within 48 hours of arrival at the designated port of destination.- The reports of three temperature gauges are not submitted along with the temperature gauges,- The damage report is provided beyond 10 days from the arrival of the shipment.',
          '* Greatway Ceylon will not be responsible for any damage sustained during the voyage, customer handling/ unloading process, or due to the lack of required temperature being maintained and improper cold chain management. No damages shall be accepted if the temperature gauges are not returned to our representatives when the shipment arrives.',
          '*Acceptance of damages shall be at the sole discretion of Greatway Ceylon (Pvt) Ltd.',
          '*Any amount deducted for damages cannot be arbitrarily decided by Nuragro FZE. If any deduction is to be made, it must be decided with the explicit consent of Greatway Ceylon (Pvt) Ltd. Deductions made without such consent shall be considered void and deemed payable to Greatway Ceylon (Pvt) Ltd.',
        ];

  return (
    <div className="invoice-document-root bg-white text-gray-900 p-4 sm:p-5 max-w-[820px] mx-auto text-[10.5px] leading-snug shadow-md print:shadow-none print:p-0 print:max-w-none">
      {/* Outer Enclosing Frame matching the prototype */}
      <div className="relative border-[1.5px] border-black p-3">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-2">
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
        <div className="bg-[#cf9e62] border-[1.5px] border-black py-1.5 px-3 text-center mb-0">
          <h1 className="text-black text-xs font-bold tracking-wider">
            PROFORMA INVOICE
          </h1>
        </div>

        {/* Customer, PI & Shipping Details Meta Grid */}
        <div className="border-x-[1.5px] border-b-[1.5px] border-black">
          <div className="grid grid-cols-2 divide-x divide-black">
            {/* Left Box: Customer Details & PI Meta */}
            <div className="p-2.5 flex flex-col justify-between space-y-2">
              <div>
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

              <div className="pt-2 border-t border-gray-300 space-y-0.5 text-[10.5px]">
                <div className="flex items-start">
                  <span className="font-bold w-[125px] shrink-0 whitespace-nowrap">PI NO:</span>
                  <span className="font-bold flex-1 min-w-0">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold w-[125px] shrink-0 whitespace-nowrap">PI DATE:</span>
                  <span className="flex-1 min-w-0">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold w-[125px] shrink-0 whitespace-nowrap">PAYMENT TERMS:</span>
                  <span className="text-[10px] leading-snug flex-1 min-w-0">{invoice.paymentTerms}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold w-[125px] shrink-0 whitespace-nowrap">SHIPMENT REFERENCE:</span>
                  <span className="flex-1 min-w-0">{invoice.shipmentReference}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold w-[125px] shrink-0 whitespace-nowrap">INCOTERMS:</span>
                  <span className="font-bold text-gray-900 flex-1 min-w-0 leading-tight">
                    {getIncotermCode(invoice.incoterms) || invoice.incoterms || 'CIF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box: Shipping Details Matching Image 2 */}
            <div className="p-2.5 flex flex-col justify-start text-[10.5px]">
              <div className="space-y-1">
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">Vessel:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.vessel || invoice.shippedPer || 'MSC PRELUDE V'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">Voyage Number:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.voyageNo || 'IW626R'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">Container No:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.containerNo || invoice.containerSpecification || 'TBC'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">Seal Number:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.sealNumber || 'TBC'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">POL:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.portOfLoading || 'DURBAN'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">POD:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.portOfDischarge || 'KHOR AL FAKKAN'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">Final Destination:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.finalDestination !== undefined && invoice.finalDestination !== '' ? invoice.finalDestination : (invoice.portOfDischarge || 'KHOR AL FAKKAN')}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">ETD:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.etd || '29/07/2026'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">ETA:</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.eta || '12/08/2026'}</span>
                </div>
                <div className="flex justify-end items-baseline">
                  <span className="font-bold text-gray-900 mr-2 whitespace-nowrap">Stack :</span>
                  <span className="font-normal text-gray-900 w-44 text-left">{invoice.stack || '25/07 to 26/07 06:00 P'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table matching Quotation view */}
        <table className="w-full border-collapse my-2 text-[10.5px]">
          <thead>
            <tr className="bg-[#cf9e62] text-black">
              <th className="border border-[#b88a52] py-1.5 px-1 text-center w-7 font-bold">#</th>
              <th className="border border-[#b88a52] py-1.5 px-1.5 text-center w-16 font-bold">ITEM NAME</th>
              <th className="border border-[#b88a52] py-1.5 px-2 text-center font-bold">DESCRIPTION</th>
              <th className="border border-[#b88a52] py-1.5 px-1.5 text-center w-24 font-bold">Net Weight Per Box</th>
              <th className="border border-[#b88a52] py-1.5 px-1.5 text-center w-24 font-bold leading-tight">
                Rate per Nut/ Kg in {invoice.currency || 'USD'}
              </th>
              <th className="border border-[#b88a52] py-1.5 px-1.5 text-center w-20 font-bold leading-tight">
                Per Box Rate ({invoice.currency || 'USD'})
              </th>
              <th className="border border-[#b88a52] py-1.5 px-1.5 text-center w-20 font-bold leading-tight">
                Quantity Cartons
              </th>
              <th className="border border-[#b88a52] py-1.5 px-2 text-center w-24 font-bold leading-tight">
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

            {invoice.additionalCharges && invoice.additionalCharges.length > 0 ? (
              invoice.additionalCharges.filter((c) => Number(c.amount || 0) > 0 || c.description).map((charge, cIdx) => (
                <tr key={`charge-${cIdx}`}>
                  <td colSpan={7} className="border border-gray-400 py-1 px-2 text-left italic text-gray-700">
                    {charge.description || 'Additional Charge / Freight'}
                  </td>
                  <td className="border border-gray-400 py-1 px-2 text-right font-normal">
                    {currSym} {formatCurrency(charge.amount)}
                  </td>
                </tr>
              ))
            ) : (Number(invoice.freightCharges || 0) > 0 || Number(invoice.freightCost || 0) > 0) ? (
              <tr>
                <td colSpan={7} className="border border-gray-400 py-1 px-2 text-left italic text-gray-700">
                  {invoice.freightDescription || 'Free time at destination added cost for Freight'}
                </td>
                <td className="border border-gray-400 py-1 px-2 text-right font-normal">
                  {currSym} {formatCurrency(invoice.freightCharges || invoice.freightCost)}
                </td>
              </tr>
            ) : null}

            <tr className="font-bold bg-white">
              <td colSpan={6} className="border border-gray-400 py-1.5 px-3 text-left font-bold">
                Total
              </td>
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
          <div className="border border-gray-400 border-t-0 py-1 px-2 text-[10px] font-bold bg-gray-50/40 mb-2">
            Amount in Words: {invoice.amountInWords}
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="mt-2 text-[9.5px] leading-tight">
          <div className="font-bold underline text-[10px] mb-0.5">
            TERMS & CONDITIONS
          </div>
          <div className="text-gray-800 space-y-0.5">
            {termsList.map((point, idx) => (
              <div key={idx} className="leading-tight">
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* Bank & Payment Details */}
        <div className="mt-2 text-[9.5px] leading-tight">
          <div className="text-gray-800 mb-0.5">
            {invoice.paymentRoutingNote ||
              "Payment should be made to our agent in the UAE, 'Greatway Ceylon Fruits and Vegetables Trading LLC'."}
          </div>

          <div className="space-y-0.5 mt-0.5 font-mono text-[9.5px]">
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
        <div className="flex justify-end mt-1.5">
          <div className="text-center w-56 relative z-10 group">
            {/* Direct Device Upload Overlay (Hidden in PDF & Print) */}
            {onUploadSignature && (
              <label
                data-html2canvas-ignore="true"
                className="print:hidden absolute -top-6 right-0 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[9.5px] font-semibold cursor-pointer shadow-xs transition select-none z-30"
                title="Add or change signature & company stamp from your device"
              >
                <Upload className="w-2.5 h-2.5 text-amber-700" />
                <span>{safeSettings.signatureUrl ? 'Change Sign & Stamp' : 'Add Sign & Stamp (Device)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onUploadSignature}
                />
              </label>
            )}

            {safeSettings.showSignature !== false && (
              <div className="flex justify-center -mb-2">
                <img
                  src={resolveMediaUrl(safeSettings.signatureUrl) || signatureImg}
                  alt="Authorized Signature & Stamp"
                  className="h-14 max-w-[220px] object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = signatureImg;
                  }}
                />
              </div>
            )}
            <div className="border-b border-black w-full mb-1"></div>
            <div className="text-[10px] font-medium">Authorized Signatory</div>
          </div>
        </div>

        {/* Transparent Watermark Logo at Right Bottom */}
        <div className="absolute right-4 bottom-3 pointer-events-none opacity-20 select-none">
          <img
            src={watermarkLogoImg}
            alt="Greatway Mark"
            className="w-16 h-16 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
