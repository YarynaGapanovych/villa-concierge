export function formatStayDates(arrival: string, departure: string) {
  const arrivalDate = new Date(arrival);
  const departureDate = new Date(departure);

  const formatPart = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${formatPart(arrivalDate)} → ${formatPart(departureDate)}, ${departureDate.getFullYear()}`;
}

export function formatItemDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPriceDetailed(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimelineDayLabel(dayNumber: number, date: Date) {
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `Day ${dayNumber} — ${formatted}`;
}

export function formatItemTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
