import React from 'react';
import logoImg from '../../assets/logo.png';
import watermarkLogoImg from '../../assets/watermark_logo.png';
import { resolveMediaUrl } from '../../api/axiosClient';
import { formatIncotermDisplay } from '../../utils/incoterms';

export const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function QuotationDocument({ quotation, settings = {} }) {
  if (!quotation) return null;

  const safeSettings = settings || {};
  const buyer = quotation.buyerSnapshot || (typeof quotation.customer === 'object' ? quotation.customer : null) || {};
  const companyName = safeSettings.companyName || 'GREATWAY CEYLON (PVT) LTD';
  const companyAddress = safeSettings.address || 'No. 76/A, Rathamba, Ambagasdowa, Sri Lanka - 90300';
  const email = safeSettings.email || 'info@greatwayceylon.com';
  const website = safeSettings.website || 'https://greatwayceylon.com/';
  const regNo = safeSettings.registrationNumber || 'PV 00263042';
  const taxNo = safeSettings.taxNumber || '103406048 - 7000';

  const specificTerms =
    quotation.specificTerms && quotation.specificTerms.length > 0
      ? quotation.specificTerms
      : safeSettings.quotationSettings?.defaultSpecificTerms || [];

  return (
    <div className="relative bg-white text-gray-900 p-8 max-w-[820px] mx-auto text-[11px] leading-relaxed shadow-md print:shadow-none print:p-0 print:max-w-none">
      {/* Header Row */}
      <div className="flex justify-between items-start mb-3">
        <div className="w-7/12">
          <h2 className="text-[#14663e] font-bold text-base leading-tight">
            {companyName}
          </h2>
          <div className="text-[10.5px] text-gray-700 leading-snug mt-1">
            {companyAddress}
            <br />
            Email: {email} | Web: {website}
            <br />
            Reg No: {regNo} | TAX: {taxNo}
          </div>
        </div>
        <div className="w-5/12 flex justify-end">
          <img
            src={resolveMediaUrl(settings.logoUrl) || logoImg}
            alt="Greatway Ceylon"
            className="max-h-16 max-w-[240px] object-contain"
          />
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center my-4">
        <h1 className="text-[#14663e] text-xl font-bold tracking-wider">QUOTATION</h1>
      </div>

      {/* Meta Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-7/12">
          <div className="text-[#14663e] font-bold text-xs uppercase mb-1">
            Buyer Details
          </div>
          <div className="text-[11px] leading-snug">
            <span className="font-bold text-gray-900">
              {buyer.companyName || 'N/A'}
            </span>
            <br />
            {buyer.address && (
              <>
                <span className="whitespace-pre-line">{buyer.address}</span>
                <br />
              </>
            )}
            {buyer.country && (
              <>
                {buyer.country}
                <br />
              </>
            )}
            {buyer.contactPerson && (
              <>
                Attn: {buyer.contactPerson}
                <br />
              </>
            )}
            {buyer.email && (
              <>
                Email: {buyer.email}
                <br />
              </>
            )}
            {buyer.taxNumber && <span>Tax/VAT: {buyer.taxNumber}</span>}
          </div>
        </div>

        <div className="w-5/12 flex justify-end">
          <table className="text-[11px]">
            <tbody>
              <tr>
                <td className="font-bold text-gray-700 pr-3 py-0.5">DATE</td>
                <td className="py-0.5">: {formatDate(quotation.quotationDate)}</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-700 pr-3 py-0.5">QUOTATION NO</td>
                <td className="font-bold py-0.5">: {quotation.quotationNumber}</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-700 pr-3 py-0.5">SALE TYPE</td>
                <td className="py-0.5">: <span className="font-bold text-[#14663e]">{quotation.saleType || 'Own Sale'}</span></td>
              </tr>
              {quotation.validUntil && (
                <tr>
                  <td className="font-bold text-gray-700 pr-3 py-0.5">VALID UNTIL</td>
                  <td className="py-0.5">: {formatDate(quotation.validUntil)}</td>
                </tr>
              )}
              <tr>
                <td className="font-bold text-gray-700 pr-3 py-0.5">CURRENCY</td>
                <td className="py-0.5">: {quotation.currency || 'USD'}</td>
              </tr>
              <tr>
                <td className="font-bold text-gray-700 pr-3 py-0.5">INCOTERMS</td>
                <td className="py-0.5">: <span className="font-bold">{formatIncotermDisplay(quotation.incoterms, quotation.finalDestination || buyer.country || 'Destination Port')}</span></td>
              </tr>
              {quotation.status && (
                <tr>
                  <td className="font-bold text-gray-700 pr-3 py-0.5">STATUS</td>
                  <td className="py-0.5">
                    : <span className="font-bold uppercase text-[10px] tracking-wider text-[#14663e]">{quotation.status}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-2 text-[10.5px]">
        <thead>
          <tr className="bg-[#14663e] text-white">
            <th className="border border-[#14663e] py-1.5 px-1 text-center w-7 font-bold">#</th>
            <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-16 font-bold">ITEM NAME</th>
            <th className="border border-[#14663e] py-1.5 px-2 text-left font-bold">DESCRIPTION</th>
            <th className="border border-[#14663e] py-1.5 px-1.5 text-center w-24 font-bold">Net Weight Per Box</th>
            <th className="border border-[#14663e] py-1.5 px-1.5 text-right w-24 font-bold">Rate per Nut/ Kg in USD</th>
            <th className="border border-[#14663e] py-1.5 px-1.5 text-right w-20 font-bold">Per Box Rate (USD)</th>
            <th className="border border-[#14663e] py-1.5 px-1.5 text-right w-20 font-bold">Quantity Cartons</th>
            <th className="border border-[#14663e] py-1.5 px-2 text-right w-24 font-bold">Total Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          {(quotation.items || []).map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50/50">
              <td className="border border-gray-400 py-1 px-1 text-center">{idx + 1}</td>
              <td className="border border-gray-400 py-1 px-1 text-center font-medium">{item.itemCode || ''}</td>
              <td className="border border-gray-400 py-1 px-2">{item.description}</td>
              <td className="border border-gray-400 py-1 px-1 text-center">{item.netWeightPerBox}</td>
              <td className="border border-gray-400 py-1 px-1 text-right">$ {formatCurrency(item.ratePerNutKg)}</td>
              <td className="border border-gray-400 py-1 px-1 text-right">$ {formatCurrency(item.boxRate)}</td>
              <td className="border border-gray-400 py-1 px-1 text-right font-medium">{formatCurrency(item.quantityCartons)}</td>
              <td className="border border-gray-400 py-1 px-2 text-right font-medium">$ {formatCurrency(item.lineTotal)}</td>
            </tr>
          ))}

          {quotation.additionalCharges && quotation.additionalCharges.length > 0 ? (
            quotation.additionalCharges
              .filter((c) => Number(c.amount || 0) > 0 || c.description)
              .map((charge, idx) => (
                <tr key={`charge-${idx}`}>
                  <td colSpan={7} className="border border-gray-400 py-1 px-2 italic text-gray-700">
                    {charge.description || 'Additional Charge / Freight'}
                  </td>
                  <td className="border border-gray-400 py-1 px-2 text-right font-medium">
                    $ {formatCurrency(charge.amount)}
                  </td>
                </tr>
              ))
          ) : Number(quotation.freightCost || 0) > 0 ? (
            <tr>
              <td colSpan={7} className="border border-gray-400 py-1 px-2 italic text-gray-700">
                {quotation.freightDescription || 'Free time at destination added cost for Freight'}
              </td>
              <td className="border border-gray-400 py-1 px-2 text-right font-medium">
                $ {formatCurrency(quotation.freightCost)}
              </td>
            </tr>
          ) : null}

          <tr className="font-bold bg-white">
            <td colSpan={6} className="border border-gray-400 py-1.5 px-3 text-left font-bold">
              Total
            </td>
            <td className="border border-gray-400 py-1.5 px-1 text-right">
              {formatCurrency(quotation.totalCartons)}
            </td>
            <td className="border border-gray-400 py-1.5 px-2 text-right">
              $ {formatCurrency(quotation.grandTotal)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Shipping / Vessel Note */}
      <div className="my-2.5 text-[10.5px] leading-snug font-medium">
        <div>Vessel :- {quotation.vesselDetails || 'Line : MAERSK  Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS'}</div>
        <div>Departure:- {quotation.departureDateText || 'To be scheduled upon confirmation'}</div>
      </div>

      {/* Specific Terms and Conditions */}
      <div className="mt-2 text-[10px] leading-snug">
        <div className="font-bold text-[10.5px] text-gray-900 mb-1">
          Specific Terms and Conditions
        </div>
        <ol className="list-decimal pl-4 space-y-0.5 text-gray-800">
          {specificTerms.map((term, index) => (
            <li key={index}>{term}</li>
          ))}
        </ol>
      </div>

      {/* Signatory & Seal */}
      <div className="flex justify-between items-end my-4">
        <div className="text-[10px]">
          <div className="mb-6 font-mono text-gray-400 tracking-wider">...................................</div>
          <div className="font-bold text-gray-900">{quotation.signatory?.name || 'Authorized Signatory'}</div>
          <div className="text-gray-600">{quotation.signatory?.designation || 'Chief Executive Officer'}</div>
          <div className="font-bold text-[#14663e]">{quotation.signatory?.company || companyName}</div>
        </div>

        <div className="border border-dashed border-[#14663e] rounded p-2 text-center text-[9.5px] text-[#14663e]">
          <div className="font-semibold uppercase tracking-wider">Official Company Seal</div>
          <div className="font-bold">{quotation.signatory?.company || companyName}</div>
          <div>{regNo}</div>
        </div>
      </div>

      {/* Customer Acknowledgement */}
      <div className="border-t border-gray-800 pt-2 mt-3">
        <div className="font-bold text-[10.5px] text-gray-900 mb-1">
          Customer Acknowledgement
        </div>
        <p className="text-[9.5px] text-gray-700 leading-snug mb-2">
          We, <span className="font-bold">{buyer.companyName || 'the Buyer'}</span>, hereby acknowledge receipt and acceptance of the above quotation and attached terms and condition along with the product specification sheet (Attachment 01) and confirm our agreement to the terms and conditions stated herein.
        </p>

        <table className="w-full border-collapse border border-gray-600 text-[10px]">
          <tbody>
            <tr>
              <td className="border border-gray-500 w-36 px-2 py-1 font-medium bg-gray-50">Signature</td>
              <td className="border border-gray-500 h-6 px-2"></td>
            </tr>
            <tr>
              <td className="border border-gray-500 px-2 py-1 font-medium bg-gray-50">Signatory Name</td>
              <td className="border border-gray-500 h-5 px-2"></td>
            </tr>
            <tr>
              <td className="border border-gray-500 px-2 py-1 font-medium bg-gray-50">Designation</td>
              <td className="border border-gray-500 h-5 px-2"></td>
            </tr>
            <tr>
              <td className="border border-gray-500 px-2 py-1 font-medium bg-gray-50">Date</td>
              <td className="border border-gray-500 h-5 px-2"></td>
            </tr>
            <tr>
              <td className="border border-gray-500 px-2 py-1 font-medium bg-gray-50">Company Seal</td>
              <td className="border border-gray-500 h-8 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Transparent Watermark Logo at Right Bottom */}
      <div className="absolute right-4 bottom-4 pointer-events-none opacity-20 select-none">
        <img
          src={watermarkLogoImg}
          alt="Greatway Mark"
          className="w-16 h-16 object-contain"
        />
      </div>
    </div>
  );
}
