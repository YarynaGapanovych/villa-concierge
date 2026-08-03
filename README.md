# Villa Concierge

## What this is

Villa Concierge is a full-stack prototype built for the **Exclusive Resorts concierge itinerary brief**. It gives a villa concierge a fast internal tool to curate a bespoke trip proposal for a member—add scheduled experiences, write a personal note, preview the member-facing view, and send—while the member gets a separate, premium-branded flow to review the itinerary, approve it, and complete a simulated payment. The product goal is the handoff between those two surfaces: dense and efficient for staff, calm and luxurious for the guest. Email and payment are intentionally simulated; the focus is on data modeling, API design, form validation, and UX quality on both sides.

## Setup & run

**Prerequisites:** Node.js 20+, npm (or pnpm).

```bash
git clone <repo-url>
cd villa-concierge
npm install

# Apply the existing migration and seed sample data
npx prisma migrate deploy
npx prisma db seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the concierge dashboard. The seed creates **James Whitfield** with a reservation at **Villa Punta Mita, Mexico** (Mar 15–22, 2026). After sending a proposal, open the member link from the console log or the **Proposals** page (`/proposals`).

A `.env` file with `DATABASE_URL="file:./dev.db"` is expected. If `db seed` fails with “table does not exist”, run `migrate deploy` first.

**Closest to a single command** (after clone):

```bash
npm install && npx prisma migrate deploy && npx prisma db seed && npm run dev
```

You can wrap migrate + seed in a `package.json` script:

```json
"db:setup": "prisma migrate deploy && prisma db seed"
```

Then: `npm install && npm run db:setup && npm run dev`.

> **Note on `migrate dev --name init`:** That command is for creating the initial migration from scratch. This repo already ships with `prisma/migrations/20260802142857_init/`—use **`migrate deploy`** to apply it on a fresh clone. Only run `migrate dev --name init` if you are bootstrapping the schema yourself on an empty project.

> **Note on `postinstall`:** A `postinstall` hook that runs migrate + seed is possible (`"postinstall": "prisma migrate deploy && prisma db seed"`), but it is usually avoided—it re-seeds on every install (undesirable in production) and can fail in CI without a writable database. A dedicated `db:setup` script is the safer compromise.

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 16 App Router | Server components for initial data fetch, colocated REST route handlers, file-based routing for concierge vs member views (`/` vs `/proposal/[id]`) |
| **Database** | Prisma 7 + SQLite | Typed ORM with zero external services for local eval; easy migrate/seed; `better-sqlite3` adapter for Prisma 7 |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first layout for the dense concierge UI; accessible primitives (Select, Dialog, Card, Input) without a heavy bespoke component layer |
| **Forms** | React Hook Form + Zod | Client-side validation for add/edit itinerary items, with matching server-side checks (e.g. scheduled times within the reservation window) |
| **Fonts** | `next/font` | Cormorant Garamond + DM Sans on the member view; warm serif/sans pairing on the concierge side |

## Data model

Five tables, centered on one reservation → proposal workflow:

```
Member ──< Reservation ──< Proposal ──< ProposalItem
                              └──< SentEmail
```

| Table | Purpose |
|-------|---------|
| **Member** | Club member (`name`, `email`) |
| **Reservation** | A villa stay (`destination`, `villa`, `arrivalDate`, `departureDate`); belongs to one member |
| **Proposal** | An itinerary for a reservation; tracks `status` (`draft` → `sent` → `approved` → `paid`), optional concierge `notes`, and `sentAt`. Multiple proposals per reservation are allowed (e.g. alternate itinerary options) |
| **ProposalItem** | A scheduled experience (`category`, `title`, `description`, `scheduledAt`, `price`); cascades on proposal delete |
| **SentEmail** | Audit log of simulated sends (`toEmail`, `sentAt`, `bodyPreview`) |

## Assumptions

- **Single seeded member/reservation** — the dashboard loads the first reservation; enough to demo the full flow without a member picker
- **No authentication** — concierge and member routes are open; production would separate staff and guest access (e.g. magic links for proposal URLs)
- **Simulated email** — `POST /api/proposals/[id]/send` logs to the console and writes a `SentEmail` row; no SMTP
- **Simulated payment** — “Pay & Lock In” on `/proposal/[id]/pay` PATCHes status to `paid`; no payment processor
- **Draft-only mutations** — items can only be added, edited, or removed while a proposal is `draft`; sending locks the itinerary
- **Scheduled times** must fall within the reservation’s arrival–departure window (enforced on both client and API)
- **SQLite file DB** — `dev.db` is local-only; not suitable for multi-instance deployment without moving to Postgres

## What I'd improve given more time

- **Multi-member / multi-reservation support** — member picker, reservation list, switching context without hardcoding the first reservation
- **Real auth** — concierge login vs member magic-link access to proposal URLs
- **Proposal switching UI** — browse and reopen past drafts/sent proposals for the same reservation without relying on the global Proposals list
- **Richer item editing** — category changes, drag-and-drop reorder, duplicate-item shortcuts
- **Optimistic UI** — instant feedback on add/edit/remove and status transitions instead of wait-for-fetch
- **Real email** — Resend or SendGrid using the existing `SentEmail` model
- **Tests** — API integration tests (status transitions, draft-only rules, schedule validation) and Playwright flows for concierge → member → pay
- **Production database** — Postgres with connection pooling; revisit `force-dynamic` pages

## What I found most interesting or challenging

The most engaging design problem was **two UIs for the same data with opposite goals**: the concierge dashboard optimizes for speed and density, while the member proposal optimizes for trust and luxury. That split shaped the API (nested includes for reservation/member/items), the status workflow (approve on one page, pay on the next), and styling (warm internal tool vs serif-forward guest experience).

On the implementation side, **keeping validation consistent across layers** was satisfying but fiddly—Zod + React Hook Form on the client, matching checks in route handlers (draft-only edits, scheduled times within the stay window), and datetime-local min/max that respect local timezone boundaries. The **timeline view** on the member side was a good secondary challenge: grouping items by calendar day across the stay, including empty days, without off-by-one date bugs.

Practical friction on a fresh clone was **Prisma 7 + SQLite setup** (adapter, migrate-before-seed order)—worth documenting clearly so evaluators land on a populated database on the first run.
