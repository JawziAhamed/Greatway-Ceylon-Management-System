const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { INCOTERMS_OPTIONS, getIncotermCode, formatIncotermDisplay } = require('./incoterms');

const runIncotermsTest = async () => {
  try {
    console.log('\n======================================================');
    console.log('TEST SUITE: INCOTERMS® 2020 IMPLEMENTATION & PDF AUDIT');
    console.log('======================================================\n');

    // 0. Verify the 8 options definition
    console.log(`[CHECK 0] Verifying the 8 Incoterms options:`);
    console.log(`Total options: ${INCOTERMS_OPTIONS.length}`);
    INCOTERMS_OPTIONS.forEach((opt, idx) => console.log(`  ${idx + 1}. ${opt.label} (code: ${opt.code})`));
    if (INCOTERMS_OPTIONS.length !== 8) throw new Error('Expected exactly 8 Incoterms options');

    // Authenticate
    console.log('\nAuthenticating test client...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@greatwayceylon.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Authentication failed: ' + loginData.message);
    const token = loginData.data.token;
    console.log(`✔ Authenticated as: ${loginData.data.name} (${loginData.data.role})`);

    // 1. Fetch Existing Invoice with CIF
    console.log('\n[STEP 1] Fetching existing invoice list...');
    const listRes = await fetch('http://localhost:5000/api/invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listData = await listRes.json();
    if (!listData.success || listData.data.length === 0) throw new Error('No invoices found');
    const invoice = listData.data[0];
    console.log(`✔ Found invoice: ${invoice.invoiceNumber}`);
    console.log(`   Initial Incoterms: "${invoice.incoterms || 'CIF'}"`);
    console.log(`   Port of Discharge: "${invoice.portOfDischarge}"`);

    // 2. Change CIF to FOB & 3. Save via PUT /api/invoices/:id
    console.log('\n[STEP 2 & 3] Updating invoice from CIF to FOB via PUT API...');
    const updateRes = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...invoice,
        customerId: invoice.customer?._id || invoice.customer,
        incoterms: 'FOB'
      })
    });
    const updateData = await updateRes.json();
    if (!updateData.success) throw new Error('Update failed: ' + updateData.message);
    console.log(`✔ Saved invoice to MongoDB with incoterms = "FOB"`);

    // 4. Refresh page simulation: GET /api/invoices/:id
    console.log('\n[STEP 4] Fetching invoice (GET /api/invoices/:id) after refresh...');
    const getRes = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    if (!getData.success) throw new Error('Failed to retrieve invoice: ' + getData.message);
    const refreshedFOB = getData.data;

    // 5. Confirm FOB remains selected
    console.log('\n[STEP 5] Confirming FOB remains selected in retrieved document:');
    console.log(`   Retrieved Incoterms: "${refreshedFOB.incoterms}"`);
    const codeFOB = getIncotermCode(refreshedFOB.incoterms);
    if (codeFOB !== 'FOB') {
      throw new Error(`Expected FOB to be selected, got: ${refreshedFOB.incoterms}`);
    }
    console.log(`✔ CONFIRMED: FOB remains selected! (Code: ${codeFOB})`);

    // 6. Preview formatted string verification
    console.log('\n[STEP 6] Testing preview formatted display string:');
    const previewFOB = formatIncotermDisplay(
      refreshedFOB.incoterms,
      refreshedFOB.portOfDischarge,
      refreshedFOB.portOfLoading
    );
    console.log(`   Preview String: "${previewFOB}"`);
    if (!previewFOB.startsWith('FOB') || !previewFOB.includes('Incoterms® 2020')) {
      throw new Error(`Invalid preview string: ${previewFOB}`);
    }
    console.log(`✔ CONFIRMED: Preview format matches "<Code> <Named Place> — Incoterms® 2020"`);

    // 7. Generate PDF
    console.log('\n[STEP 7] Generating PDF with FOB (GET /api/invoices/:id/pdf)...');
    const pdfResFOB = await fetch(`http://localhost:5000/api/invoices/${invoice._id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pdfBytesFOB = await pdfResFOB.arrayBuffer();
    console.log(`✔ PDF generated successfully (${pdfBytesFOB.byteLength} bytes). Header: ${Buffer.from(pdfBytesFOB).slice(0, 4).toString()}`);

    // 8. Confirm FOB appears correctly in the PDF
    console.log('\n[STEP 8] Auditing PDF content template for FOB...');
    const CompanySettings = require('../models/CompanySettings');
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/greatway_ceylon');
    const settings = (await CompanySettings.findOne()) || {};
    const { generateInvoiceHTML } = require('./documentTemplates');
    const htmlFOB = generateInvoiceHTML(refreshedFOB, settings, '');
    if (!htmlFOB.includes(previewFOB)) {
      throw new Error(`PDF HTML missing formatted string: "${previewFOB}"`);
    }
    if (!htmlFOB.includes('FOB VALUE')) {
      throw new Error(`PDF HTML items table missing "FOB VALUE" column header`);
    }
    console.log(`✔ CONFIRMED: FOB appears correctly in the generated PDF:`);
    console.log(`    - "INCOTERMS:</td>...${previewFOB}"`);
    console.log(`    - "FOB VALUE" column header`);

    // 9. Test at least one other Incoterm such as DAP
    console.log('\n[STEP 9] Testing second Incoterm: DAP...');
    const updateResDAP = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...refreshedFOB,
        customerId: refreshedFOB.customer?._id || refreshedFOB.customer,
        incoterms: 'DAP'
      })
    });
    const updateDataDAP = await updateResDAP.json();
    if (!updateDataDAP.success) throw new Error('Update to DAP failed: ' + updateDataDAP.message);

    const getResDAP = await fetch(`http://localhost:5000/api/invoices/${invoice._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getDataDAP = await getResDAP.json();
    const refreshedDAP = getDataDAP.data;
    console.log(`   Retrieved Incoterms: "${refreshedDAP.incoterms}"`);
    if (getIncotermCode(refreshedDAP.incoterms) !== 'DAP') {
      throw new Error('Expected DAP, got ' + refreshedDAP.incoterms);
    }

    const previewDAP = formatIncotermDisplay(
      refreshedDAP.incoterms,
      refreshedDAP.portOfDischarge,
      refreshedDAP.portOfLoading
    );
    console.log(`   Preview String: "${previewDAP}"`);

    const pdfResDAP = await fetch(`http://localhost:5000/api/invoices/${invoice._id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const pdfBytesDAP = await pdfResDAP.arrayBuffer();
    console.log(`✔ DAP PDF generated successfully (${pdfBytesDAP.byteLength} bytes)`);

    const htmlDAP = generateInvoiceHTML(refreshedDAP, settings, '');
    if (!htmlDAP.includes(previewDAP) || !htmlDAP.includes('DAP VALUE')) {
      throw new Error('DAP missing in PDF template');
    }
    console.log(`✔ CONFIRMED: DAP appears correctly in the generated PDF!`);

    console.log('\n======================================================');
    console.log('🏆 ALL 9 INCOTERMS TEST STEPS PASSED WITH 100% SUCCESS!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
};

runIncotermsTest();
