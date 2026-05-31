import { cn } from "@/lib/utils";

interface LearnLensLogoProps {
  className?: string;
}

export function LearnLensLogo({ className }: LearnLensLogoProps) {
  return (
    <svg
      viewBox="0 0 450 120"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label="LearnLens AI"
    >
      <defs>
        <linearGradient id="learnlens-dark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="1" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="1" />
        </linearGradient>
      </defs>
      <g transform="translate(10, 15)">
        <g transform="translate(0, 5)">
          <path
            d="M15 15 H65 V75 C65 80 60 85 55 85 H15 C10 85 5 80 5 75 V25 C5 20 10 15 15 15Z"
            fill="#1E293B"
          />
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="white"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="22"
            fill="none"
            stroke="url(#learnlens-dark-grad)"
            strokeWidth="4"
            strokeDasharray="80 20"
          />
          <circle cx="78" cy="35" r="8" fill="url(#learnlens-dark-grad)" />
          <path
            d="M42 52 L48 58 L60 46"
            fill="none"
            stroke="url(#learnlens-dark-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <text
          x="110"
          y="65"
          fontFamily="Space Grotesk, Arial, sans-serif"
          fontWeight="700"
          fontSize="42"
          fill="white"
        >
          LearnLens{" "}
          <tspan fill="url(#learnlens-dark-grad)" fontSize="34" dy="-2">
            AI
          </tspan>
        </text>
      </g>
    </svg>
  );
}
