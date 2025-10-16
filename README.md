# Tiny Bakery POS (Vite + React + Tailwind)

Single-file React app that tracks inventory (cakes sold by slice), cashier/manager roles, a Buy 4 Get 1 Free promo, and saves to localStorage.

## Local dev
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy
- **Netlify**: Build command `npm run build`, Publish directory `dist`. Add `public/_redirects` for SPA routing.
- **Firebase Hosting**: Set `"public": "dist"` and add a rewrite to `/index.html`, then `npm run build && firebase deploy`.
