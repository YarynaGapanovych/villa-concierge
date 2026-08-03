# Villa Concierge

A prototype for the Exclusive Resorts concierge itinerary brief. A concierge builds a
curated trip proposal for a member — adds scheduled experiences, writes a personal note,
previews exactly what the member will see, and sends it. The member gets a separate,
premium-branded page to review the itinerary, approve it, and complete a simulated payment.

The interesting part of this brief is the handoff between two very different UIs sharing the
same data: dense and fast for staff, calm and premium for the guest. Email and payment are
simulated on purpose — the actual focus was data modeling, API design, form validation, and
getting both sides of that UX right.

## Running it locally

Needs Node 20+ and npm (or pnpm).

```bash
git clone <repo-url>
cd villa-concierge
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open `http://localhost:3000` — that's the concierge client list. Seeding creates three
members; **James Whitfield** has a reservation at Villa Punta Mita, Mexico (Mar 15–22, 2026).
After sending a proposal, grab the member link from the console log, or use the **Member page**
button on the proposal card.

Needs a `.env` with `DATABASE_URL="file:./dev.db"`. If `db seed` complains the table doesn't
exist, run `migrate deploy` first — order matters here.

One-liner if you just want it running:

```bash
npm install && npx prisma migrate deploy && npx prisma db seed && npm run dev
```

There's also a `db:setup` script (`prisma migrate deploy && prisma db seed`) so it's
`npm install && npm run db:setup && npm run dev` if you'd rather split it up.

A couple of things worth knowing if you're poking at the Prisma setup: this repo ships with
an existing migration (`prisma/migrations/20260802142857_init`), so use `migrate deploy` to
apply it — `migrate dev --name init` is only for generating a fresh migration from scratch,
not for running an existing one. I also considered a `postinstall` hook to auto-run
migrate+seed, but skipped it — it'd re-seed on every install, which is fine for a demo but a
bad habit to build, and it can silently fail in CI without a writable DB. The `db:setup`
script felt like the safer middle ground.

## Stack

- **Next.js 16, App Router** — server components for the initial data fetch, route handlers
  colocated with the API, and file-based routing split the concierge view (`/`) from the
  member view (`/proposal/[id]`) cleanly.
- **Prisma 7 + SQLite** — typed queries, no external DB to spin up for a local eval, easy
  migrate/seed loop. Using the better-sqlite3 adapter since that's what Prisma 7 wants.
- **Tailwind + shadcn/ui** — utility classes for the dense concierge layout, shadcn for the
  accessible bits (Select, Dialog, Card, Input) without pulling in a heavier component library.
- **React Hook Form + Zod** — client-side validation on the add/edit item form, with matching
  checks server-side too (e.g. scheduled time has to fall inside the reservation dates —
  didn't want to trust the client on that one).
- **next/font** — Cormorant Garamond + DM Sans on the member view specifically; wanted that
  page to feel like a different brand voice than the internal tool.

## Data model

```
Member ──< Reservation ──< Proposal ──< ProposalItem
                              └──< SentEmail
```

- **Member** — name, email
- **Reservation** — a villa stay: destination, villa, arrival/departure dates, tied to one member
- **Proposal** — an itinerary for a reservation. Status moves draft → sent → approved → paid,
  plus an optional concierge note and `sentAt`. A reservation can have more than one proposal
  (e.g. building an alternate option without losing the first draft)
- **ProposalItem** — a scheduled experience: category, title, description, time, price.
  Cascades on delete
- **SentEmail** — a log row for every simulated send: who it went to, when, and a preview of
  the body

## Assumptions I made

- No auth anywhere. Concierge and member routes are both wide open. In a real version I'd
  expect staff login on one side and magic-link access on the proposal URLs for the other.
- Sending an email just logs to console and writes a `SentEmail` row — no SMTP.
- "Pay & Lock In" just PATCHes the proposal to `paid` — no real payment processor involved.
- Items can only be added, edited, or removed while a proposal is still a draft. Once it's
  sent, that proposal is locked — I enforce this on both the button state and the API, not
  just the UI.
- Scheduled times have to fall inside the reservation's arrival–departure window. Checked on
  both the form (so the concierge gets instant feedback) and the API (so it can't be bypassed).
- SQLite is fine for this, but it's a single local file — wouldn't survive multi-instance
  deployment without moving to Postgres.

## Stretch goals I did

Beyond the core brief, I added:

- A personal note field the concierge can attach to a proposal, shown to the member
- A day-by-day timeline view on the member side, grouped by date across the stay
- Multi-client support — a client list page at `/`, with each client's own reservation +
  proposals kept fully separate

## What I'd do with more time

- A proper way to browse and reopen past drafts/sent proposals for one reservation, instead
  of scrolling through every proposal on the client detail page
- Richer item editing — changing category after creation, drag-to-reorder, duplicating an item
- Optimistic UI updates instead of waiting on every fetch after an add/edit/status change
- Real email via Resend or SendGrid, using the `SentEmail` table that's already there
- Tests — API-level tests for the status transitions and draft-only rules, and an end-to-end
  flow test for concierge → send → member → approve → pay
- Postgres instead of SQLite if this ever needed to run as more than a single local instance

## What was interesting / hard

The core design problem was building two UIs off the same data with opposite goals — the
concierge side wants speed and density, the member side wants to feel unhurried and premium.
That split ended up shaping more than just the styling: it's why approve and pay are two
separate steps instead of one, and why the API leans on nested Prisma includes to hand each
view exactly the shape of data it needs.

Keeping validation consistent across layers was the fiddliest part — Zod + React Hook Form on
the client, the same rules checked again in the route handlers, and getting the date-range
constraint to behave correctly around timezone boundaries took a few passes. The timeline view
was its own small puzzle: grouping items by calendar day across a multi-day stay, including
empty days, without off-by-one errors creeping in at the edges of the range.

The most annoying part, honestly, wasn't the app itself — it was getting a fresh Prisma 7 +
SQLite setup working smoothly on a clean clone (adapter config, getting migrate-before-seed
order right). Worth calling out here so nobody else loses time on it.
