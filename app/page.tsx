'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Filter,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Package,
  Download,
  Loader2,
  Database
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import {
  KPIData,
  MonthlySales,
  CategoryData,
  RegionData,
  ProductData,
  BusinessInsight
} from '@/lib/types';
import { formatCurrency, formatNumber, exportToCSV } from '@/lib/analytics';

const CATEGORY_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

interface MetadataState {
  dateRange: { min: string; max: string };
  categories: string[];
  regions: string[];
  totalCount: number;
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<MetadataState>({
    dateRange: { min: '', max: '' },
    categories: [],
    regions: [],
    totalCount: 0,
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Analytics payload state populated from SQL queries
  const [kpis, setKpis] = useState<KPIData>({
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    prevRevenue: 0,
    prevProfit: 0,
    prevOrders: 0,
    prevAvgOrderValue: 0,
  });
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);

  // Fetch data from SQL backend API
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedRegion) params.set('region', selectedRegion);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error('API fetch error');
      const data = await res.json();

      setKpis(data.kpis);
      setMonthlySales(data.monthlySales);
      setCategoryData(data.categoryData);
      setRegionData(data.regionData);
      setTopProducts(data.topProducts);
      setBusinessInsights(data.businessInsights);

      if (data.metadata && (!metadata.dateRange.min || metadata.categories.length === 0)) {
        setMetadata(data.metadata);
        if (!startDate && data.metadata.dateRange.min) setStartDate(data.metadata.dateRange.min);
        if (!endDate && data.metadata.dateRange.max) setEndDate(data.metadata.dateRange.max);
      }
    } catch (err) {
      console.error('Failed to load SQL analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedCategory, selectedRegion, metadata.dateRange.min, metadata.categories.length]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const hasActiveFilters = Boolean(
    (metadata.dateRange.min && startDate !== metadata.dateRange.min) ||
    (metadata.dateRange.max && endDate !== metadata.dateRange.max) ||
    selectedCategory ||
    selectedRegion
  );

  const resetFilters = () => {
    setStartDate(metadata.dateRange.min);
    setEndDate(metadata.dateRange.max);
    setSelectedCategory('');
    setSelectedRegion('');
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedRegion) params.set('region', selectedRegion);
      params.set('export', 'true');

      const res = await fetch(`/api/analytics?${params.toString()}`);
      const json = await res.json();
      if (json.records) {
        exportToCSV(json.records, `salesiq-sql-export-${new Date().toISOString().split('T')[0]}`);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">SalesIQ</h1>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100 flex items-center gap-1">
                  <Database size={11} /> SQLite Connected
                </span>
              </div>
              <p className="text-xs text-gray-500">Sales Analytics & Business Intelligence Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              {loading ? (
                <>
                  <Loader2 size={12} className="animate-spin text-blue-600" />
                  <span>Querying SQL...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-gray-800">{kpis.totalOrders}</span> orders queried
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Simple Filters Section */}
        <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                <Filter size={16} className="text-blue-600" />
                <span>Filters:</span>
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  min={metadata.dateRange.min}
                  max={endDate || metadata.dateRange.max}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || metadata.dateRange.min}
                  max={metadata.dateRange.max}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {metadata.categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Region Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Region:</span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Regions</option>
                  {metadata.regions.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <X size={14} />
                Reset Filters
              </button>
            )}
          </div>
        </section>

        {/* 4 Core KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.totalRevenue)}</h3>
              <p className="text-xs text-gray-400 mt-1">Calculated via SQL SUM</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign size={22} />
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Profit</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(kpis.totalProfit)}</h3>
              <p className="text-xs text-gray-400 mt-1">
                Margin: {kpis.totalRevenue > 0 ? ((kpis.totalProfit / kpis.totalRevenue) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CreditCard size={22} />
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(kpis.totalOrders)}</h3>
              <p className="text-xs text-gray-400 mt-1">Distinct order transactions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShoppingCart size={22} />
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Average Order Value</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(kpis.avgOrderValue)}</h3>
              <p className="text-xs text-gray-400 mt-1">Revenue per transaction</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp size={22} />
            </div>
          </div>
        </section>

        {/* Monthly Sales & Profit Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trend */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Monthly Revenue Trend</h3>
                <p className="text-xs text-gray-500">SQL aggregated monthly sales volume</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySales} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Profit Trend */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Monthly Profit Trend</h3>
                <p className="text-xs text-gray-500">SQL aggregated operational profit by month</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales} margin={{ top: 5, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Profit']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Category-wise & Region-wise Sales */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Sales */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Category-Wise Sales</h3>
                <p className="text-xs text-gray-500">Revenue contribution per product line</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="category" tick={{ fontSize: 12, fill: '#4b5563' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={36}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Region-wise Sales */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Region-Wise Sales</h3>
                <p className="text-xs text-gray-500">Geographic territory sales breakdown</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 12, fill: '#4b5563' }} />
                  <Tooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Revenue']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Top-Selling Products & Business Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top-Selling Products Table */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900">Top-Selling Products</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                  Ranked by SQL
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-medium pb-2">
                      <th className="py-2 pr-2">Product</th>
                      <th className="py-2 px-2">Category</th>
                      <th className="py-2 px-2 text-right">Revenue</th>
                      <th className="py-2 pl-2 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="py-2.5 pr-2 font-medium text-gray-900 max-w-[180px] truncate" title={p.productName}>
                          {p.productName}
                        </td>
                        <td className="py-2.5 px-2 text-gray-500">
                          {p.category}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-gray-900">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="py-2.5 pl-2 text-right font-medium text-emerald-600">
                          +{formatCurrency(p.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-500" />
                  <h3 className="text-base font-semibold text-gray-900">Business Insights</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium border border-amber-100">
                  SQL Computed Analytics
                </span>
              </div>

              <div className="space-y-3">
                {businessInsights.map((insight, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                    <div className="mt-0.5">
                      {insight.type === 'success' ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-900">{insight.title}</h4>
                        <span className="text-xs font-bold text-gray-900">{insight.value}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
