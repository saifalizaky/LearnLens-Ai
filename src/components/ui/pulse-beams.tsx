"use client";

import React from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

type GradientPoint = {
  x1: string | string[];
  x2: string | string[];
  y1: string | string[];
  y2: string | string[];
};

interface BeamPath {
  path: string;
  gradientConfig: {
    initial: GradientPoint;
    animate: GradientPoint;
    transition?: Transition;
  };
  connectionPoints?: Array<{
    cx: number;
    cy: number;
    r: number;
  }>;
}

interface PulseBeamsProps {
  children?: React.ReactNode;
  className?: string;
  background?: React.ReactNode;
  beams: BeamPath[];
  width?: number;
  height?: number;
  baseColor?: string;
  accentColor?: string;
  gradientColors?: {
    start: string;
    middle: string;
    end: string;
  };
}

export function PulseBeams({
  children,
  className,
  background,
  beams,
  width = 858,
  height = 434,
  baseColor = "#27272a",
  accentColor = "#3f3f46",
  gradientColors,
}: PulseBeamsProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[20rem] w-full items-center justify-center overflow-hidden antialiased",
        className,
      )}
    >
      {background}
      <div className="relative z-10">{children}</div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <SVGs
          beams={beams}
          width={width}
          height={height}
          baseColor={baseColor}
          accentColor={accentColor}
          gradientColors={gradientColors}
        />
      </div>
    </div>
  );
}

interface SVGsProps {
  beams: BeamPath[];
  width: number;
  height: number;
  baseColor: string;
  accentColor: string;
  gradientColors?: PulseBeamsProps["gradientColors"];
}

function SVGs({
  beams,
  width,
  height,
  baseColor,
  accentColor,
  gradientColors,
}: SVGsProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="max-w-[min(58rem,110vw)] flex-shrink-0 opacity-90"
      aria-hidden="true"
    >
      {beams.map((beam, index) => (
        <React.Fragment key={beam.path}>
          <path d={beam.path} stroke={baseColor} strokeWidth="1" />
          <path
            d={beam.path}
            stroke={`url(#pulse-beam-grad-${index})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {beam.connectionPoints?.map((point, pointIndex) => (
            <circle
              key={`${index}-${pointIndex}`}
              cx={point.cx}
              cy={point.cy}
              r={point.r}
              fill={baseColor}
              stroke={accentColor}
            />
          ))}
        </React.Fragment>
      ))}

      <defs>
        {beams.map((beam, index) => (
          <motion.linearGradient
            key={beam.path}
            id={`pulse-beam-grad-${index}`}
            gradientUnits="userSpaceOnUse"
            initial={beam.gradientConfig.initial}
            animate={beam.gradientConfig.animate}
            transition={beam.gradientConfig.transition}
          >
            <GradientColors colors={gradientColors} />
          </motion.linearGradient>
        ))}
      </defs>
    </svg>
  );
}

interface GradientColorsProps {
  colors?: {
    start: string;
    middle: string;
    end: string;
  };
}

function GradientColors({
  colors = {
    start: "#18CCFC",
    middle: "#6344F5",
    end: "#AE48FF",
  },
}: GradientColorsProps) {
  return (
    <>
      <stop offset="0%" stopColor={colors.start} stopOpacity="0" />
      <stop offset="20%" stopColor={colors.start} stopOpacity="1" />
      <stop offset="50%" stopColor={colors.middle} stopOpacity="1" />
      <stop offset="100%" stopColor={colors.end} stopOpacity="0" />
    </>
  );
}
