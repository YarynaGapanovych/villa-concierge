"use client";

import { useState } from "react";

import {
  formatItemDateTime,
  formatItemTime,
  formatPriceDetailed,
  formatTimelineDayLabel,
} from "@/lib/format-dates";
import {
  groupItemsByCategory,
  groupItemsByDay,
  type ProposalItemData,
} from "@/lib/proposal-utils";

type ViewMode = "list" | "timeline";

function ItineraryItemRow({
  item,
  showCategory = false,
  showFullDateTime = true,
}: {
  item: ProposalItemData;
  showCategory?: boolean;
  showFullDateTime?: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {showCategory && (
          <p className="text-xs tracking-[0.2em] text-stone-500 uppercase">
            {item.category}
          </p>
        )}
        <p className="font-[family-name:var(--font-proposal-display)] text-xl font-medium text-stone-900">
          {item.title}
        </p>
        {item.description && (
          <p className="max-w-prose text-sm leading-relaxed text-stone-600">
            {item.description}
          </p>
        )}
        <p className="text-xs tracking-wide text-stone-500 uppercase">
          {showFullDateTime
            ? formatItemDateTime(item.scheduledAt)
            : formatItemTime(item.scheduledAt)}
        </p>
      </div>
      <p className="shrink-0 font-[family-name:var(--font-proposal-display)] text-lg font-medium text-stone-800 tabular-nums">
        {formatPriceDetailed(item.price)}
      </p>
    </li>
  );
}

function CategorySection({
  category,
  items,
}: {
  category: string;
  items: ProposalItemData[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white/80 shadow-sm shadow-stone-200/50 backdrop-blur-sm">
      <header className="border-b border-stone-100 px-6 py-4">
        <h2 className="font-[family-name:var(--font-proposal-display)] text-2xl font-medium tracking-wide text-stone-800">
          {category}
        </h2>
      </header>
      <ul className="divide-y divide-stone-100">
        {items.map((item) => (
          <ItineraryItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function DaySection({
  dayNumber,
  date,
  items,
}: {
  dayNumber: number;
  date: Date;
  items: ProposalItemData[];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white/80 shadow-sm shadow-stone-200/50 backdrop-blur-sm">
      <header className="border-b border-stone-100 px-6 py-4">
        <h2 className="font-[family-name:var(--font-proposal-display)] text-2xl font-medium tracking-wide text-stone-800">
          {formatTimelineDayLabel(dayNumber, date)}
        </h2>
      </header>
      {items.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-stone-500 italic">
          Nothing scheduled yet
        </p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((item) => (
            <ItineraryItemRow
              key={item.id}
              item={item}
              showCategory
              showFullDateTime={false}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-stone-200 bg-white/70 p-1 shadow-sm"
      role="tablist"
      aria-label="Itinerary view"
    >
      {(
        [
          { id: "list", label: "List View" },
          { id: "timeline", label: "Timeline View" },
        ] as const
      ).map((option) => {
        const isActive = view === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`rounded-full px-5 py-2 font-[family-name:var(--font-proposal-display)] text-sm tracking-wide transition-all ${
              isActive
                ? "bg-stone-900 text-stone-50 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function MemberProposalItinerary({
  items,
  arrivalDate,
  departureDate,
}: {
  items: ProposalItemData[];
  arrivalDate: string;
  departureDate: string;
}) {
  const [view, setView] = useState<ViewMode>("list");
  const groupedItems = groupItemsByCategory(items);
  const timelineDays = groupItemsByDay(items, arrivalDate, departureDate);

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <ViewToggle view={view} onChange={setView} />
      </div>

      <div
        key={view}
        className="space-y-8 animate-in fade-in duration-300 fill-mode-both"
      >
        {view === "list" ? (
          items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-200 bg-white/60 px-6 py-12 text-center text-stone-600">
              Your concierge is still adding experiences to this itinerary.
            </p>
          ) : (
            [...groupedItems.entries()].map(([category, categoryItems]) => (
              <CategorySection
                key={category}
                category={category}
                items={[...categoryItems].sort(
                  (a, b) =>
                    new Date(a.scheduledAt).getTime() -
                    new Date(b.scheduledAt).getTime(),
                )}
              />
            ))
          )
        ) : (
          timelineDays.map((day) => (
            <DaySection
              key={day.dateKey}
              dayNumber={day.dayNumber}
              date={day.date}
              items={day.items}
            />
          ))
        )}
      </div>
    </div>
  );
}
