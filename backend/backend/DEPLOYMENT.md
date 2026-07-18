# Deployment Guide

Your stack: **React (frontend)** + **Express/Prisma (backend)** + **PostgreSQL**.
Recommended hosts: **Railway** (backend + database) and **Vercel** (frontend). Both have free tiers and need no credit card to start.

---

## Part 1 — Deploy the Backend + Database (Railway)

1. Go to https://railway.app and sign up (GitHub login is easiest).
2. Push the `backend` folder to a GitHub repo (or use Railway's "Deploy from GitHub" after pushing).
3. In Railway: **New Project → Deploy from GitHub repo** → pick your repo → set the **root directory** to `backend` if your repo has both folders.
4. **Add a database**: in the same project, click **New → Database → Add PostgreSQL**. Railway creates it and exposes a `DATABASE_URL` variable automatically.
5. **Link the variable**: in your backend service → **Variables** tab, add:
   - `DATABASE_URL` → reference the Postgres plugin's `DATABASE_URL` (Railway lets you do this with a variable reference, or just copy-paste the value from the Postgres service's Variables tab)
   - `JWT_SECRET` → any long random string (e.g. generate one at https://randomkeygen.com)
   - `FRONTEND_URL` → leave blank for now, you'll fill this in after deploying the frontend (Part 2)
6. Railway auto-detects Node and runs `npm install` (which triggers `postinstall: prisma generate` automatically) then `npm start`.
7. **Run the database migration** once the service is deployed: open the Railway service's **Shell** (or use the Railway CLI locally: `railway run npx prisma migrate deploy`) and run:
   ```
   npx prisma migrate deploy
   ```
8. **Create your admin account** (also via the Railway shell or CLI):
   ```
   node scripts/createAdmin.js you@yourstore.com "Your Name" "a-strong-password"
   ```
9. Copy your backend's public URL (Railway shows it under **Settings → Networking → Generate Domain**), e.g. `https://backend-production-xxxx.up.railway.app`. Your API lives at `<that-url>/api`.

---

## Part 2 — Deploy the Frontend (Vercel)

1. Go to https://vercel.com and sign up (GitHub login easiest).
2. Push the `frontend` folder to a GitHub repo (can be the same repo, different subfolder — set **Root Directory** to `frontend` during import).
3. **New Project → Import** your repo. Vercel auto-detects Create React App.
4. Before deploying, add an **Environment Variable**:
   - `REACT_APP_API_URL` = `https://<your-railway-backend-url>/api` (from Part 1, step 9)
5. Click **Deploy**. Vercel builds and gives you a URL like `https://your-store.vercel.app`.
6. **Go back to Railway** and set `FRONTEND_URL` = `https://your-store.vercel.app` (this restricts CORS to your real frontend — important for security). Redeploy the backend service so the new variable takes effect.

---

## Part 3 — Verify Everything Works

- Visit `https://your-store.vercel.app` → browse products, sign up, add to cart, checkout with a test order.
- Visit `https://your-store.vercel.app/admin` → log in with the admin account you created in step 8 → check Dashboard, add a product, create a promotion code, update an order's status.
- Try the coupon you created at checkout on the customer site to confirm it validates against the live backend.

---

## Notes & Things You Should Do Before Going Live

- **Rotate any secrets**: if the original `.env` password was ever shared or committed anywhere, change the database password.
- **Product images**: for now, products use image URLs (paste a link to a hosted image). If you want real file uploads later, that needs a storage service (e.g. Cloudinary, S3, or Railway volumes) — happy to add this when you're ready.
- **Custom domain**: both Railway and Vercel let you attach your own domain for free under their settings.
- **Backups**: Railway's Postgres plugin has automatic backups on paid plans — worth enabling once you have real customer data.
- **Environment files**: never commit real `.env` files — only `.env.example` should be in version control (already set up in `.gitignore`).

---

## Local Development (optional, before deploying)

**Backend:**
```
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL and JWT_SECRET
npx prisma migrate deploy
npm run dev
```

**Frontend:**
```
cd frontend
npm install
cp .env.example .env   # points at http://localhost:5000/api by default
npm start
```
