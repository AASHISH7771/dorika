"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface SalesBuckets {
  daily: { label: string; revenue: number; orders: number }[];
  weekly: { label: string; revenue: number; orders: number }[];
  monthly: { label: string; revenue: number; orders: number }[];
}

type Range = "daily" | "weekly" | "monthly";

export function SalesChart({ data }: { data: SalesBuckets }) {
  const [range, setRange] = useState<Range>("daily");
  const series = data[range];

  const tabs: { key: Range; label: string }[] = [
    { key: "daily", label: "14 days" },
    { key: "weekly", label: "8 weeks" },
    { key: "monthly", label: "6 months" },
  ];

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Sales</h2>
        <div className="flex gap-1 rounded-full bg-cream-200 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setRange(t.key)}
              className={
                "rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                (range === t.key
                  ? "bg-white text-charcoal-800 shadow-soft"
                  : "text-charcoal-500 hover:text-charcoal-800")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C55A29" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C55A29" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e7e9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6b7177" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7177" }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(v) => `Rs ${Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : v}`}
            />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "revenue" ? [`Rs. ${value.toLocaleString("en-IN")}`, "Revenue"] : [value, "Orders"]
              }
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e6e7e9",
                fontSize: 13,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#C55A29"
              strokeWidth={2.5}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
