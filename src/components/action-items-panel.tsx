"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { ActionItem } from "@/server/services/learning-assets";

const priorityClass = {
  High: "border-red-400/40 bg-red-500/10 text-red-100",
  Medium: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  Low: "border-zinc-600 bg-zinc-800 text-zinc-300",
};

export function ActionItemsPanel({ items }: { items: ActionItem[] }) {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const completedCount = useMemo(
    () => items.filter((item) => completed[item.id]).length,
    [completed, items],
  );

  if (!items.length) {
    return (
      <p className="rounded-lg border border-zinc-700 bg-[#111315] p-4 text-sm leading-6 text-zinc-400">
        Belum ada action item yang bisa diambil dari dokumen ini.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="smooth-progress h-full rounded-full bg-blue-500"
          style={{ width: `${(completedCount / items.length) * 100}%` }}
        />
      </div>
      <div className="space-y-3">
        {items.map((item) => {
          const isCompleted = Boolean(completed[item.id]);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setCompleted((current) => ({
                  ...current,
                  [item.id]: !current[item.id],
                }))
              }
              className="motion-card flex w-full items-start gap-3 rounded-lg border border-zinc-700 bg-[#111315] p-4 text-left hover:border-blue-400"
            >
              {isCompleted ? (
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-blue-300" />
              ) : (
                <Circle className="mt-1 h-5 w-5 shrink-0 text-zinc-500" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{item.title}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-6 text-zinc-400">
                  {item.detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
