import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "teal" | "amber" | "rose" | "stone";
}) {
  return (
    <section className="rounded-lg border border-zinc-700 bg-[#151719] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-700/70 text-zinc-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-4xl font-semibold tracking-normal text-white">{value}</p>
          <p className="mt-1 text-sm text-zinc-300">{label}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-500">{detail}</p>
    </section>
  );
}
