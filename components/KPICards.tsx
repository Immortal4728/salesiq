'use client';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, BarChart3 } from 'lucide-react';
import { KPIData } from '@/lib/types';
import { formatCurrency, formatNumber, calculatePercentChange } from '@/lib/analytics';

interface KPICardsProps {
  data: KPIData;
  loading?: boolean;
}

const kpiConfig = [
  {
    key: 'revenue' as const,
    label: 'Total Revenue',
    icon: DollarSign,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'profit' as const,
    label: 'Total Profit',
    icon: CreditCard,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    format: (v: number) => formatCurrency(v),
  },
  {
    key: 'orders' as const,
    label: 'Total Orders',
    icon: ShoppingCart,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    format: (v: number) => formatNumber(v),
  },
  {
    key: 'aov' as const,
    label: 'Avg Order Value',
    icon: BarChart3,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    format: (v: number) => formatCurrency(v),
  },
];

function getValue(data: KPIData, key: string): number {
  switch (key) {
    case 'revenue': return data.totalRevenue;
    case 'profit': return data.totalProfit;
    case 'orders': return data.totalOrders;
    case 'aov': return data.avgOrderValue;
    default: return 0;
  }
}

function getPrevValue(data: KPIData, key: string): number {
  switch (key) {
    case 'revenue': return data.prevRevenue;
    case 'profit': return data.prevProfit;
    case 'orders': return data.prevOrders;
    case 'aov': return data.prevAvgOrderValue;
    default: return 0;
  }
}

export default function KPICards({ data, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="kpi-card">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-32 mb-3" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {kpiConfig.map(kpi => {
        const Icon = kpi.icon;
        const value = getValue(data, kpi.key);
        const prevValue = getPrevValue(data, kpi.key);
        const change = calculatePercentChange(value, prevValue);
        const isPositive = change >= 0;

        return (
          <div key={kpi.key} className="kpi-card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{kpi.label}</span>
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${kpi.bgColor}`}>
                <Icon size={20} className={kpi.color} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {kpi.format(value)}
            </div>
            <div className="flex items-center gap-2">
              {prevValue > 0 ? (
                <>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(change)}%
                  </span>
                  <span className="text-xs text-gray-400">vs prev period</span>
                </>
              ) : (
                <span className="text-xs text-gray-400">No previous data</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
