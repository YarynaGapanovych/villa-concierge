"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinIcon, PlusIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ItineraryItemRow } from "@/components/itinerary-item-row";
import { Button } from "@/components/ui/button";
import {
  Card,
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
import {
  toDatetimeLocalBound,
} from "@/lib/reservation-schedule";
import {
  createItineraryItemSchema,
  ITINERARY_CATEGORIES,
  type ItineraryItemFormInput,
  type ItineraryItemFormOutput,
} from "@/lib/schemas/itinerary-item";

const defaultItemFormValues: ItineraryItemFormInput = {
  category: "",
  title: "",
  description: "",
  scheduledAt: "",
  price: "",
};

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
        <p className="text-base text-muted-foreground">
          {reservation.destination} · {reservation.villa}
        </p>
        <p className="text-base">
          {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
        </p>
      </div>

      {notes.trim() && (
        <blockquote className="rounded-lg border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-base italic">
          {notes.trim()}
        </blockquote>
      )}

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">
          No itinerary items yet.
        </p>
      ) : (
        <div className="space-y-4">
          {[...groupedItems.entries()].map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
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
                      className="flex items-start justify-between gap-3 text-base"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground tabular-nums">
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

      <div className="flex items-center justify-between border-t pt-3 text-base font-semibold">
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
  const [loading, setLoading] = useState(true);
  const [creatingProposal, setCreatingProposal] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const notesSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotes = useRef("");
  const proposalStatusRef = useRef(proposalStatus);

  const isDraft = proposalStatus === "draft";
  const memberName = memberFirstName(reservation.member.name);
  const scheduledMin = toDatetimeLocalBound(reservation.arrivalDate, "min");
  const scheduledMax = toDatetimeLocalBound(reservation.departureDate, "max");
  const itineraryItemSchema = useMemo(
    () =>
      createItineraryItemSchema(
        reservation.arrivalDate,
        reservation.departureDate,
      ),
    [reservation.arrivalDate, reservation.departureDate],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItineraryItemFormInput, unknown, ItineraryItemFormOutput>({
    resolver: zodResolver(itineraryItemSchema),
    defaultValues: defaultItemFormValues,
  });

  useEffect(() => {
    proposalStatusRef.current = proposalStatus;
  }, [proposalStatus]);

  function applyProposal(proposal: ProposalDetails, id: string, status: string) {
    setProposalId(id);
    setProposalStatus(status);
    setItems(proposal.items);
    setNotes(proposal.notes ?? "");
    lastSavedNotes.current = proposal.notes ?? "";
    setSuccessMessage(
      status !== "draft" ? `Proposal sent to ${reservation.member.email}` : null,
    );
  }

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

        const proposalRes = await fetch(`/api/proposals/${current.id}`);
        if (!proposalRes.ok) {
          throw new Error("Failed to load proposal");
        }

        const proposal = (await proposalRes.json()) as ProposalDetails;

        if (!cancelled) {
          applyProposal(proposal, current.id, current.status);
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
        saveError instanceof Error
          ? saveError.message
          : "Failed to save message",
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
        sendError instanceof Error
          ? sendError.message
          : "Failed to send proposal",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleNewProposal() {
    setCreatingProposal(true);
    setError(null);

    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation.id }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to create proposal");
      }

      const created = (await response.json()) as ProposalDetails & {
        id: string;
        status: string;
      };

      applyProposal(created, created.id, created.status);
      reset(defaultItemFormValues);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create proposal",
      );
    } finally {
      setCreatingProposal(false);
    }
  }

  function handleItemUpdated(updatedItem: ProposalItem) {
    setItems((current) =>
      [...current.filter((item) => item.id !== updatedItem.id), updatedItem].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    );
  }

  function handleItemRemoved(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  const onAddItem = handleSubmit(async (data) => {
    if (!proposalId || !isDraft) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/proposals/${proposalId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: data.category,
          title: data.title,
          description: data.description.trim() ? data.description : null,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
          price: data.price,
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
            new Date(a.scheduledAt).getTime() -
            new Date(b.scheduledAt).getTime(),
        ),
      );
      reset(defaultItemFormValues);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add item",
      );
    }
  });

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-4">
      {successMessage && (
        <div
          className="rounded-lg border border-green-600/30 bg-green-50 px-3 py-2 text-base text-green-900 dark:bg-green-950/40 dark:text-green-100"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <Card className="[--card-spacing:--spacing(5)]">
        <CardHeader className="gap-4 pb-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
                {reservation.member.name}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {reservation.member.email}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {proposalId && (
                <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium tracking-wide uppercase">
                  {proposalStatus}
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || creatingProposal}
                onClick={() => void handleNewProposal()}
              >
                <PlusIcon className="size-4" aria-hidden="true" />
                {creatingProposal ? "Creating…" : "New Proposal"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-base font-semibold">
              <MapPinIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span>
                {reservation.destination} · {reservation.villa}
              </span>
            </div>

            <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/60 px-3 py-1.5 text-base font-semibold tabular-nums">
              {formatStayDates(
                reservation.arrivalDate,
                reservation.departureDate,
              )}
            </span>
          </div>
        </CardHeader>
      </Card>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-semibold tracking-[0.14em] uppercase leading-relaxed">
            Add Itinerary Item
          </h2>
          {items.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {items.length} items · {formatPrice(total)}
            </span>
          )}
        </div>

        {!isDraft && (
          <p className="text-sm text-muted-foreground">
            This proposal has been sent and can no longer be edited. Start a new
            proposal to build another itinerary option.
          </p>
        )}

        {isDraft && items.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Click an item to edit title, description, schedule, or price.
          </p>
        )}

        <form
          onSubmit={onAddItem}
          className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-6"
        >
          <label className="space-y-1.5 lg:col-span-1">
            <span className="text-xs leading-relaxed text-muted-foreground">Category</span>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                  disabled={!isDraft || loading}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={errors.category ? true : undefined}
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITINERARY_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive" role="alert">
                {errors.category.message}
              </p>
            )}
          </label>

          <label className="space-y-1.5 lg:col-span-1">
            <span className="text-xs leading-relaxed text-muted-foreground">Title</span>
            <Input
              {...register("title")}
              placeholder="Sunset dinner"
              disabled={!isDraft || loading}
              aria-invalid={errors.title ? true : undefined}
            />
            {errors.title && (
              <p className="text-xs text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </label>

          <label className="space-y-1.5 lg:col-span-1">
            <span className="text-xs leading-relaxed text-muted-foreground">Scheduled</span>
            <Input
              type="datetime-local"
              min={scheduledMin}
              max={scheduledMax}
              disabled={!isDraft || loading}
              aria-invalid={errors.scheduledAt ? true : undefined}
              {...register("scheduledAt")}
            />
            {errors.scheduledAt && (
              <p className="text-xs text-destructive" role="alert">
                {errors.scheduledAt.message}
              </p>
            )}
          </label>

          <label className="space-y-1.5 lg:col-span-1">
            <span className="text-xs leading-relaxed text-muted-foreground">Price</span>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground"
              >
                $
              </span>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                className="pl-6"
                disabled={!isDraft || loading}
                aria-invalid={errors.price ? true : undefined}
                {...register("price")}
              />
            </div>
            {errors.price && (
              <p className="text-xs text-destructive" role="alert">
                {errors.price.message}
              </p>
            )}
          </label>

          <div className="flex items-end lg:col-span-1">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || loading || !proposalId || !isDraft}
            >
              {isSubmitting ? "Adding…" : "Add item"}
            </Button>
          </div>

          <label className="space-y-1.5 sm:col-span-2 lg:col-span-6">
            <span className="text-xs leading-relaxed text-muted-foreground">Description</span>
            <Textarea
              {...register("description")}
              placeholder="Optional notes for the member"
              rows={2}
              disabled={!isDraft || loading}
            />
          </label>
        </form>

        {error && (
          <p className="text-base text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-base font-semibold tracking-[0.14em] uppercase leading-relaxed">
          Itinerary ({items.length})
        </h2>

        {loading ? (
          <p className="text-base text-muted-foreground">Loading proposal…</p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-base text-muted-foreground">
            No items yet. Add the first experience above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <ItineraryItemRow
                key={item.id}
                item={item}
                proposalId={proposalId!}
                arrivalDate={reservation.arrivalDate}
                departureDate={reservation.departureDate}
                editable={isDraft}
                onUpdated={handleItemUpdated}
                onRemoved={handleItemRemoved}
                onError={setError}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold tracking-[0.14em] uppercase leading-relaxed">
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

        <label className="block space-y-1.5">
          <span className="text-xs leading-relaxed text-muted-foreground">
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
