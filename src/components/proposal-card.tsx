"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ItineraryItemRow } from "@/components/itinerary-item-row";
import { Button } from "@/components/ui/button";
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
import { toDatetimeLocalBound } from "@/lib/reservation-schedule";
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

export type ProposalItem = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  price: number;
};

export type ProposalDetails = {
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
        <p className="text-lg text-muted-foreground">
          {reservation.destination} · {reservation.villa}
        </p>
        <p className="text-lg">
          {formatStayDates(reservation.arrivalDate, reservation.departureDate)}
        </p>
      </div>

      {notes.trim() && (
        <blockquote className="rounded-lg border-l-2 border-primary/40 bg-muted/40 px-3 py-2 text-lg italic">
          {notes.trim()}
        </blockquote>
      )}

      {items.length === 0 ? (
        <p className="text-lg text-muted-foreground">
          No itinerary items yet.
        </p>
      ) : (
        <div className="space-y-4">
          {[...groupedItems.entries()].map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-base font-semibold tracking-wide uppercase text-muted-foreground">
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
                      className="flex items-start justify-between gap-3 text-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-base text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <p className="text-base text-muted-foreground tabular-nums">
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

      <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

export function ProposalCard({
  proposal,
  reservation,
  disabled = false,
  onUpdate,
  onSendSuccess,
  onError,
}: {
  proposal: ProposalDetails;
  reservation: ReservationData;
  disabled?: boolean;
  onUpdate: (next: ProposalDetails) => void;
  onSendSuccess: (next: ProposalDetails) => void;
  onError: (message: string) => void;
}) {
  const isDraft = proposal.status === "draft";
  const memberName = memberFirstName(reservation.member.name);
  const scheduledMin = toDatetimeLocalBound(reservation.arrivalDate, "min");
  const scheduledMax = toDatetimeLocalBound(reservation.departureDate, "max");
  const [notes, setNotes] = useState(proposal.notes ?? "");
  const [sending, setSending] = useState(false);
  const notesSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotes = useRef(proposal.notes ?? "");
  const proposalStatusRef = useRef(proposal.status);

  const sortedItems = useMemo(
    () =>
      [...proposal.items].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      ),
    [proposal.items],
  );

  const total = sortedItems.reduce((sum, item) => sum + item.price, 0);

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
    proposalStatusRef.current = proposal.status;
  }, [proposal.status]);

  useEffect(() => {
    setNotes(proposal.notes ?? "");
    lastSavedNotes.current = proposal.notes ?? "";
  }, [proposal.id, proposal.notes]);

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
      proposalStatusRef.current !== "draft" ||
      normalized === lastSavedNotes.current
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: normalized || null }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save message");
      }

      lastSavedNotes.current = normalized;
      onUpdate({ ...proposal, notes: normalized || null });
    } catch (saveError) {
      onError(
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
    if (!isDraft) {
      return;
    }

    if (sortedItems.length === 0) {
      onError("Add at least one itinerary item before sending.");
      return;
    }

    setSending(true);

    if (notesSaveTimeout.current) {
      clearTimeout(notesSaveTimeout.current);
    }

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/send`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to send proposal");
      }

      const result = (await response.json()) as {
        proposal: ProposalDetails;
      };

      const next = result.proposal;
      setNotes(next.notes ?? "");
      lastSavedNotes.current = next.notes ?? "";
      onSendSuccess(next);
    } catch (sendError) {
      onError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send proposal",
      );
    } finally {
      setSending(false);
    }
  }

  function handleItemUpdated(updatedItem: ProposalItem) {
    const nextItems = [
      ...proposal.items.filter((item) => item.id !== updatedItem.id),
      updatedItem,
    ].sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

    onUpdate({ ...proposal, items: nextItems });
  }

  function handleItemRemoved(itemId: string) {
    onUpdate({
      ...proposal,
      items: proposal.items.filter((item) => item.id !== itemId),
    });
  }

  const onAddItem = handleSubmit(async (data) => {
    if (!isDraft) {
      return;
    }

    try {
      const response = await fetch(`/api/proposals/${proposal.id}/items`, {
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
      const nextItems = [...proposal.items, item].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );

      onUpdate({ ...proposal, items: nextItems });
      reset(defaultItemFormValues);
    } catch (submitError) {
      onError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add item",
      );
    }
  });

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-3 py-1 text-sm font-medium tracking-wide uppercase">
          {proposal.status}
        </span>
        <span className="text-base text-muted-foreground">
          {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"}
          {sortedItems.length > 0 && <> · {formatPrice(total)}</>}
        </span>
      </div>

      {isDraft ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="font-heading text-lg font-semibold tracking-[0.14em] uppercase leading-relaxed">
              Add Itinerary Item
            </h2>
            {sortedItems.length > 0 && (
              <p className="text-base text-muted-foreground">
                Click an item below to edit title, description, schedule, or
                price.
              </p>
            )}
          </div>

          <form
            onSubmit={onAddItem}
            className="flex flex-col gap-4 rounded-xl border border-border bg-background/50 p-5"
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr_minmax(220px,1.5fr)_0.8fr] lg:items-end">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-sm leading-relaxed text-muted-foreground">
                  Category
                </span>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className="h-9 w-full"
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
                  <p className="text-sm text-destructive" role="alert">
                    {errors.category.message}
                  </p>
                )}
              </label>

              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-sm leading-relaxed text-muted-foreground">
                  Title
                </span>
                <Input
                  {...register("title")}
                  placeholder="Sunset dinner"
                  disabled={disabled}
                  aria-invalid={errors.title ? true : undefined}
                />
                {errors.title && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.title.message}
                  </p>
                )}
              </label>

              <label className="flex min-w-0 flex-col gap-1.5 lg:min-w-[220px]">
                <span className="text-sm leading-relaxed text-muted-foreground">
                  Scheduled
                </span>
                <Input
                  type="datetime-local"
                  min={scheduledMin}
                  max={scheduledMax}
                  disabled={disabled}
                  aria-invalid={errors.scheduledAt ? true : undefined}
                  className="min-w-[220px]"
                  {...register("scheduledAt")}
                />
                {errors.scheduledAt && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.scheduledAt.message}
                  </p>
                )}
              </label>

              <label className="flex min-w-0 flex-col gap-1.5">
                <span className="text-sm leading-relaxed text-muted-foreground">
                  Price
                </span>
                <div className="relative w-full">
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
                    disabled={disabled}
                    aria-invalid={errors.price ? true : undefined}
                    {...register("price")}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.price.message}
                  </p>
                )}
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm leading-relaxed text-muted-foreground">
                Description
              </span>
              <Textarea
                {...register("description")}
                placeholder="Optional notes for the member"
                rows={2}
                disabled={disabled}
              />
            </label>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-9 w-full sm:w-auto sm:min-w-[7.5rem]"
                disabled={isSubmitting || disabled}
              >
                {isSubmitting ? "Adding…" : "Add item"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <p className="text-base text-muted-foreground">
          This proposal has been sent and can no longer be edited.
        </p>
      )}

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold tracking-[0.14em] uppercase leading-relaxed">
          Itinerary ({sortedItems.length})
        </h2>

        {sortedItems.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-6 text-lg text-muted-foreground">
            {isDraft
              ? "No items yet. Add the first experience above."
              : "No items in this proposal."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {sortedItems.map((item) => (
              <ItineraryItemRow
                key={item.id}
                item={item}
                proposalId={proposal.id}
                arrivalDate={reservation.arrivalDate}
                departureDate={reservation.departureDate}
                editable={isDraft}
                onUpdated={handleItemUpdated}
                onRemoved={handleItemRemoved}
                onError={onError}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold tracking-[0.14em] uppercase leading-relaxed">
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
                  items={sortedItems}
                  notes={notes}
                />
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              onClick={() => void handleSend()}
              disabled={
                sending || disabled || !isDraft || sortedItems.length === 0
              }
            >
              {sending ? "Sending…" : "Send Proposal"}
            </Button>
          </div>
        </div>

        {isDraft && sortedItems.length === 0 && (
          <p className="text-base text-muted-foreground">
            Add at least one itinerary item before sending this proposal.
          </p>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm leading-relaxed text-muted-foreground">
            Message for {memberName}
          </span>
          <Textarea
            value={notes}
            onChange={(event) => handleNotesChange(event.target.value)}
            onBlur={handleNotesBlur}
            placeholder={`Add a personal note for ${memberName}…`}
            rows={3}
            disabled={!isDraft || disabled}
            readOnly={!isDraft}
          />
        </label>
      </div>
    </section>
  );
}
