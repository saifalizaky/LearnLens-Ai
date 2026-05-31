"use client";

import { Component, lazy, Suspense, useEffect, useRef } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { cn } from "@/lib/utils";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <div className={cn("relative", className)}>
      <SplineFallbackCanvas className="absolute inset-0 h-full w-full" />
      <SplineErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <Spline scene={scene} className="absolute inset-0 h-full w-full" />
        </Suspense>
      </SplineErrorBoundary>
    </div>
  );
}

class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("Spline scene failed to load. Rendering local fallback.", {
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function SplineFallbackCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvasElement = canvasRef.current!;
    if (!canvasElement) {
      return;
    }

    const context = canvasElement.getContext("2d")!;
    if (!context) {
      return;
    }

    let animationFrame = 0;

    function resize() {
      const rect = canvasElement.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvasElement.width = Math.max(1, Math.floor(rect.width * ratio));
      canvasElement.height = Math.max(1, Math.floor(rect.height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function draw(time: number) {
      const rect = canvasElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const originX = width > 900 ? width * 0.78 : width / 2;
      const originY = width > 900 ? height * 0.48 : height * 0.54;
      const sceneWidth = width > 900 ? width * 0.54 : width;
      const pointer = pointerRef.current;
      const driftX = pointer.x * 22;
      const driftY = pointer.y * 16;

      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(originX + driftX, originY + driftY);

      const pulse = Math.sin(time / 700) * 0.5 + 0.5;
      const coreRadius = Math.min(width, height) * 0.12 + pulse * 10;
      const gradient = context.createRadialGradient(0, 0, 4, 0, 0, coreRadius * 2.4);
      gradient.addColorStop(0, "rgba(96,165,250,0.9)");
      gradient.addColorStop(0.35, "rgba(34,211,238,0.24)");
      gradient.addColorStop(1, "rgba(15,23,42,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, coreRadius * 2.4, 0, Math.PI * 2);
      context.fill();

      context.strokeStyle = "rgba(96,165,250,0.4)";
      context.lineWidth = 2;
      const points = [
        [-sceneWidth * 0.16, 0],
        [sceneWidth * 0.17, -height * 0.1],
        [sceneWidth * 0.27, height * 0.06],
        [sceneWidth * 0.15, height * 0.17],
      ];
      for (const [x, y] of points) {
        context.beginPath();
        context.moveTo(0, 0);
        context.quadraticCurveTo(x * 0.45, y * 0.45 - 20, x, y);
        context.stroke();
      }

      drawDocument(context, -sceneWidth * 0.25, -height * 0.02, -10 + pointer.y * 8);
      drawDocument(context, -sceneWidth * 0.12, height * 0.12, 8 - pointer.x * 8);
      drawOutputCard(context, sceneWidth * 0.18, -height * 0.14, "Summary");
      drawOutputCard(context, sceneWidth * 0.28, height * 0.02, "Chat");
      drawOutputCard(context, sceneWidth * 0.16, height * 0.18, "Quiz");
      drawRobotHead(context, pointer, pulse);
      context.restore();

      animationFrame = requestAnimationFrame(draw);
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = canvasElement.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - rect.left) / rect.width - 0.5,
        y: (event.clientY - rect.top) / rect.height - 0.5,
      };
    }

    function handlePointerLeave() {
      pointerRef.current = { x: 0, y: 0 };
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("blur", handlePointerLeave);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Fallback 3D visualization of PDF, cloud AI, and learning cards"
    />
  );
}

function drawRobotHead(
  context: CanvasRenderingContext2D,
  pointer: { x: number; y: number },
  pulse: number,
) {
  const lookX = pointer.x * 10;
  const lookY = pointer.y * 7;

  context.save();
  context.shadowColor = "rgba(96,165,250,0.55)";
  context.shadowBlur = 28 + pulse * 10;
  context.fillStyle = "rgba(9,11,15,0.92)";
  context.strokeStyle = "rgba(147,197,253,0.7)";
  context.lineWidth = 2;
  roundRect(context, -48 + pointer.x * 8, -38 + pointer.y * 6, 96, 76, 18);
  context.fill();
  context.stroke();

  context.shadowBlur = 0;
  context.strokeStyle = "rgba(34,211,238,0.5)";
  context.beginPath();
  context.moveTo(0, -38 + pointer.y * 6);
  context.lineTo(0, -58 + pointer.y * 4);
  context.stroke();
  context.fillStyle = "rgba(96,165,250,0.95)";
  context.beginPath();
  context.arc(0, -62 + pointer.y * 4, 5 + pulse * 2, 0, Math.PI * 2);
  context.fill();

  drawEye(context, -20 + lookX, -8 + lookY);
  drawEye(context, 20 + lookX, -8 + lookY);

  context.strokeStyle = "rgba(226,232,240,0.55)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(-16 + lookX * 0.35, 18 + lookY * 0.25);
  context.quadraticCurveTo(0, 25 + pulse * 2, 16 + lookX * 0.35, 18 + lookY * 0.25);
  context.stroke();
  context.restore();
}

function drawEye(context: CanvasRenderingContext2D, x: number, y: number) {
  context.fillStyle = "rgba(226,232,240,0.95)";
  context.beginPath();
  context.arc(x, y, 9, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(37,99,235,0.95)";
  context.beginPath();
  context.arc(x, y, 4, 0, Math.PI * 2);
  context.fill();
}

function drawDocument(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotate: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate((rotate * Math.PI) / 180);
  context.fillStyle = "rgba(15,23,42,0.88)";
  context.strokeStyle = "rgba(125,211,252,0.5)";
  context.lineWidth = 1.5;
  roundRect(context, -46, -62, 92, 124, 8);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(96,165,250,0.8)";
  context.fillRect(-28, -32, 56, 6);
  context.fillStyle = "rgba(255,255,255,0.32)";
  context.fillRect(-28, -12, 48, 4);
  context.fillRect(-28, 4, 58, 4);
  context.fillRect(-28, 20, 38, 4);
  context.restore();
}

function drawOutputCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "rgba(9,11,15,0.9)";
  context.strokeStyle = "rgba(147,197,253,0.45)";
  context.lineWidth = 1.5;
  roundRect(context, -58, -24, 116, 48, 8);
  context.fill();
  context.stroke();
  context.fillStyle = "rgba(226,232,240,0.88)";
  context.font = "600 13px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, 0, 0);
  context.restore();
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
