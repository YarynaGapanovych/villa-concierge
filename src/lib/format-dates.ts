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
