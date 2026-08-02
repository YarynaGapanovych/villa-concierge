"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ItineraryItemRow } from "@/components/itinerary-item-row";
import { ProposalPreviewDialog } from "@/components/proposal-preview-dialog";
import { ProposalStatusBadge } from "@/components/proposal-status-badge";
import { type ProposalViewData } from "@/components/proposal-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, formatShortDate } from "@/lib/format-dates";
import { toDatetimeLocalBound } from "@/lib/reservation-schedule";
import {
  createItineraryItemSchema,
  ITINERARY_CATEGORIES,
  type ItineraryItemFormInput,
  type ItineraryItemFormOutput,
} from "@/lib/schemas/itinerary-item";

const emptyProposalSendMessage =
  "Add at least one itinerary item before sending this proposal.";

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
  createdAt: string;
  sentAt: string | null;
};

function memberFirstName(fullName: string) {
  return fullName.split(" ")[0] ?? fullName;
}

function toProposalViewData(
  data: ProposalViewData,
  reservation: ReservationData,
  notesOverride?: string | null,
): ProposalViewData {
  return {
    ...data,
    notes:
      notesOverride !== undefined ? notesOverride?.trim() || null : data.notes,
    reservation: {
      destination: reservation.destination,
      villa: reservation.villa,
      arrivalDate: reservation.arrivalDate,
      departureDate: reservation.departureDate,
      member: { name: reservation.member.name },
    },
  };
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

  const totalPrice = useMemo(
    () => sortedItems.reduce((sum, item) => sum + item.price, 0),
    [sortedItems],
  );

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
      onError(emptyProposalSendMessage);
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
        proposal: ProposalDetails & {
          createdAt: string;
          sentAt: string | null;
        };
      };

      const next = result.proposal;
      setNotes(next.notes ?? "");
      lastSavedNotes.current = next.notes ?? "";
      onSendSuccess({
        id: next.id,
        status: next.status,
        notes: next.notes,
        items: next.items,
        createdAt: next.createdAt,
        sentAt: next.sentAt,
      });
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

  const isEmptyDraft = isDraft && sortedItems.length === 0;
  const sendDisabled =
    sending || disabled || !isDraft || sortedItems.length === 0;

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <ProposalStatusBadge status={proposal.status} />
        <div className="text-right text-base text-muted-foreground">
          <span className="tabular-nums">
            {sortedItems.length} {sortedItems.length === 1 ? "item" : "items"} ·{" "}
            {formatPrice(totalPrice)}
            {" · "}
            Created {formatShortDate(proposal.createdAt)}
            {proposal.sentAt
              ? ` · Sent ${formatShortDate(proposal.sentAt)}`
              : ""}
          </span>
        </div>
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
            className="flex flex-col gap-2 rounded-xl border border-border bg-background/50 p-5"
          >
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr_minmax(220px,1.5fr)_0.8fr] lg:items-start">
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
                </label>
              </div>

              {(errors.category ||
                errors.title ||
                errors.scheduledAt ||
                errors.price) && (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr_minmax(220px,1.5fr)_0.8fr]">
                  <div>
                    {errors.category?.message && (
                      <p
                        className="text-sm leading-5 text-destructive"
                        role="alert"
                      >
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                  <div>
                    {errors.title?.message && (
                      <p
                        className="text-sm leading-5 text-destructive"
                        role="alert"
                      >
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                  <div>
                    {errors.scheduledAt?.message && (
                      <p
                        className="text-sm leading-5 text-destructive"
                        role="alert"
                      >
                        {errors.scheduledAt.message}
                      </p>
                    )}
                  </div>
                  <div>
                    {errors.price?.message && (
                      <p
                        className="text-sm leading-5 text-destructive"
                        role="alert"
                      >
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <label className="flex flex-col gap-1.5">
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
        <h2 className="font-heading text-lg font-semibold tracking-[0.14em] uppercase leading-relaxed">
          Preview & Send
        </h2>

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

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            <ProposalPreviewDialog
              proposalId={proposal.id}
              memberFirstName={memberName}
              disabled={disabled}
              buildPreviewData={(data) =>
                toProposalViewData(
                  data,
                  reservation,
                  isDraft ? notes : undefined,
                )
              }
            />
            <Button
              variant="outline"
              size="sm"
              render={
                <Link
                  href={`/proposal/${proposal.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              Member page
            </Button>
            {isDraft && (
              <Button
                size="sm"
                onClick={() => void handleSend()}
                disabled={sendDisabled}
              >
                {sending ? "Sending…" : "Send Proposal"}
              </Button>
            )}
          </div>
          {isEmptyDraft && (
            <p className="max-w-sm text-right text-sm text-muted-foreground">
              {emptyProposalSendMessage}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
