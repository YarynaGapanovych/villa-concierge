import { headers } from "next/headers";

export type ReservationListItem = {
  id: string;
  destination: string;
  villa: string;
  arrivalDate: string;
  departureDate: string;
  member: {
    name: string;
    email: string;
  };
  proposals: Array<{
    id: string;
    status: string;
    createdAt: string;
    sentAt: string | null;
    items: Array<{ price: number }>;
  }>;
};

export type ReservationDetail = {
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

async function apiBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function fetchReservations(): Promise<ReservationListItem[]> {
  const response = await fetch(`${await apiBaseUrl()}/api/reservations`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reservations");
  }

  return (await response.json()) as ReservationListItem[];
}

export async function fetchReservation(
  id: string,
): Promise<ReservationDetail | null> {
  const response = await fetch(`${await apiBaseUrl()}/api/reservations/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch reservation");
  }

  return (await response.json()) as ReservationDetail;
}
