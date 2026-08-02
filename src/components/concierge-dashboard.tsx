"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  formatItemDateTime,
  formatPrice,
  formatStayDates,
} from "@/lib/format-dates";

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
  createdAt: string;
};

type ProposalDetails = {
  id: string;
  status: string;
  notes: string | null;
  items: ProposalItem[];
};

const emptyForm = {
  category: "",
  title: "",
  description: "",
  scheduledAt: "",
  price: "",
};

function memberFirstName(fullName: string) {
  return fullName.split(" ")[0] ?? fullName;
}

function groupItemsByCategory(items: ProposalItem[]) {
  const groups = new Map<string, ProposalItem[]>();

  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }

  return groups;
}

function ProposalMemberPreview({
  reservation,
  items,
  notes,
}: {
  reservation: ReservationData;
  items: ProposalItem[];
  notes: string;
}) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const groupedItems = groupItemsByCategory(items);

  return (
    <div className="space-y-4">
      <div className="space-y-1 border-b pb-3">
        <p className="font-medium">{reservation.member.name}</p>
        <p className="text-sm text-muted-foreground">
          {reservation.destination} · {reservation.villa}
        </p>
        <p className="text-sm">
          {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
        </p>
      </div>

      {notes.trim() && (
        <blockquote className="rounded-lg border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-sm italic">
          {notes.trim()}
        </blockquote>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No itinerary items yet.</p>
      ) : (
        <div className="space-y-4">
          {[...groupedItems.entries()].map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                {category}
              </h3>
              <ul className="space-y-2">
                {[...categoryItems]
                  .sort(
                    (a, b) =>
                      new Date(a.scheduledAt).getTime() -
                      new Date(b.scheduledAt).getTime(),
                  )
                  .map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {formatItemDateTime(item.scheduledAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatPrice(item.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

export function ConciergeDashboard({
  reservation,
}: {
  reservation: ReservationData;
}) {
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalStatus, setProposalStatus] = useState<string>("draft");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ProposalItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const notesSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotes = useRef("");
  const proposalStatusRef = useRef(proposalStatus);

  const isDraft = proposalStatus === "draft";
  const memberName = memberFirstName(reservation.member.name);

  useEffect(() => {
    proposalStatusRef.current = proposalStatus;
  }, [proposalStatus]);

  useEffect(() => {
    let cancelled = false;

    async function loadProposal() {
      setLoading(true);
      setError(null);

      try {
        const proposalsRes = await fetch("/api/proposals");
        if (!proposalsRes.ok) {
          throw new Error("Failed to load proposals");
        }

        const proposals = (await proposalsRes.json()) as ProposalSummary[];
        const forReservation = proposals
          .filter((proposal) => proposal.reservationId === reservation.id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        let current =
          forReservation.find((proposal) => proposal.status === "draft") ??
          forReservation[0];

        if (!current) {
          const createRes = await fetch("/api/proposals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reservationId: reservation.id }),
          });

          if (!createRes.ok) {
            const body = (await createRes.json()) as { error?: string };
            throw new Error(body.error ?? "Failed to create draft proposal");
          }

          current = (await createRes.json()) as ProposalSummary;
        }

        if (cancelled) {
          return;
        }

        setProposalId(current.id);
        setProposalStatus(current.status);

        if (current.status !== "draft") {
          setSuccessMessage(
            `Proposal sent to ${reservation.member.email}`,
          );
        }

        const proposalRes = await fetch(`/api/proposals/${current.id}`);
        if (!proposalRes.ok) {
          throw new Error("Failed to load proposal");
        }

        const proposal = (await proposalRes.json()) as ProposalDetails;

        if (!cancelled) {
          setItems(proposal.items);
          setNotes(proposal.notes ?? "");
          lastSavedNotes.current = proposal.notes ?? "";
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

    void loadProposal();

    return () => {
      cancelled = true;
    };
  }, [reservation.id, reservation.member.email]);

  useEffect(() => {
    return () => {
      if (notesSaveTimeout.current) {
        clearTimeout(notesSaveTimeout.current);
      }
    };
  }, []);

  async function saveNotes(nextNotes: string) {
    const normalized = nextNotes.trim();

    if (
      !proposalId ||
      proposalStatusRef.current !== "draft" ||
      normalized === lastSavedNotes.current
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: normalized || null }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save message");
      }

      lastSavedNotes.current = normalized;
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save message",
      );
    }
  }

  function handleNotesChange(value: string) {
    setNotes(value);

    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
    }

    notesSaveTimeout.current = setTimeout(() => {
      void saveNotes(value);
    }, 500);
  }

  function handleNotesBlur() {
    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
    }

    void saveNotes(notes);
  }

  async function handleSend() {
    if (!proposalId || !isDraft) {
      return;
    }

    setSending(true);
    setError(null);

    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
    }

    try {
      const response = await fetch(`/api/proposals/${proposalId}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to send proposal");
      }

      const result = (await response.json()) as {
        proposal: ProposalDetails;
      };

      setProposalStatus("sent");
      setItems(result.proposal.items);
      setNotes(result.proposal.notes ?? "");
      setSuccessMessage(`Proposal sent to ${reservation.member.email}`);
    } catch (sendError) {
      setError(
        sendError instanceof Error ? sendError.message : "Failed to send proposal",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!proposalId || !isDraft) {
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
      const response = await fetch(`/api/proposals/${proposalId}/items`, {
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
    if (!proposalId || !isDraft) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/items/${itemId}`,
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
      {successMessage && (
        <div
          className="rounded-lg border border-green-600/30 bg-green-50 px-3 py-2 text-sm text-green-900 dark:bg-green-950/40 dark:text-green-100"
          role="status"
        >
          {successMessage}
        </div>
      )}

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

        {!isDraft && (
          <p className="text-xs text-muted-foreground">
            This proposal has been sent and can no longer be edited.
          </p>
        )}

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
              disabled={!isDraft || loading}
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
              disabled={!isDraft || loading}
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
              disabled={!isDraft || loading}
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
              disabled={!isDraft || loading}
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
              disabled={!isDraft || loading}
            />
          </label>

          <div className="flex items-end lg:col-span-1">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || loading || !proposalId || !isDraft}
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
          <p className="text-sm text-muted-foreground">Loading proposal…</p>
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
                    {isDraft && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => handleRemove(item.id)}
                      >
                        <XIcon />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Preview & Send
          </h2>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                Preview
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Member preview</DialogTitle>
                  <DialogDescription>
                    This is what {reservation.member.name} will receive.
                  </DialogDescription>
                </DialogHeader>
                <ProposalMemberPreview
                  reservation={reservation}
                  items={items}
                  notes={notes}
                />
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={() => void handleSend()}
              disabled={sending || loading || !proposalId || !isDraft}
            >
              {sending ? "Sending…" : "Send Proposal"}
            </Button>
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            Message for {memberName}
          </span>
          <Textarea
            value={notes}
            onChange={(event) => handleNotesChange(event.target.value)}
            onBlur={handleNotesBlur}
            placeholder={`Add a personal note for ${memberName}…`}
            rows={3}
            disabled={!isDraft || loading}
          />
        </label>
      </section>
    </main>
  );
}
