# Villa Concierge

## What this is

Villa Concierge is a full-stack prototype built for the **Exclusive Resorts concierge itinerary brief**: a tool that lets a villa concierge curate a bespoke trip proposal for a member, send it for review, and walk the member through approval and payment. The concierge side (`/`) is a dense, fast internal dashboard for building draft itineraries; the member side (`/proposal/[id]`) is a premium, resort-branded experience for reviewing, approving, and “paying” for the proposal. Email delivery and payment are simulated — the focus is on the data model, API design, and the two distinct UX surfaces.

## Setup & run

**Prerequisites:** Node.js 20+, pnpm (or npm).

```bash
git clone <repo-url>
cd villa-concierge
pnpm install          # or: npm install

# Apply migrations and seed sample data
npx prisma migrate deploy
npx prisma db seed

pnpm dev              # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the concierge dashboard. Sample member: **James Whitfield**, reservation at **Villa Punta Mita, Mexico** (Mar 15–22, 2026).

A `.env` file with `DATABASE_URL="file:./dev.db"` is expected (included in the repo). If `db seed` fails with “table does not exist”, run `migrate deploy` first.

**Near-single-command setup:** you could add a script to `package.json`:

```json
"db:setup": "prisma migrate deploy && prisma db seed"
```

Then `pnpm install && pnpm db:setup && pnpm dev` gets you running. A `postinstall` hook that runs migrate + seed is possible but usually avoided — it re-seeds on every install (bad for production) and fails in CI without a writable database. A dedicated `db:setup` script is the safer compromise.

> **Note:** This repo ships with an existing migration (`20260802142857_init`). Use `migrate deploy` to apply it. `migrate dev --name init` is only needed when creating the schema from scratch.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16 App Router** | Server components for initial data fetch, colocated API route handlers, file-based routing for concierge vs member views |
| Database | **Prisma 7 + SQLite** | Typed ORM, zero external deps for local eval, easy seed/migrate; better-sqlite3 adapter for Prisma 7 |
| Styling | **Tailwind CSS 4 + shadcn/ui** | Utility-first layout for the dense concierge UI; accessible primitives (Select, Dialog, Card) without a heavy component library |
| Fonts | **next/font** | Cormorant Garamond + DM Sans on the member view; Geist on the concierge side |

## Data model

Five tables, one reservation flow:

```
Member ──< Reservation ──< Proposal ──< ProposalItem
                              └──< SentEmail
```

- **Member** — club member (name, email)
- **Reservation** — a villa stay (destination, villa, arrival/departure dates); belongs to one member
- **Proposal** — an itinerary draft or sent proposal for a reservation; tracks `status` (`draft` → `sent` → `approved` → `paid`), optional concierge `notes`, and `sentAt`
- **ProposalItem** — a scheduled experience (category, title, description, datetime, price); cascades on proposal delete
- **SentEmail** — audit log of simulated sends (recipient, timestamp, body preview)

## Assumptions

- **Single member/reservation** seeded in `prisma/seed.ts`; the dashboard loads the first reservation found
- **No authentication** — concierge and member routes are open; in production these would be role-gated
- **Simulated email** — `POST /api/proposals/[id]/send` logs to the console and writes a `SentEmail` row; no SMTP
- **Simulated payment** — “Pay & Lock In” PATCHes status to `paid`; no payment processor
- **Draft editing rules** — items can only be added/removed while a proposal is `draft`; sending locks the itinerary
- **SQLite file DB** — `dev.db` is local-only; not suitable for multi-instance deployment without migration to Postgres

## What I’d improve with more time

- **Multi-member / multi-reservation support** — member picker, reservation list, per-member proposal history
- **Real auth** — separate concierge and member sessions; magic-link access for proposal URLs
- **Edit draft before send** — inline item editing, reordering, duplicate-item shortcuts
- **Optimistic UI** — instant feedback on add/remove item and status transitions instead of wait-for-fetch
- **Real email** — Resend or SendGrid integration using the existing `SentEmail` model
- **Tests** — API route integration tests (status transitions, draft-only item rules) and a few Playwright flows for the concierge → member handoff
- **Production database** — Postgres with connection pooling; remove `force-dynamic` workarounds

## What I found interesting

The most engaging part was designing **two UIs for the same data** with intentionally opposite goals: the concierge dashboard optimizes for speed and density, while the member proposal page optimizes for trust and luxury. That split influenced everything — API shape (nested includes for reservation/member/items), status as a simple string enum, and keeping the member view as a server-fetched page with a small client island for approve/pay actions.

The **timeline view** was a satisfying second pass: grouping items by calendar day across the stay dates (including empty days) required careful date-key handling in local time, separate from the category-grouped list view. Getting Prisma 7’s SQLite adapter and migrate/seed order right on a fresh clone was the main practical friction — worth documenting so evaluators don’t hit an empty database.
