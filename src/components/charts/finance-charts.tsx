"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import type {
  RevenueExpensePoint,
  CategorySlice,
  TrendPoint,
  CashFlowPoint,
} from "@/lib/finance/analytics"

const EMERALD = "#10b981"
const RED = "#ef4444"
const VIOLET = "#8b5cf6"
const BLUE = "#3b82f6"
const PIE = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#64748b",
]

/** Compact INR for axis ticks, e.g. ₹82k, ₹4.8L. */
function compactINR(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  if (abs >= 1e3) return `₹${Math.round(n / 1e3)}k`
  return `₹${n}`
}

function fullINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n)
}

/** Recharts tooltip value type (number | string | array), possibly undefined. */
type ChartValue = number | string | readonly (number | string)[] | undefined
const moneyTooltip = (value: ChartValue) => fullINR(Number(value))

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--popover-foreground)" },
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  )
}

export function RevenueExpensesChart({ data }: { data: RevenueExpensePoint[] }) {
  if (data.length === 0) return <Empty label="No transactions yet" />
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={compactINR} width={56} />
          <Tooltip
            {...tooltipStyle}
            formatter={moneyTooltip}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="revenue" name="Revenue" fill={EMERALD} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill={RED} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ExpenseBreakdownChart({ data }: { data: CategorySlice[] }) {
  if (data.length === 0) return <Empty label="No expenses yet" />
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE[i % PIE.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} formatter={moneyTooltip} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MrrTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return <Empty label="No MRR yet" />
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={VIOLET} stopOpacity={0.3} />
              <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={compactINR} width={56} />
          <Tooltip {...tooltipStyle} formatter={moneyTooltip} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={VIOLET}
            strokeWidth={2}
            fill="url(#mrrFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  if (data.length === 0) return <Empty label="No cash flow yet" />
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="closingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={compactINR} width={56} />
          <Tooltip
            {...tooltipStyle}
            formatter={moneyTooltip}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="closing"
            name="Closing balance"
            stroke={BLUE}
            strokeWidth={2}
            fill="url(#closingFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
