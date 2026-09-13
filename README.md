# Taqat Maintenance Portal

Apartment maintenance portal for a residential building: residents submit and
track maintenance requests, and the building admin manages apartments,
residents, announcements, and fees. Bilingual (English / Arabic, RTL).

Made by **Mohammed AbuHassan** for the **Taqat AI Coding sessions**.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS — hosted on GitHub Pages
- Backend: Supabase (Postgres, Auth, Storage, Edge Functions)

## Run locally

```bash
cd web
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm install
npm run dev
```

## Project layout

- `web/` — the web app
- `supabase/migrations/` — database schema and security policies
- `supabase/functions/invite-tenant/` — admin-only tenant invitation function
- `.github/workflows/` — CI and GitHub Pages deployment
