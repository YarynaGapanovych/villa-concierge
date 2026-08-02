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
