"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ActivityDatum = {
  day: string;
  questions: number;
  quizzes: number;
  uploads: number;
};

export function LearningActivityChart({ data }: { data: ActivityDatum[] }) {
  const isMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!isMounted) {
    return <div className="h-64 w-full" />;
  }

  const chartData = data.map((item) => ({
    ...item,
    total: item.questions + item.quizzes + item.uploads,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="studyProgress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.18} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.12)" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.58)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(96,165,250,0.45)", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "#111315",
              color: "#f7f7f7",
              boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Aktivitas"
            stroke="#60a5fa"
            strokeWidth={3}
            fill="url(#studyProgress)"
            dot={{ r: 4, fill: "#dbeafe", stroke: "#60a5fa", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function subscribe() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
