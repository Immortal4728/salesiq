'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search } from 'lucide-react';
import { ProductData, CategoryData } from '@/lib/types';
import { formatCurrency, formatNumber, exportToCSV } from '@/lib/analytics';

interface ProductViewProps {
  products: ProductData[];
  categories: CategoryData[];
  loading?: boolean;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ProductAnalysisView({ products, categories, loading }: ProductViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof ProductData>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const top10RevenueProducts = useMemo(() => {
    return [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [products, searchTerm, selectedCategory, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleSort = (field: keyof ProductData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const exportRows = filteredProducts.map(p => ({
      'Product Name': p.productName,
      'Category': p.category,
      'Sub-Category': p.subCategory,
      'Revenue ($)': p.revenue,
      'Profit ($)': p.profit,
      'Units Sold': p.quantity,
      'Orders': p.orders,
      'Profit Margin (%)': `${p.profitMargin}%`
    }));
    exportToCSV(exportRows, `salesiq-product-analysis-${new Date().toISOString().split('T')[0]}`);
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
      {/* Top 10 Best Sellers & Category Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Best Sellers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Top 10 Best-Selling Products</h3>
              <p className="text-xs text-gray-500">Ranked by gross sales volume</p>
            </div>
            <span className="badge badge-info">Top 10</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10RevenueProducts}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={140}
                  tick={{ fontSize: 11, fill: '#4b5563' }}
                  tickFormatter={(val) => val.length > 20 ? `${val.substring(0, 18)}...` : val}
                />
                <Tooltip
                  formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue & Profit by Product Category */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Category Share & Performance</h3>
              <p className="text-xs text-gray-500">Revenue split and profitability across divisions</p>
            </div>
            <div className="flex gap-1">
              {categories.map((c, i) => (
                <span key={c.category} className="inline-flex items-center text-xs text-gray-600 gap-1 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {c.category}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-80 items-center">
            <div className="h-64 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Revenue Share</span>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-64 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Profit Share</span>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="profit"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-profit-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Profit']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance Ranking Table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Product Performance Ranking</h3>
            <p className="text-xs text-gray-500">Comprehensive catalog profitability & unit breakdown</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
            >
              <option value="All">All Categories</option>
              {categories.map(c => (
                <option key={c.category} value={c.category}>{c.category}</option>
              ))}
            </select>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <th
                  className="py-3 px-4 cursor-pointer select-none"
                  onClick={() => handleSort('productName')}
                >
                  <div className="flex items-center gap-1">
                    Product
                    {sortField === 'productName' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer select-none"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === 'category' ? (
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
                  onClick={() => handleSort('profitMargin')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Margin
                    {sortField === 'profitMargin' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer select-none"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Qty Sold
                    {sortField === 'quantity' ? (
                      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                    ) : <ArrowUpDown size={12} className="text-gray-400" />}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((p, idx) => {
                  const isNegativeProfit = p.profit < 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{p.productName}</div>
                        <div className="text-[11px] text-gray-400">{p.subCategory}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="badge badge-default">{p.category}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {formatCurrency(p.revenue)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${isNegativeProfit ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(p.profit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.profitMargin >= 25
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.profitMargin >= 10
                            ? 'bg-blue-50 text-blue-700'
                            : p.profitMargin >= 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {p.profitMargin}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {formatNumber(p.quantity)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No products found matching the criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 text-xs text-gray-500">
          <div>
            Showing <span className="font-medium">{filteredProducts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pageSize, filteredProducts.length)}</span> of{' '}
            <span className="font-medium">{filteredProducts.length}</span> products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="px-2 font-medium text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
