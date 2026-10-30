'use client';

import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart
} from 'recharts';
import { MonthlySales } from '@/lib/types';
import { formatCurrency } from '@/lib/analytics';

interface SalesChartsProps {
  data: MonthlySales[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500">{entry.name}:</span>
            <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueAreaChart({ data, loading }: SalesChartsProps) {
  if (loading) {
    return <div className="skeleton h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="empty-state h-80">
        <p className="text-gray-400 text-sm">No data available for the selected filters</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#2563eb"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
          activeDot={{ r: 6, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProfitLineChart({ data, loading }: SalesChartsProps) {
  if (loading) {
    return <div className="skeleton h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="empty-state h-80">
        <p className="text-gray-400 text-sm">No data available for the selected filters</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#059669"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
          activeDot={{ r: 6, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SalesVsProfitChart({ data, loading }: SalesChartsProps) {
  if (loading) {
    return <div className="skeleton h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="empty-state h-80">
        <p className="text-gray-400 text-sm">No data available for the selected filters</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
          barSize={24}
          opacity={0.85}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#059669"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function RevenueBarChart({ data, loading }: SalesChartsProps) {
  if (loading) {
    return <div className="skeleton h-80 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="empty-state h-80">
        <p className="text-gray-400 text-sm">No data available for the selected filters</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
          barSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
