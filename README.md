# 💸 Fintrack — Personal Finance App

A beautiful, collaborative personal finance tracker built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL** (via Prisma).

---

## Features

- **Google SSO** sign-in via NextAuth.js
- **Groups** — share finances with family or roommates
- **Folders** — single-level grouping of items with custom icons & colors
- **Items** — Bills, Incomes, Credit Cards, Checking Accounts
- **Recurrence** — one-time, N months, or forever
- **Pay / Receive** — mark items as paid, optionally updating account balances
- **Due date tracking** — "Due today", "Due tomorrow", "Expired 2 days ago"
- **Monthly navigation** — clean month selector
- **Animated balance counter** — net balance for the selected month
- **Brazilian bank icons** — Nubank, Itaú, Inter, Caixa, C6, Bradesco, Santander, BTG…

---

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Framework | Next.js 14 (App Router)      |
| Language | TypeScript                    |
| Styling  | Tailwind CSS + Outfit font    |
| Database | PostgreSQL via Prisma ORM     |
| Auth     | NextAuth.js (Google OAuth)    |
| Icons    | Lucide React                  |

---

## Getting Started

### 1. Clone & install

```bash
git clone <this-repo>
cd finance-app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — your PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from [Google Cloud Console](https://console.cloud.google.com/)

### 3. Set up the database

```bash
# Run migrations
npx prisma migrate deploy

# Or for dev (creates migration if schema changed)
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
5. Copy Client ID and Secret to `.env`

---

## Database Schema

```
User         — NextAuth user (name, email, avatar)
Account      — OAuth provider accounts
Session      — Active sessions
Group        — Shared workspace (e.g. "Personal", "Family")
GroupMember  — User ↔ Group membership (owner / member)
Folder       — Visual grouping inside a group
Item         — Financial entry (BILL / INCOME / CREDIT_CARD / CHECKING_ACCOUNT)
ItemEvent    — Marks an item as paid/received for a specific month
ItemException — Skips a recurring item for a specific month
```

### Item Recurrence Model

Items store `startMonth` ("YYYY-MM") and `endMonth` ("YYYY-MM" or `null`):

| Recurrence       | startMonth | endMonth       |
|-----------------|------------|----------------|
| One-time         | 2026-03    | 2026-03        |
| 6 months         | 2026-01    | 2026-06        |
| Forever          | 2026-01    | null           |

---

## Project Structure

```
src/
├── app/
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth
│   │   ├── groups/        # Group CRUD + member management
│   │   ├── items/         # Item CRUD + pay/receive
│   │   └── folders/       # Folder CRUD
│   ├── dashboard/         # Main app page
│   ├── login/             # Sign-in page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Button, Modal, Input, Select, Toggle
│   ├── modals/            # AddItem, PayItem, Delete, Folder, Group
│   ├── DashboardClient.tsx # Main interactive shell
│   ├── TopBar.tsx
│   ├── MonthSelector.tsx
│   ├── BalanceCounter.tsx
│   ├── ItemCard.tsx
│   ├── FolderSection.tsx
│   └── Icons.tsx          # BankIcon, ItemIcon
├── lib/
│   ├── prisma.ts          # Singleton Prisma client
│   ├── auth.ts            # NextAuth config
│   └── utils.ts           # Helpers (month math, formatting, etc.)
└── types/
    └── index.ts           # Shared TypeScript types
prisma/
├── schema.prisma          # Database schema
└── migrations/
    └── 001_init/          # Initial SQL migration
```

---

## Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Production build
npm run start       # Start production server
npm run db:migrate  # Apply pending migrations
npm run db:generate # Regenerate Prisma client
npm run db:studio   # Open Prisma Studio (DB GUI)
npm run db:push     # Push schema changes (dev only)
```

---

## Deployment

### Environment variables for production

Make sure to set:
- `DATABASE_URL` pointing to your production Postgres instance
- `NEXTAUTH_URL` pointing to your production domain
- `NEXTAUTH_SECRET` (a strong random secret)
- Google OAuth credentials with the production redirect URI

### Recommended platforms

- **Vercel** — zero-config Next.js deployment
- **Neon / Supabase / Railway** — managed PostgreSQL
