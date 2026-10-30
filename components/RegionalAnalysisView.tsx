'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, MapPin } from 'lucide-react';
import { RegionData, StateData } from '@/lib/types';
import { formatCurrency, formatNumber, exportToCSV } from '@/lib/analytics';

interface RegionalAnalysisProps {
  regionData: RegionData[];
  stateData: StateData[];
  loading?: boolean;
}

export default function RegionalAnalysisView({ regionData, stateData, loading }: RegionalAnalysisProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof StateData>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredStates = useMemo(() => {
    let result = stateData.filter(s => selectedRegion === 'All' || s.region === selectedRegion);

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [stateData, selectedRegion, sortField, sortAsc]);

  const topStates = useMemo(() => {
    return [...filteredStates].slice(0, 8);
  }, [filteredStates]);

  const handleSort = (field: keyof StateData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const exportRows = filteredStates.map(s => ({
      'State': s.state,
      'Region': s.region,
      'Revenue ($)': s.revenue,
      'Profit ($)': s.profit,
      'Total Orders': s.orders,
      'Profit Margin (%)': `${s.revenue > 0 ? ((s.profit / s.revenue) * 100).toFixed(1) : 0}%`
    }));
    exportToCSV(exportRows, `salesiq-regional-performance-${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 w-full" />
          <div className="skeleton h-80 w-full" />
        </div>
        <div className="skeleton h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Regional KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {regionData.map(r => {
          const margin = r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) : '0';
          return (
            <div key={r.region} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin size={13} className="text-blue-600" />
                  {r.region} Region
                </span>
                <span className="badge badge-default">{r.orders} orders</span>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">{formatCurrency(r.revenue)}</div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>Profit: <strong className="text-emerald-600 font-semibold">{formatCurrency(r.profit)}</strong></span>
                <span>Margin: <strong className="text-gray-900 font-semibold">{margin}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizations: Region Revenue & Profit vs State Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Revenue & Profit Comparison */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Regional Revenue vs Profit</h3>
              <p className="text-xs text-gray-500">Comparative performance across enterprise sales zones</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionData}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="region" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatCurrency(Number(val) || 0)]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={26} />
                <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing States */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Top State Sales Volume</h3>
              <p className="text-xs text-gray-500">Leading territories by gross billing</p>
            </div>
            <span className="badge badge-info">Top 8</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topStates}
                layout="vertical"
                margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="state"
                  width={110}
                  tick={{ fontSize: 11, fill: '#4b5563' }}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* State-wise Sales Performance Table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Territory Performance Matrix</h3>
            <p className="text-xs text-gray-500">Granular regional revenue, order count, and profitability metrics</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter by region */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
            >
              <option value="All">All Regions</option>
              {regionData.map(r => (
                <option key={r.region} value={r.region}>{r.region}</option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <th
                  className="py-3 px-4 cursor-pointer select-none"
                  onClick={() => handleSort('state')}
                >
                  <div className="flex items-center gap-1">
                    State
                    {sortField === 'state' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer select-none"
                  onClick={() => handleSort('region')}
                >
                  <div className="flex items-center gap-1">
                    Region
                    {sortField === 'region' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer select-none"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Revenue
                    {sortField === 'revenue' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer select-none"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Profit
                    {sortField === 'profit' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer select-none"
                  onClick={() => handleSort('orders')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Orders
                    {sortField === 'orders' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredStates.map((s, idx) => {
                const margin = s.revenue > 0 ? (s.profit / s.revenue) * 100 : 0;
                const isNegativeProfit = s.profit < 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{s.state}</td>
                    <td className="py-3 px-4">
                      <span className="badge badge-default">{s.region}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(s.revenue)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${isNegativeProfit ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(s.profit)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatNumber(s.orders)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        margin >= 25
                          ? 'bg-emerald-50 text-emerald-700'
                          : margin >= 10
                          ? 'bg-blue-50 text-blue-700'
                          : margin >= 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
