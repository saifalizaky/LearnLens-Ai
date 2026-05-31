"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, style, ...props }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [isListening, setIsListening] = React.useState(false);
    const [circles, setCircles] = React.useState<
      Array<{
        id: number;
        x: number;
        y: number;
        color: string;
        fadeState: "in" | "out" | null;
      }>
    >([]);
    const lastAddedRef = React.useRef(0);

    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

    const createCircle = React.useCallback((x: number, y: number) => {
      const buttonWidth = buttonRef.current?.offsetWidth || 1;
      const xPos = x / buttonWidth;
      const color = `linear-gradient(to right, var(--circle-start) ${
        xPos * 100
      }%, var(--circle-end) ${xPos * 100}%)`;

      setCircles((prev) => [
        ...prev,
        { id: Date.now(), x, y, color, fadeState: null },
      ]);
    }, []);

    const handlePointerMove = React.useCallback(
      (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isListening) {
          return;
        }

        const currentTime = Date.now();
        if (currentTime - lastAddedRef.current > 100) {
          lastAddedRef.current = currentTime;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          createCircle(x, y);
        }
      },
      [isListening, createCircle],
    );

    const handlePointerEnter = React.useCallback(() => {
      setIsListening(true);
    }, []);

    const handlePointerLeave = React.useCallback(() => {
      setIsListening(false);
    }, []);

    React.useEffect(() => {
      const timeouts = circles
        .filter((circle) => !circle.fadeState)
        .flatMap((circle) => [
          window.setTimeout(() => {
            setCircles((prev) =>
              prev.map((item) =>
                item.id === circle.id ? { ...item, fadeState: "in" } : item,
              ),
            );
          }, 0),
          window.setTimeout(() => {
            setCircles((prev) =>
              prev.map((item) =>
                item.id === circle.id ? { ...item, fadeState: "out" } : item,
              ),
            );
          }, 1000),
          window.setTimeout(() => {
            setCircles((prev) => prev.filter((item) => item.id !== circle.id));
          }, 2200),
        ]);

      return () => {
        timeouts.forEach((timeout) => window.clearTimeout(timeout));
      };
    }, [circles]);

    return (
      <button
        ref={buttonRef}
        className={cn(
          "relative isolate overflow-hidden rounded-3xl px-8 py-3",
          "cursor-pointer text-base font-medium leading-6 text-foreground",
          "bg-[rgba(43,55,80,0.1)] backdrop-blur-lg",
          "before:pointer-events-none before:absolute before:inset-0 before:z-[1]",
          "before:rounded-[inherit] before:content-['']",
          "before:shadow-[inset_0_0_0_1px_rgba(170,202,255,0.2),inset_0_0_16px_0_rgba(170,202,255,0.1),inset_0_-3px_12px_0_rgba(170,202,255,0.15),0_1px_3px_0_rgba(0,0,0,0.50),0_4px_12px_0_rgba(0,0,0,0.45)]",
          "before:mix-blend-multiply before:transition-transform before:duration-300",
          "active:before:scale-[0.975]",
          className,
        )}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
        style={
          {
            "--circle-start": "var(--tw-gradient-from, #a0d9f8)",
            "--circle-end": "var(--tw-gradient-to, #3a5bbf)",
            ...style,
          } as React.CSSProperties
        }
      >
        {circles.map(({ id, x, y, color, fadeState }) => (
          <div
            key={id}
            className={cn(
              "pointer-events-none absolute z-[-1] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-lg transition-opacity duration-300",
              fadeState === "in" && "opacity-75",
              fadeState === "out" && "opacity-0 duration-[1.2s]",
              !fadeState && "opacity-0",
            )}
            style={{
              left: x,
              top: y,
              background: color,
            }}
          />
        ))}
        {children}
      </button>
    );
  },
);

HoverButton.displayName = "HoverButton";

export { HoverButton };
