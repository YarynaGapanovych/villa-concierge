export function memberFirstName(fullName: string) {
  return fullName.split(" ")[0] ?? fullName;
}

export type ProposalItemData = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  price: number;
};

export function groupItemsByCategory(items: ProposalItemData[]) {
  const groups = new Map<string, ProposalItemData[]>();

  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }

  return groups;
}

export type StayDay = {
  dayNumber: number;
  dateKey: string;
  date: Date;
};

export function toLocalDateKey(value: string | Date) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getStayDays(
  arrivalDate: string,
  departureDate: string,
): StayDay[] {
  const days: StayDay[] = [];
  const start = new Date(arrivalDate);
  const end = new Date(departureDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const current = new Date(start);
  let dayNumber = 1;

  while (current <= end) {
    days.push({
      dayNumber,
      dateKey: toLocalDateKey(current),
      date: new Date(current),
    });
    current.setDate(current.getDate() + 1);
    dayNumber += 1;
  }

  return days;
}

export function groupItemsByDay(
  items: ProposalItemData[],
  arrivalDate: string,
  departureDate: string,
) {
  const days = getStayDays(arrivalDate, departureDate);
  const itemsByDay = new Map<string, ProposalItemData[]>();

  for (const day of days) {
    itemsByDay.set(day.dateKey, []);
  }

  for (const item of items) {
    const dateKey = toLocalDateKey(item.scheduledAt);
    const dayItems = itemsByDay.get(dateKey);

    if (dayItems) {
      dayItems.push(item);
    }
  }

  return days.map((day) => ({
    ...day,
    items: (itemsByDay.get(day.dateKey) ?? []).sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    ),
  }));
}
