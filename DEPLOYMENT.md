# 🚀 Deployment Guide: Frontend on Vercel + Backend on Render

This guide walks you through deploying the **Greatway Ceylon Quotation & Performa Invoice Management System** using the recommended production stack:
- **Frontend**: [Vercel](https://vercel.com) (Edge CDN, lightning-fast React hosting, custom domain)
- **Backend**: [Render](https://render.com) (Node.js/Express Web Service + Puppeteer PDF generator)
- **Database**: [MongoDB Atlas](https://cloud.mongodb.com) (Already active in the cloud)

---

## 📌 Step 1: Push Code to GitHub

Both Vercel and Render deploy directly from your GitHub repository.

1. Open PowerShell inside c:\Users\jawzi\Downloads\Invoice and Quotation:
   `ash
   git init
   git add .
   git commit -m "Greatway Ceylon Management System - Vercel & Render ready"
   `

2. Create a new repository on [GitHub](https://github.com/new) (e.g. greatway-ceylon).

3. Link your local project to GitHub and push:
   `ash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/greatway-ceylon.git
   git branch -M main
   git push -u origin main
   `

---

## ⚙️ Step 2: Deploy Backend to Render (Deploy this first)

1. Sign up or log in at **[Render.com](https://render.com)**.
2. In the dashboard, click **\"New +\"** in the top right $\rightarrow$ select **\"Web Service\"**.
3. Choose **\"Build and deploy from a Git repository\"** and select your GitHub repo (greatway-ceylon).
4. Configure the Web Service:
   - **Name**: greatway-backend *(or any name you prefer)*
   - **Region**: Singapore *(or Frankfurt)*
   - **Branch**: main
   - **Root Directory**: ackend  ⚠️ *(IMPORTANT: type ackend here)*
   - **Runtime**: Node
   - **Build Command**:
     `ash
     npm install && npx puppeteer browsers install chrome
     `
   - **Start Command**:
     `ash
     node server.js
     `
   - **Instance Type**: Free

5. Scroll down to **Environment Variables** and add:
   | Key | Value |
   | :--- | :--- |
   | NODE_ENV | production |
   | MONGO_URI | mongodb+srv://jawziahamed2003_db_user:jvnCzSgoFxQbpYrM@cluster0.qez1m2j.mongodb.net/greatway_ceylon?retryWrites=true&w=majority&appName=Cluster0 |
   | JWT_SECRET | greatway_ceylon_secret_key_2026_jwt_token |
   | PUPPETEER_CACHE_DIR | /opt/render/.cache/puppeteer |

6. Click **\"Deploy Web Service\"**.
7. Wait 2–3 minutes for the build to finish. Once ready, copy your public backend URL from the top of the page:
   > 📋 Example: https://greatway-backend.onrender.com

---

## ⚡ Step 3: Deploy Frontend to Vercel

1. Sign up or log in at **[Vercel.com](https://vercel.com)**.
2. Click **\"Add New...\"** $\rightarrow$ select **\"Project\"**.
3. Import your GitHub repository (greatway-ceylon).
4. In the configuration screen:
   - **Framework Preset**: Vite *(auto-detected)*
   - **Root Directory**: Click **\"Edit\"** and select rontend  ⚠️ *(IMPORTANT: select rontend)*
   - **Build Command**: 
pm run build *(default)*
   - **Output Directory**: dist *(default)*

5. Expand the **Environment Variables** section and add:
   | Key | Value |
   | :--- | :--- |
   | VITE_API_URL | https://YOUR-RENDER-BACKEND-NAME.onrender.com |

   *(Paste your actual Render backend URL copied from Step 2)*

6. Click **\"Deploy\"**!
7. In ~30–45 seconds, your frontend will be deployed with an official live link:
   > 🌐 Example: https://greatway-ceylon.vercel.app

---

## 🔐 Step 4: Login & Share

Open your live Vercel URL and log in with your credentials:

- **Admin Account**:
  - Email: dmin@greatwayceylon.com
  - Password: Admin@123
  *(Full management of Quotations, Invoices, Customers, Products, Company Settings, Logo, Users)*

- **Staff Account**:
  - Email: staff@greatwayceylon.com
  - Password: Staff@123
  *(Create, edit, view, download quotations and performa invoices)*

---

## 💡 Key Architectural Notes

1. **SPA Route Handling**: The included rontend/vercel.json ensures that refreshing pages like /quotations or /invoices on Vercel routes properly to /index.html without 404s.
2. **CORS**: The backend Express server is configured with permissive CORS to allow calls directly from your .vercel.app domain.
3. **Database**: The backend connects directly to your MongoDB Atlas Cluster0, so data persists across all devices and sessions.
4. **PDF Generator**: Puppeteer uses Linux container flags (--no-sandbox, --disable-dev-shm-usage) to ensure error-free PDF downloads on Render's free tier.
