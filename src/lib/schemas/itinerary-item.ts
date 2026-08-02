import { z } from "zod";

import {
  isWithinReservationSchedule,
  reservationScheduleErrorMessage,
} from "@/lib/reservation-schedule";

export const ITINERARY_CATEGORIES = [
  "Dining",
  "Activities",
  "Wellness",
  "Excursions",
  "Transport",
  "Experiences",
] as const;

export function createItineraryItemSchema(
  arrivalDate: string,
  departureDate: string,
) {
  return z.object({
    category: z
      .string()
      .min(1, "Category is required")
      .refine(
        (value): value is (typeof ITINERARY_CATEGORIES)[number] =>
          ITINERARY_CATEGORIES.includes(
            value as (typeof ITINERARY_CATEGORIES)[number],
          ),
        "Select a valid category",
      ),
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    scheduledAt: z
      .string()
      .min(1, "Scheduled time is required")
      .refine(
        (value) =>
          isWithinReservationSchedule(value, arrivalDate, departureDate),
        reservationScheduleErrorMessage(arrivalDate, departureDate),
      ),
    price: z
      .string()
      .min(1, "Price is required")
      .refine((value) => !Number.isNaN(Number(value)), "Price must be a number")
      .transform((value) => Number(value))
      .pipe(z.number().min(0, "Price must be 0 or greater")),
  });
}

export type ItineraryItemFormInput = z.input<
  ReturnType<typeof createItineraryItemSchema>
>;

export type ItineraryItemFormOutput = z.output<
  ReturnType<typeof createItineraryItemSchema>
>;
