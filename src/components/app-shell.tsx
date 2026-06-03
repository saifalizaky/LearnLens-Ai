"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  FileText,
  GraduationCap,
  House,
  MessageSquareText,
} from "lucide-react";
import type { ReactNode } from "react";
import { LearnLensLogo } from "@/components/learnlens-logo";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Home", href: "/", icon: House },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Chat", href: "/chat", icon: MessageSquareText },
  { label: "Quiz", href: "/quiz", icon: GraduationCap },
  { label: "Study Hub", href: "/study", icon: BookOpenCheck },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <div className="min-h-screen bg-[#050607] text-zinc-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#050607] text-zinc-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-800 bg-[#0b0d10] px-4 py-6 shadow-[24px_0_60px_rgba(0,0,0,0.45)] lg:block">
        <Link
          href="/"
          className="motion-button block rounded-lg px-1 py-1 text-left"
        >
          <LearnLensLogo className="w-52" />
        </Link>

        <nav className="mt-10 space-y-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                  "motion-button",
                  isActive
                    ? "bg-blue-500/80 text-white shadow-[0_12px_32px_rgba(59,130,246,0.28)]"
                    : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="flex items-center gap-3 rounded-lg border-t border-zinc-800 pt-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold text-white">
              U
            </span>
            <span className="text-base font-medium text-zinc-300">Study Workspace</span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-[#0b0d10]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="motion-button block w-44"
            >
              <LearnLensLogo />
            </Link>
          </div>
          <nav className="mt-3 grid grid-cols-6 gap-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex h-10 items-center justify-center rounded-lg border text-sm transition-colors",
                    "motion-button",
                    isActive
                      ? "border-blue-400 bg-blue-500/80 text-white"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
