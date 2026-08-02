export function getReservationScheduleBounds(
  arrivalDate: string,
  departureDate: string,
) {
  const start = new Date(arrivalDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(departureDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function isWithinReservationSchedule(
  scheduledAt: Date | string,
  arrivalDate: string,
  departureDate: string,
) {
  const scheduled =
    scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);

  if (Number.isNaN(scheduled.getTime())) {
    return false;
  }

  const { start, end } = getReservationScheduleBounds(
    arrivalDate,
    departureDate,
  );

  return scheduled >= start && scheduled <= end;
}

export function toDatetimeLocalBound(isoDate: string, bound: "min" | "max") {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, "0");
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  return bound === "min" ? `${datePart}T00:00` : `${datePart}T23:59`;
}

export function toDatetimeLocalValue(isoDate: string) {
  const date = new Date(isoDate);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatReservationScheduleRange(
  arrivalDate: string,
  departureDate: string,
) {
  const arrival = new Date(arrivalDate);
  const departure = new Date(departureDate);

  const formatPart = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${formatPart(arrival)} – ${formatPart(departure)}, ${departure.getFullYear()}`;
}

export function reservationScheduleErrorMessage(
  arrivalDate: string,
  departureDate: string,
) {
  return `Scheduled time must fall within the reservation dates (${formatReservationScheduleRange(arrivalDate, departureDate)}).`;
}
