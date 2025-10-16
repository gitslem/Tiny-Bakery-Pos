# 🍰 Tiny Bakery POS (React + Tailwind + Firebase Hosting)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-active-success)
![Roadmap](https://img.shields.io/badge/next%20release-v2.0-lightgrey)

> The first stable release of Tiny Sales.  
> Stay tuned for **v2.0** with real-time sync, analytics, and role-based access.

A **lightweight Point of Sale (POS)** system built with **React**, **Vite**, and **Tailwind CSS**, designed for a small bakery.  
It supports **cashier and manager roles**, **inventory tracking**, **Buy 4 Get 1 Free promotions**, and **persistent data using localStorage**.  
Deployed with **Firebase Hosting** and optionally integrated with **GitHub Actions for CI/CD**.


## 🚀 Features

| Feature | Description |
|----------|--------------|
| 🎂 **Inventory Management** | Track items, pastries, breads, and cakes (by slice or whole). |
| 💼 **Role-based Access** | Cashier and Manager modes (Manager can restock and add new items). |
| 💰 **Promotion Engine** | Automatically applies *Buy 4 Get 1 Free* per product line. |
| 💾 **Local Storage Persistence** | Retains app state (cart, inventory, ledger, and revenue) across refreshes. |
| 💳 **Immutable Prices** | Prices cannot be changed in the UI to preserve business rules. |
| ⚡ **Vite + Tailwind CSS** | Super-fast frontend stack for instant builds and hot reloading. |
| ☁️ **Firebase Hosting** | Easily deployed live on Firebase (tinybakery.web.app). |


## 🧩 Tech Stack

| Tool | Purpose |
|------|----------|
| **React (Vite)** | Frontend framework & build tool |
| **Tailwind CSS** | Utility-first CSS styling |
| **Firebase Hosting** | Production deployment |
| **localStorage** | Offline data persistence |
| **GitHub Actions** | Optional CI/CD for automated deploys |


### 🧱 Project Structure

| Path / File | Description |
|--------------|-------------|
| **`public/`** | Contains static assets such as favicon, manifest, and other public files. |
| **`src/`** | Core application source code for the Tiny Bakery POS app. |
| ├── `components/` | Reusable UI components — `Cart`, `RestockPanel`, `AddItemForm`, etc. |
| ├── `App.jsx` | Main React file — handles inventory, cashier/manager roles, and UI logic. |
| ├── `index.css` | Tailwind CSS entry point (`@tailwind base; @tailwind components; @tailwind utilities;`). |
| ├── `main.jsx` | ReactDOM entry point — renders the app root. |
| └── `assets/` *(optional)* | Local images or icons (if used). |
| **`.github/workflows/`** | Contains GitHub Actions workflows for automatic Firebase deployments. |
| **`dist/`** | Production build output (auto-generated after running `npm run build`). |
| **`package.json`** | Project configuration — scripts, dependencies, metadata. |
| **`postcss.config.js`** | PostCSS + Autoprefixer configuration. |
| **`tailwind.config.js`** | Tailwind setup and theme customization. |
| **`vite.config.js`** | Vite build setup (plugins, aliases, optimizations). |
| **`firebase.json`** | Firebase Hosting configuration file (public folder + rewrites). |
| **`.firebaserc`** | Firebase project and site alias mappings. |
| **`README.md`** | Project documentation (you’re reading it!). |


### 🧭 Folder Overview

| Folder | Purpose |
|---------|----------|
| `src/` | All application logic, components, and styling files. |
| `components/` | Modular React components for clean architecture. |
| `dist/` | Output directory for optimized production builds. |
| `.github/` | CI/CD pipelines for automatic deploys. |
| `public/` | Static frontend assets and metadata for hosting. |



## 🧰 Installation & Local Setup

Follow these steps to run the app locally:

| Step | Command / Action | Description |
|------|------------------|-------------|
| 1 | `git clone https://github.com/gitslem/tiny-bakery-pos.git` | Clone the repo |
| 2 | `cd tiny-bakery-pos` | Enter the project directory |
| 3 | `npm install` | Install dependencies |
| 4 | `npm run dev` | Start local development server |
| 5 | Open `http://localhost:5173` | Access your local app |


## 🎨 Tailwind CSS Setup

Tailwind is preconfigured, but for reference, your setup should include these files:

**`tailwind.config.js`**
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

postcss.config.js

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

src/index.css

@tailwind base;
@tailwind components;
@tailwind utilities;


🔥 Firebase Hosting Deployment

You can host the bakery POS live on Firebase in just a few commands.

Step	Command	Description
1	npm run build	Builds production files into /dist
2	firebase login	Log into your Firebase account
3	firebase use portfolio-website-b2d98	Set your active Firebase project
4	firebase hosting:sites:create tinybakery	(Optional) Create a separate Hosting site
5	firebase init hosting	Configure your project’s hosting
6	When asked for the public directory, type: dist	Specify your Vite build folder
7	Choose: Configure as a single-page app → Yes	So /index.html handles routing
8	firebase deploy --only hosting	Deploy your app live
✅	Visit: https://tinybakery.web.app

Example firebase.json:

{
  "hosting": {
    "site": "tinybakery",
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}


🤖 GitHub Actions (CI/CD Auto Deploy)

You can automatically deploy to Firebase every time you push to main.

Step	Description
1	Ensure your Firebase CLI is connected to GitHub (firebase init hosting:github).
2	Approve GitHub authorization and select this repo.
3	It will create .github/workflows/firebase-hosting.yml.
4	Commit and push — your site auto-deploys with every change.

Example Workflow (Manual Setup)
.github/workflows/firebase-hosting.yml

name: Deploy to Firebase Hosting

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_PORTFOLIO_WEBSITE_B2D98 }}
          projectId: portfolio-website-b2d98
          target: tinybakery


🧠 Developer Notes
	•	App state (cart, ledger, inventory, revenue) is persisted in browser localStorage under key tiny-bakery-pos-v2.
	•	Manager mode enables:
	•	Adding new items (pastry/bread/cake)
	•	Restocking existing inventory
	•	Toggling promotions
	•	Prices are immutable — enforced in the UI.
	•	Cake inventory is handled by slices, while other items are by units.


🧾 License

This project is licensed under the MIT License — feel free to use, modify, and deploy for educational or small business use.


💬 Author

Developed by: Anslem
Tech Stack: React + Vite + TailwindCSS + Firebase
Live App: https://tinybakery.web.app
GitHub Repo: https://github.com/gitslem/tiny-bakery-pos

A sweet and simple POS for bakeries — fast, modern, and manager-friendly.
