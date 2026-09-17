# Greatway Ceylon — Invoice & Quotation Management System

A professional, web-based Quotation and Performa Invoice Management System for **Greatway Ceylon (Pvt) Ltd**, built on the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

---

## Features

- **Exact Prototype Reproduction**: Matches the visual design, company headers, table borders, colors, terms, signature blocks, and customer acknowledgement sections of Greatway Ceylon's official documents.
- **Official Brand Logo**: Embedded high-resolution logo preserved in original appearance, with replacement capability via Company Settings.
- **Dashboard Overview**: Summary metric cards (Quotations, Invoices, Total Sales Value, Products, Customers) and a unified recent documents table with multi-criteria filtering.
- **Dynamic Quotation Module**:
  - Auto-generated sequential numbering (`GC-QTN-YYYY-XXXX`).
  - Dynamic product lines with rates, packaging weights, and carton totals.
  - Automatic freight, subtotal, discount, tax, and grand total calculations.
  - Vessel transit details, departure notes, and 7 specific export terms.
  - Customer Acknowledgement signoff section.
- **Dynamic Performa Invoice Module**:
  - Auto-generated sequential numbering (`GC-PI-YYYY-XXXX`).
  - Container specifications (e.g. `1X40 REEFER`).
  - Shipping ports (Port of Loading & Discharge) and vessel details.
  - Automatic `Amount in Words` generation.
  - Export Damage Policy and structured multi-bank wire transfer instructions.
- **1-Click Quotation → Performa Invoice Conversion**:
  - Converts accepted quotations into Performa Invoices, copying buyer, products, quantities, prices, and freight while generating a new invoice number and establishing relationship tracking.
- **High-Fidelity PDF Generation & Printing**:
  - Headless Chrome (Puppeteer) generating clean A4 portrait PDFs matching the prototype.
  - A4 portrait print-ready stylesheet (`@media print`) removing dashboard controls.
- **Customer & Product Management**:
  - Reusable buyer directory with transaction history and sales analytics.
  - Pre-seeded export catalogue (King Coconut, Red Papaya, Curry Papaya, Tapioca, Ceylon Cinnamon, Cardamom, Cloves).
- **Company & Payment Settings**:
  - Configurable company profile, logo upload, multi-bank accounts, document numbering prefixes, and default terms.
- **Role-Based Authentication**:
  - JWT authentication and bcrypt password hashing for Admin and Staff users.

---

## Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017

### Running the Application

Both servers are currently running:
- **Frontend**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:5000/](http://localhost:5000/)

To run the application manually at any time:

1. **Start Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Re-seed Initial Data (Optional)**:
   ```bash
   cd backend
   npm run seed
   ```

---

## Default Login Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Administrator** | `admin@greatwayceylon.com` | `Admin@123` | Full access to documents, settings, products, buyers, and users |
| **Sales Staff** | `staff@greatwayceylon.com` | `Staff@123` | Create, edit, preview, download, and manage sales documents |
