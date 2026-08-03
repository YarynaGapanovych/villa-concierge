"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatItemDateTime, formatPrice } from "@/lib/format-dates";
import {
  toDatetimeLocalBound,
  toDatetimeLocalValue,
} from "@/lib/reservation-schedule";
import {
  createItineraryItemUpdateSchema,
  type ItineraryItemUpdateInput,
  type ItineraryItemUpdateOutput,
} from "@/lib/schemas/itinerary-item";

type ItineraryItem = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  price: number;
};

function itemToFormValues(item: ItineraryItem): ItineraryItemUpdateInput {
  return {
    title: item.title,
    description: item.description ?? "",
    scheduledAt: toDatetimeLocalValue(item.scheduledAt),
    price: String(item.price),
  };
}

export function ItineraryItemRow({
  item,
  proposalId,
  arrivalDate,
  departureDate,
  editable,
  onUpdated,
  onRemoved,
  onError,
}: {
  item: ItineraryItem;
  proposalId: string;
  arrivalDate: string;
  departureDate: string;
  editable: boolean;
  onUpdated: (item: ItineraryItem) => void;
  onRemoved: (itemId: string) => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const scheduledMin = toDatetimeLocalBound(arrivalDate, "min");
  const scheduledMax = toDatetimeLocalBound(departureDate, "max");
  const updateSchema = useMemo(
    () => createItineraryItemUpdateSchema(arrivalDate, departureDate),
    [arrivalDate, departureDate],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItineraryItemUpdateInput, unknown, ItineraryItemUpdateOutput>({
    resolver: zodResolver(updateSchema),
    defaultValues: itemToFormValues(item),
  });

  useEffect(() => {
    if (editing) {
      reset(itemToFormValues(item));
    }
  }, [editing, item, reset]);

  const onSave = handleSubmit(async (data) => {
    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/items/${item.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            description: data.description.trim() ? data.description : null,
            scheduledAt: new Date(data.scheduledAt).toISOString(),
            price: data.price,
          }),
        },
      );

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to update item");
      }

      const updated = (await response.json()) as ItineraryItem;
      onUpdated(updated);
      setEditing(false);
    } catch (updateError) {
      onError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update item",
      );
    }
  });

  async function handleRemove() {
    setRemoving(true);

    try {
      const response = await fetch(
        `/api/proposals/${proposalId}/items/${item.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to remove item");
      }

      onRemoved(item.id);
    } catch (removeError) {
      onError(
        removeError instanceof Error
          ? removeError.message
          : "Failed to remove item",
      );
    } finally {
      setRemoving(false);
    }
  }

  if (editing) {
    return (
      <li>
        <Card size="sm" className="border-stone-200/80 bg-white/80 py-3 shadow-sm shadow-stone-200/50">
          <CardContent className="space-y-3 px-3 py-0">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary">{item.category}</Badge>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Save changes"
                  disabled={isSubmitting}
                  onClick={() => void onSave()}
                >
                  <CheckIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Cancel editing"
                  disabled={isSubmitting}
                  onClick={() => setEditing(false)}
                >
                  <XIcon />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm text-stone-500">Title</span>
                <Input
                  {...register("title")}
                  aria-invalid={errors.title ? true : undefined}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-stone-500">Scheduled</span>
                <Input
                  type="datetime-local"
                  min={scheduledMin}
                  max={scheduledMax}
                  aria-invalid={errors.scheduledAt ? true : undefined}
                  {...register("scheduledAt")}
                />
                {errors.scheduledAt && (
                  <p className="text-sm text-destructive">
                    {errors.scheduledAt.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="text-sm text-stone-500">Price</span>
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-stone-500"
                  >
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="pl-6"
                    aria-invalid={errors.price ? true : undefined}
                    {...register("price")}
                  />
                </div>
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-sm text-stone-500">Description</span>
                <Textarea rows={2} {...register("description")} />
              </label>
            </div>
          </CardContent>
        </Card>
      </li>
    );
  }

  return (
    <li>
      <Card
        size="sm"
        className={`border-stone-200/80 bg-white/80 py-2 shadow-sm shadow-stone-200/50 ${editable ? "cursor-pointer transition-colors hover:bg-white/95" : ""}`}
        onClick={editable ? () => setEditing(true) : undefined}
      >
        <CardContent className="flex items-center gap-2 px-3 py-0">
          <Badge variant="secondary" className="shrink-0">
            {item.category}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-stone-900">{item.title}</p>
            {item.description && (
              <p className="truncate text-base text-stone-600">
                {item.description}
              </p>
            )}
          </div>
          <span className="shrink-0 text-base text-stone-500 tabular-nums">
            {formatItemDateTime(item.scheduledAt)}
          </span>
          <span className="shrink-0 font-[family-name:var(--font-proposal-display)] text-lg font-medium text-stone-800 tabular-nums">
            {formatPrice(item.price)}
          </span>
          {editable && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Edit ${item.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(true);
                }}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${item.title}`}
                disabled={removing}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleRemove();
                }}
              >
                <XIcon />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
