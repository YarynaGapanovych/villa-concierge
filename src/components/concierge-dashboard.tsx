"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatItemDateTime, formatPrice, formatStayDates } from "@/lib/format-dates";

const CATEGORIES = [
  "Dining",
  "Activities",
  "Wellness",
  "Excursions",
  "Transport",
  "Experiences",
] as const;

type ReservationData = {
  id: string;
  destination: string;
  villa: string;
  arrivalDate: string;
  departureDate: string;
  member: {
    name: string;
    email: string;
  };
};

type ProposalItem = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  price: number;
};

type ProposalSummary = {
  id: string;
  reservationId: string;
  status: string;
};

const emptyForm = {
  category: "",
  title: "",
  description: "",
  scheduledAt: "",
  price: "",
};

export function ConciergeDashboard({
  reservation,
}: {
  reservation: ReservationData;
}) {
  const [draftProposalId, setDraftProposalId] = useState<string | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDraftProposal() {
      setLoading(true);
      setError(null);

      try {
        const proposalsRes = await fetch("/api/proposals");
        if (!proposalsRes.ok) {
          throw new Error("Failed to load proposals");
        }

        const proposals = (await proposalsRes.json()) as ProposalSummary[];
        let draft = proposals.find(
          (proposal) =>
            proposal.reservationId === reservation.id &&
            proposal.status === "draft",
        );

        if (!draft) {
          const createRes = await fetch("/api/proposals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId: reservation.id }),
          });

          if (!createRes.ok) {
            const body = (await createRes.json()) as { error?: string };
            throw new Error(body.error ?? "Failed to create draft proposal");
          }

          draft = (await createRes.json()) as ProposalSummary;
        }

        if (cancelled) {
          return;
        }

        setDraftProposalId(draft.id);

        const proposalRes = await fetch(`/api/proposals/${draft.id}`);
        if (!proposalRes.ok) {
          throw new Error("Failed to load draft proposal");
        }

        const proposal = (await proposalRes.json()) as { items: ProposalItem[] };

        if (!cancelled) {
          setItems(proposal.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to initialize dashboard",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDraftProposal();

    return () => {
      cancelled = true;
    };
  }, [reservation.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftProposalId) {
      return;
    }

    const price = Number(form.price);
    if (!form.category || !form.title || !form.scheduledAt || Number.isNaN(price)) {
      setError("Category, title, scheduled time, and price are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/proposals/${draftProposalId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          title: form.title,
          description: form.description.trim() ? form.description : null,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          price,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to add item");
      }

      const item = (await response.json()) as ProposalItem;
      setItems((current) =>
        [...current, item].sort(
          (a, b) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        ),
      );
      setForm(emptyForm);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to add item",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(itemId: string) {
    if (!draftProposalId) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/proposals/${draftProposalId}/items/${itemId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove item");
      }

      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Failed to remove item",
      );
    }
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4">
      <Card>
        <CardHeader className="gap-0.5 pb-2">
          <CardTitle className="text-lg">{reservation.member.name}</CardTitle>
          <CardDescription className="text-sm">
            {reservation.destination} · {reservation.villa}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">
            {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
          </span>
          <span className="text-muted-foreground">{reservation.member.email}</span>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Add Itinerary Item
          </h2>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {items.length} items · {formatPrice(total)}
            </span>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          <label className="space-y-1 lg:col-span-1">
            <span className="text-xs text-muted-foreground">Category</span>
            <Select
              value={form.category || null}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, category: value ?? "" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-1 lg:col-span-1">
            <span className="text-xs text-muted-foreground">Title</span>
            <Input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Sunset dinner"
              required
            />
          </label>

          <label className="space-y-1 sm:col-span-2 lg:col-span-1">
            <span className="text-xs text-muted-foreground">Description</span>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional notes"
              rows={1}
              className="min-h-8 field-sizing-fixed resize-none py-1.5"
            />
          </label>

          <label className="space-y-1 lg:col-span-1">
            <span className="text-xs text-muted-foreground">Scheduled</span>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  scheduledAt: event.target.value,
                }))
              }
              required
            />
          </label>

          <label className="space-y-1 lg:col-span-1">
            <span className="text-xs text-muted-foreground">Price</span>
            <Input
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="0"
              required
            />
          </label>

          <div className="flex items-end lg:col-span-1">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || loading || !draftProposalId}
            >
              {submitting ? "Adding…" : "Add item"}
            </Button>
          </div>
        </form>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Itinerary ({items.length})
        </h2>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading draft proposal…</p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
            No items yet. Add the first experience above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <Card size="sm" className="py-2">
                  <CardContent className="flex items-center gap-2 px-3 py-0">
                    <Badge variant="secondary" className="shrink-0">
                      {item.category}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      {item.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatItemDateTime(item.scheduledAt)}
                    </span>
                    <span className="shrink-0 text-sm font-medium tabular-nums">
                      {formatPrice(item.price)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => handleRemove(item.id)}
                    >
                      <XIcon />
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
