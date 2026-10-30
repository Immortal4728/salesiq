'use client';

import { useState, useMemo, useRef, ChangeEvent } from 'react';
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
  Upload,
  FileSpreadsheet,
  Trash2,
  AlertCircle
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
import { SalesRecord, Filters } from '@/lib/types';
import {
  filterData,
  calculateKPIs,
  getPreviousPeriodData,
  getMonthlySales,
  getCategoryData,
  getRegionData,
  getProductData,
  generateBusinessInsights,
  formatCurrency,
  formatNumber,
  exportToCSV
} from '@/lib/analytics';
import { getSalesData } from '@/lib/data';
import { parseSalesCSV } from '@/lib/csvParser';

const CATEGORY_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-memory data state: defaults to sample data, or switches to uploaded CSV
  const defaultData = useMemo(() => getSalesData(), []);
  const [activeRecords, setActiveRecords] = useState<SalesRecord[]>(defaultData);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Derive available categories and regions dynamically from active dataset
  const availableCategories = useMemo(() => {
    return Array.from(new Set(activeRecords.map(r => r.category).filter(Boolean))).sort();
  }, [activeRecords]);

  const availableRegions = useMemo(() => {
    return Array.from(new Set(activeRecords.map(r => r.region).filter(Boolean))).sort();
  }, [activeRecords]);

  const dateBounds = useMemo(() => {
    if (activeRecords.length === 0) return { min: '', max: '' };
    const dates = activeRecords.map(r => r.orderDate).filter(Boolean).sort();
    return { min: dates[0] || '', max: dates[dates.length - 1] || '' };
  }, [activeRecords]);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Active filters object
  const filters: Filters = useMemo(() => ({
    dateRange: {
      start: startDate || dateBounds.min,
      end: endDate || dateBounds.max,
    },
    categories: selectedCategory ? [selectedCategory] : [],
    regions: selectedRegion ? [selectedRegion] : [],
  }), [startDate, endDate, selectedCategory, selectedRegion, dateBounds]);

  // Filtered dataset in browser memory
  const filteredData = useMemo(() => {
    return filterData(activeRecords, filters);
  }, [activeRecords, filters]);

  // Previous period data for KPI comparisons
  const prevData = useMemo(() => {
    return getPreviousPeriodData(activeRecords, filters);
  }, [activeRecords, filters]);

  // Pure in-memory metric calculations
  const kpis = useMemo(() => calculateKPIs(filteredData, prevData), [filteredData, prevData]);
  const monthlySales = useMemo(() => getMonthlySales(filteredData), [filteredData]);
  const categoryData = useMemo(() => getCategoryData(filteredData), [filteredData]);
  const regionData = useMemo(() => getRegionData(filteredData), [filteredData]);
  const productData = useMemo(() => getProductData(filteredData), [filteredData]);
  const businessInsights = useMemo(() => generateBusinessInsights(filteredData), [filteredData]);

  const topSellingProducts = useMemo(() => {
    return [...productData].slice(0, 5);
  }, [productData]);

  // CSV Upload handler
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setUploadError('Please select a valid CSV file (.csv format required).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const result = await parseSalesCSV(file);

      if (result.errors.length > 0) {
        setUploadError(result.errors.join(' '));
        return;
      }

      if (result.data.length === 0) {
        setUploadError('The CSV file does not contain any valid sales records.');
        return;
      }

      // Update active in-memory dataset
      setActiveRecords(result.data);
      setUploadedFileName(file.name);

      // Reset filters to the new file's date bounds
      const dates = result.data.map(r => r.orderDate).filter(Boolean).sort();
      setStartDate(dates[0] || '');
      setEndDate(dates[dates.length - 1] || '');
      setSelectedCategory('');
      setSelectedRegion('');
    } catch (err: any) {
      setUploadError(`Failed to parse CSV file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset to default sample dataset
  const handleResetToSample = () => {
    setActiveRecords(defaultData);
    setUploadedFileName(null);
    setUploadError(null);
    const dates = defaultData.map(r => r.orderDate).filter(Boolean).sort();
    setStartDate(dates[0] || '');
    setEndDate(dates[dates.length - 1] || '');
    setSelectedCategory('');
    setSelectedRegion('');
  };

  const hasActiveFilters = Boolean(
    (startDate && startDate !== dateBounds.min) ||
    (endDate && endDate !== dateBounds.max) ||
    selectedCategory ||
    selectedRegion
  );

  const resetFilters = () => {
    setStartDate(dateBounds.min);
    setEndDate(dateBounds.max);
    setSelectedCategory('');
    setSelectedRegion('');
  };

  // Export filtered data to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('No records available to export for the selected filters.');
      return;
    }

    const exportRows = filteredData.map(r => ({
      'Order ID': r.orderId,
      'Order Date': r.orderDate,
      'Ship Date': r.shipDate,
      'Customer Name': r.customerName,
      'Segment': r.segment,
      'Country': r.country,
      'City': r.city,
      'State': r.state,
      'Region': r.region,
      'Category': r.category,
      'Sub-Category': r.subCategory,
      'Product Name': r.productName,
      'Sales ($)': r.sales,
      'Quantity': r.quantity,
      'Discount': r.discount,
      'Profit ($)': r.profit,
    }));

    const filename = uploadedFileName
      ? `filtered-${uploadedFileName.replace(/\.csv$/i, '')}`
      : `salesiq-filtered-report-${new Date().toISOString().split('T')[0]}`;

    exportToCSV(exportRows, filename);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,text/csv"
        className="hidden"
      />

      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">SalesIQ</h1>
                {uploadedFileName ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 flex items-center gap-1">
                    <FileSpreadsheet size={11} /> {uploadedFileName}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100 flex items-center gap-1">
                    Sample Dataset
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">In-Memory Sales Analytics & Business Intelligence Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Upload CSV Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload size={14} />
              <span>{isUploading ? 'Parsing...' : 'Upload CSV'}</span>
            </button>

            {/* Reset to Sample if user uploaded a file */}
            {uploadedFileName && (
              <button
                onClick={handleResetToSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                title="Reset to default sample dataset"
              >
                <Trash2 size={13} className="text-gray-400" />
                <span>Reset Data</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            {/* Total Records Counter */}
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                <strong className="text-gray-800">{filteredData.length}</strong> / {activeRecords.length} records
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-xs text-red-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Unable to process uploaded file:</strong>
                <p className="mt-0.5 leading-relaxed">{uploadError}</p>
                <p className="mt-1 text-[11px] text-red-600">
                  Tip: Ensure your CSV has headers like <code>Order Date</code>, <code>Sales</code>, and optional columns like <code>Category</code>, <code>Region</code>, <code>Product Name</code>, and <code>Profit</code>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-700"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Upload Status Banner when custom file is active */}
        {uploadedFileName && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>
                Active custom dataset: <strong>{uploadedFileName}</strong> ({activeRecords.length} total rows parsed in browser memory).
              </span>
            </div>
            <span className="text-[11px] text-emerald-600">
              Data clears automatically on page refresh
            </span>
          </div>
        )}

        {/* Filters Section */}
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
                  value={startDate || dateBounds.min}
                  min={dateBounds.min}
                  max={endDate || dateBounds.max}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate || dateBounds.max}
                  min={startDate || dateBounds.min}
                  max={dateBounds.max}
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
                  {availableCategories.map(cat => (
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
                  {availableRegions.map(reg => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
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
              <p className="text-xs text-gray-400 mt-1">Aggregated sales volume</p>
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
              <p className="text-xs text-gray-400 mt-1">Revenue per order</p>
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
                <p className="text-xs text-gray-500">Gross sales volume over time</p>
              </div>
            </div>
            <div className="h-72 w-full">
              {monthlySales.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No monthly data matches the current filters.
                </div>
              )}
            </div>
          </div>

          {/* Monthly Profit Trend */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Monthly Profit Trend</h3>
                <p className="text-xs text-gray-500">Net profitability by month</p>
              </div>
            </div>
            <div className="h-72 w-full">
              {monthlySales.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No monthly profit data available.
                </div>
              )}
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
              {categoryData.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No category records found.
                </div>
              )}
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
              {regionData.length > 0 ? (
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
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No regional records found.
                </div>
              )}
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
                  By Revenue
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
                    {topSellingProducts.length > 0 ? (
                      topSellingProducts.map((p, idx) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-gray-400">
                          No product records available.
                        </td>
                      </tr>
                    )}
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
                  Computed from Dataset
                </span>
              </div>

              <div className="space-y-3">
                {businessInsights.length > 0 ? (
                  businessInsights.slice(0, 4).map((insight, idx) => (
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
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-400">
                    No business insights can be generated for this data slice.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
