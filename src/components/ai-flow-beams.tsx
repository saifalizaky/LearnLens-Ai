"use client";

import type { ComponentProps } from "react";
import {
  Activity,
  BrainCircuit,
  Cpu,
  FileText,
  GraduationCap,
  MessageSquareText,
  UploadCloud,
} from "lucide-react";
import { PulseBeams } from "@/components/ui/pulse-beams";

type PulseBeamConfig = ComponentProps<typeof PulseBeams>["beams"];

const beams: PulseBeamConfig = [
  {
    path: "M269 220.5H16.5C10.9772 220.5 6.5 224.977 6.5 230.5V398.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["0%", "0%", "200%"],
        x2: ["0%", "0%", "180%"],
        y1: ["80%", "0%", "0%"],
        y2: ["100%", "20%", "20%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: 0.2,
      },
    },
    connectionPoints: [
      { cx: 6.5, cy: 398.5, r: 6 },
      { cx: 269, cy: 220.5, r: 6 },
    ],
  },
  {
    path: "M568 200H841C846.523 200 851 195.523 851 190V40",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: 0.6,
      },
    },
    connectionPoints: [
      { cx: 851, cy: 34, r: 6.5 },
      { cx: 568, cy: 200, r: 6 },
    ],
  },
  {
    path: "M425.5 274V333C425.5 338.523 421.023 343 415.5 343H152C146.477 343 142 347.477 142 353V426.5",
    gradientConfig: {
      initial: {
        x1: "0%",
        x2: "0%",
        y1: "80%",
        y2: "100%",
      },
      animate: {
        x1: ["20%", "100%", "100%"],
        x2: ["0%", "90%", "90%"],
        y1: ["80%", "80%", "-20%"],
        y2: ["100%", "100%", "0%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: 1,
      },
    },
    connectionPoints: [
      { cx: 142, cy: 427, r: 6.5 },
      { cx: 425.5, cy: 274, r: 6 },
    ],
  },
  {
    path: "M493 274V333.226C493 338.749 497.477 343.226 503 343.226H760C765.523 343.226 770 347.703 770 353.226V427",
    gradientConfig: {
      initial: {
        x1: "40%",
        x2: "50%",
        y1: "160%",
        y2: "180%",
      },
      animate: {
        x1: "0%",
        x2: "10%",
        y1: "-40%",
        y2: "-20%",
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: 1.4,
      },
    },
    connectionPoints: [
      { cx: 770, cy: 427, r: 6.5 },
      { cx: 493, cy: 274, r: 6 },
    ],
  },
  {
    path: "M380 168V17C380 11.4772 384.477 7 390 7H414",
    gradientConfig: {
      initial: {
        x1: "-40%",
        x2: "-10%",
        y1: "0%",
        y2: "20%",
      },
      animate: {
        x1: ["40%", "0%", "0%"],
        x2: ["10%", "0%", "0%"],
        y1: ["0%", "0%", "180%"],
        y2: ["20%", "20%", "200%"],
      },
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear",
        repeatDelay: 2,
        delay: 1.8,
      },
    },
    connectionPoints: [
      { cx: 420.5, cy: 6.5, r: 6 },
      { cx: 380, cy: 168, r: 6 },
    ],
  },
];

interface AiFlowBeamsProps {
  documentCount: number;
  weeklyActivities: number;
  modelLabel: string;
  latestDocumentTitle?: string;
}

export function AiFlowBeams({
  documentCount,
  weeklyActivities,
  modelLabel,
  latestDocumentTitle,
}: AiFlowBeamsProps) {
  const metrics = [
    {
      label: "Dokumen",
      value: documentCount.toLocaleString("id-ID"),
      icon: FileText,
    },
    {
      label: "Aktivitas 7 Hari",
      value: weeklyActivities.toLocaleString("id-ID"),
      icon: Activity,
    },
    {
      label: "Model",
      value: modelLabel,
      icon: Cpu,
    },
  ];

  return (
    <section className="motion-card overflow-hidden rounded-lg border border-zinc-700 bg-[#101214] shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
      <PulseBeams
        beams={beams}
        className="min-h-[19rem] px-4 py-6 sm:min-h-[20rem]"
        baseColor="#27272a"
        accentColor="#52525b"
        gradientColors={{
          start: "#22d3ee",
          middle: "#3b82f6",
          end: "#a855f7",
        }}
        background={
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
        }
      >
        <div className="flex w-full max-w-3xl flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/40 bg-zinc-950 text-blue-200 shadow-[0_0_34px_rgba(59,130,246,0.22)]">
            <BrainCircuit className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-normal text-blue-200">
            Cloud LLM Pipeline
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
            LearnLens AI
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
            {latestDocumentTitle
              ? `Dokumen aktif: ${latestDocumentTitle}`
              : "Belum ada dokumen aktif di sesi ini."}
          </p>

          <div className="mt-5 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;

              return (
                <div
                  key={metric.label}
                  className="rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-3 text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                    <Icon className="h-4 w-4 text-blue-300" aria-hidden="true" />
                    {metric.label}
                  </div>
                  <p className="mt-2 break-words text-lg font-semibold text-white">
                    {metric.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </PulseBeams>
    </section>
  );
}

type LearningFlowVariant = "documents" | "chat" | "quiz";

interface LearningFlowStat {
  label: string;
  value: string;
}

interface LearningFlowBeamsProps {
  variant: LearningFlowVariant;
  eyebrow: string;
  title: string;
  description: string;
  stats: LearningFlowStat[];
}

const flowVariants = {
  documents: {
    icon: UploadCloud,
    gradientColors: {
      start: "#22d3ee",
      middle: "#3b82f6",
      end: "#8b5cf6",
    },
  },
  chat: {
    icon: MessageSquareText,
    gradientColors: {
      start: "#60a5fa",
      middle: "#818cf8",
      end: "#c084fc",
    },
  },
  quiz: {
    icon: GraduationCap,
    gradientColors: {
      start: "#38bdf8",
      middle: "#2dd4bf",
      end: "#a78bfa",
    },
  },
} satisfies Record<
  LearningFlowVariant,
  {
    icon: typeof UploadCloud;
    gradientColors: {
      start: string;
      middle: string;
      end: string;
    };
  }
>;

export function LearningFlowBeams({
  variant,
  eyebrow,
  title,
  description,
  stats,
}: LearningFlowBeamsProps) {
  const config = flowVariants[variant];
  const Icon = config.icon;

  return (
    <section className="motion-card overflow-hidden rounded-lg border border-zinc-700 bg-[#101214] shadow-[0_20px_56px_rgba(0,0,0,0.32)]">
      <PulseBeams
        beams={beams}
        className="min-h-[15rem] px-4 py-5 sm:min-h-[16rem] sm:px-6"
        baseColor="#27272a"
        accentColor="#52525b"
        gradientColors={config.gradientColors}
        background={
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:40px_40px]" />
        }
      >
        <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/40 bg-zinc-950 text-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-normal text-blue-200">
              {eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.slice(0, 3).map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-zinc-700 bg-zinc-950/80 px-3 py-3"
              >
                <p className="text-xs font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-2 break-words text-lg font-semibold text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PulseBeams>
    </section>
  );
}
