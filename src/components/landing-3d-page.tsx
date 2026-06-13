"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowDown,
  BarChart3,
  FileText,
  GraduationCap,
  MessageSquareText,
} from "lucide-react";
import { useRef } from "react";
import { LearnLensLogo } from "@/components/learnlens-logo";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { CursorSpotlight } from "@/components/ui/cursor-spotlight";
import { HoverButton } from "@/components/ui/hover-button";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

const heroTitle = "Belajar Lebih Cepat, Paham Lebih Dalam";
const splineSceneUrl =
  "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

const previewCards = [
  {
    label: "Upload PDF",
    detail: "Ekstraksi teks.",
    icon: FileText,
  },
  {
    label: "AI Chat",
    detail: "Chat konteks.",
    icon: MessageSquareText,
  },
  {
    label: "Quiz Otomatis",
    detail: "Soal otomatis.",
    icon: GraduationCap,
  },
];

function RevealHeadline({ title }: { title: string }) {
  const words = title.split(" ");

  return (
    <h1
      aria-label={title}
      className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl"
    >
      <span aria-hidden="true">
        {words.map((word, wordIndex) => (
          <span
            key={`${word}-${wordIndex}`}
            className="mr-3 inline-block overflow-hidden pb-1 align-bottom last:mr-0 sm:mr-4"
          >
            <motion.span
              className="inline-block"
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                delay: 0.08 + wordIndex * 0.08,
                type: "spring",
                stiffness: 150,
                damping: 24,
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  );
}

export function Landing3DPage() {
  const previewRef = useRef<HTMLElement>(null);

  function scrollToPreview() {
    previewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050607] text-white">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-20 text-center">
        <Link
          href="/"
          className="motion-button absolute left-5 top-5 z-20 block w-48 rounded-lg sm:left-8 sm:top-7 sm:w-56"
          aria-label="LearnLens AI home"
        >
          <LearnLensLogo />
        </Link>
        <Spotlight className="-top-48 left-1/2 -translate-x-1/2" fill="#ffffff" />
        <div className="absolute inset-0 hidden opacity-70 sm:block">
          <SplineScene scene={splineSceneUrl} className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(5,6,7,0.18)_0%,rgba(5,6,7,0.55)_45%,rgba(5,6,7,0.96)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:54px_54px]" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          className="pointer-events-none relative z-10 mx-auto flex max-w-5xl flex-col items-center"
        >
          <RevealHeadline title={heroTitle} />
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            Nggak perlu lagi pusing baca ratusan halaman. Biarkan LearnLens AI
            yang membedah intisarinya, merangkum poin penting, dan membuatkan
            soal latihan buat kamu.
          </p>
          <HoverButton
            type="button"
            onClick={scrollToPreview}
            className="motion-button pointer-events-auto mt-8 inline-flex h-12 items-center justify-center gap-2 text-white shadow-[0_18px_48px_rgba(59,130,246,0.34)]"
          >
            Let&apos;s Go
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </HoverButton>
        </motion.div>
      </section>

      <section
        id="dashboard-preview"
        ref={previewRef}
        className="relative border-t border-zinc-800"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_42%)]" />
        <ContainerScroll
          titleComponent={
            <div className="relative z-10 mx-auto max-w-3xl px-4 pb-12 md:pb-14">
              <p className="text-xs font-semibold uppercase tracking-normal text-blue-200">
                Dashboard Preview
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-5xl">
                Dari PDF ke insight belajar dalam satu alur.
              </h2>
              <Link
                href="/dashboard"
                className="motion-button mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-zinc-950 hover:bg-blue-100"
              >
                Masuk Dashboard
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          }
        >
          <DashboardPreview />
        </ContainerScroll>
      </section>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative h-full w-full bg-[#08090a] p-4 sm:p-5">
      <CursorSpotlight className="from-blue-300 via-cyan-100 to-transparent opacity-20" size={320} />
      <div className="relative z-10 flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-normal text-blue-200">
              LearnLens AI
            </p>
            <h3 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              Smart Learning Dashboard
            </h3>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Cloud LLM Active
          </div>
        </div>

        <div className="grid flex-1 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-zinc-700 bg-[#111315] p-3">
              <p className="text-sm font-semibold text-white">AI Summary</p>
              <div className="mt-4 space-y-3">
                <div className="h-3 w-full rounded-full bg-zinc-800" />
                <div className="h-3 w-11/12 rounded-full bg-zinc-800" />
                <div className="h-3 w-8/12 rounded-full bg-zinc-800" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {previewCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.label}
                    className="rounded-lg border border-zinc-700 bg-[#111315] p-2"
                  >
                    <Icon className="h-4 w-4 text-blue-200" aria-hidden="true" />
                    <p className="mt-2 text-xs font-semibold leading-4 text-white">
                      {card.label}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="hidden gap-3 sm:grid sm:grid-cols-3">
              {previewCards.map((card) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.label}
                    className="motion-card rounded-lg border border-zinc-700 bg-[#111315] p-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-200">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {card.detail}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="hidden rounded-lg border border-zinc-700 bg-[#111315] p-3 lg:block">
            <p className="text-sm font-semibold text-white">Learning Flow</p>
            <div className="mt-4 space-y-3">
              {["PDF", "Summary", "Chat", "Quiz"].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/10 text-xs font-semibold text-blue-100">
                    {index + 1}
                  </span>
                  <div className="h-10 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm font-medium text-zinc-300">
                    {item}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
