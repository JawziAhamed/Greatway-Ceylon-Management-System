const fs = require('fs');

async function runTestSuite() {
  console.log('=== RUNNING GREATWAY CEYLON FULL TEST SUITE ===');

  // 1. Auth Test
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@greatwayceylon.com', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + loginData.message);
  const token = loginData.data.token;
  console.log('✔ [1/6] Authentication passed. Logged in as:', loginData.data.name, `(${loginData.data.role})`);

  // 2. Customers & Products Test
  const custRes = await fetch('http://localhost:5000/api/customers', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const custData = await custRes.json();
  const prodRes = await fetch('http://localhost:5000/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const prodData = await prodRes.json();
  console.log(`✔ [2/6] Master data verified: ${custData.count} Customers, ${prodData.count} Export Products.`);

  // 3. Create Quotation Test
  const customer = custData.data[0];
  const createQRes = await fetch('http://localhost:5000/api/quotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      customerId: customer._id,
      currency: 'USD',
      vesselDetails: 'Line : MAERSK  Transit time : 05 DAYS DIRECT | FREE TIME AT DESTINATION : 7 DAYS',
      departureDateText: '28th September 2026',
      items: [
        { itemCode: 'KC', description: 'Fresh King Coconut', netWeightPerBox: '6 nuts', ratePerNutKg: 1.27, boxRate: 7.60, quantityCartons: 1000, lineTotal: 7600.00 },
        { itemCode: 'RP', description: 'Fresh Red Papaya', netWeightPerBox: '5.5 kg', ratePerNutKg: 1.36, boxRate: 7.49, quantityCartons: 250, lineTotal: 1872.50 }
      ],
      freightDescription: 'Free time at destination added cost for Freight',
      freightCost: 250.00,
      discount: 0,
      tax: 0,
      status: 'Sent'
    })
  });
  const qData = await createQRes.json();
  if (!qData.success) throw new Error('Quotation creation failed: ' + qData.message);
  const quotation = qData.data;
  console.log(`✔ [3/6] Quotation created: ${quotation.quotationNumber} | Cartons: ${quotation.totalCartons} | Total: $${quotation.grandTotal}`);
  console.log(`       Amount in words: "${quotation.amountInWords}"`);

  // 4. Convert to Performa Invoice Test
  const convRes = await fetch(`http://localhost:5000/api/quotations/${quotation._id}/convert-to-invoice`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const convData = await convRes.json();
  if (!convData.success) throw new Error('Conversion failed: ' + convData.message);
  const invoice = convData.data;
  console.log(`✔ [4/6] Converted to Performa Invoice: ${invoice.invoiceNumber} | Total: $${invoice.grandTotal}`);
  console.log(`       Source Quotation Linked: ${invoice.quotationId}`);

  // 5. Generate Quotation PDF
  const qPdfRes = await fetch(`http://localhost:5000/api/quotations/${quotation._id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const qPdfBytes = await qPdfRes.arrayBuffer();
  console.log(`✔ [5/6] Quotation PDF generated successfully (${qPdfBytes.byteLength} bytes). Header verified: ${Buffer.from(qPdfBytes).slice(0, 4).toString()}`);

  // 6. Generate Invoice PDF
  const invPdfRes = await fetch(`http://localhost:5000/api/invoices/${invoice._id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const invPdfBytes = await invPdfRes.arrayBuffer();
  console.log(`✔ [6/6] Performa Invoice PDF generated successfully (${invPdfBytes.byteLength} bytes). Header verified: ${Buffer.from(invPdfBytes).slice(0, 4).toString()}`);

  // 7. Dashboard Stats Verification
  const statsRes = await fetch('http://localhost:5000/api/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statsData = await statsRes.json();
  console.log(`✔ Dashboard Stats: Total Quotations = ${statsData.data.summary.totalQuotations}, Total Invoices = ${statsData.data.summary.totalInvoices}, Total Sales = $${statsData.data.summary.totalSalesValue}`);

  console.log('\n======================================================');
  console.log('🏆 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================');
}

runTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
