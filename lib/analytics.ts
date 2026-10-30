import { SalesRecord, KPIData, MonthlySales, CategoryData, RegionData, StateData, ProductData, BusinessInsight, Filters } from './types';

export function filterData(data: SalesRecord[], filters: Filters): SalesRecord[] {
  return data.filter(record => {
    const orderDate = record.orderDate;

    // Date range filter
    if (filters.dateRange.start && orderDate < filters.dateRange.start) return false;
    if (filters.dateRange.end && orderDate > filters.dateRange.end) return false;

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(record.category)) return false;

    // Region filter
    if (filters.regions.length > 0 && !filters.regions.includes(record.region)) return false;

    return true;
  });
}

export function calculateKPIs(currentData: SalesRecord[], previousData: SalesRecord[]): KPIData {
  const totalRevenue = currentData.reduce((sum, r) => sum + r.sales, 0);
  const totalProfit = currentData.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = new Set(currentData.map(r => r.orderId)).size;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const prevRevenue = previousData.reduce((sum, r) => sum + r.sales, 0);
  const prevProfit = previousData.reduce((sum, r) => sum + r.profit, 0);
  const prevOrders = new Set(previousData.map(r => r.orderId)).size;
  const prevAvgOrderValue = prevOrders > 0 ? prevRevenue / prevOrders : 0;

  return {
    totalRevenue,
    totalProfit,
    totalOrders,
    avgOrderValue,
    prevRevenue,
    prevProfit,
    prevOrders,
    prevAvgOrderValue,
  };
}

export function getPreviousPeriodData(data: SalesRecord[], filters: Filters): SalesRecord[] {
  if (!filters.dateRange.start || !filters.dateRange.end) {
    // If no date range set, there's no "previous period"
    return [];
  }

  const start = new Date(filters.dateRange.start);
  const end = new Date(filters.dateRange.end);
  const durationMs = end.getTime() - start.getTime();

  const prevEnd = new Date(start.getTime() - 1); // day before current start
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  const prevFilters: Filters = {
    ...filters,
    dateRange: {
      start: prevStart.toISOString().split('T')[0],
      end: prevEnd.toISOString().split('T')[0],
    },
  };

  return filterData(data, prevFilters);
}

export function getMonthlySales(data: SalesRecord[]): MonthlySales[] {
  const monthMap = new Map<string, { revenue: number; profit: number; orders: Set<string> }>();

  data.forEach(record => {
    const month = record.orderDate.substring(0, 7); // YYYY-MM
    if (!monthMap.has(month)) {
      monthMap.set(month, { revenue: 0, profit: 0, orders: new Set() });
    }
    const entry = monthMap.get(month)!;
    entry.revenue += record.sales;
    entry.profit += record.profit;
    entry.orders.add(record.orderId);
  });

  const months = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [year, m] = month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month,
        monthLabel: `${monthNames[parseInt(m) - 1]} ${year}`,
        revenue: Math.round(data.revenue * 100) / 100,
        profit: Math.round(data.profit * 100) / 100,
        orders: data.orders.size,
      };
    });

  return months;
}

export function getCategoryData(data: SalesRecord[]): CategoryData[] {
  const catMap = new Map<string, CategoryData>();

  data.forEach(record => {
    if (!catMap.has(record.category)) {
      catMap.set(record.category, { category: record.category, revenue: 0, profit: 0, orders: 0, quantity: 0 });
    }
    const entry = catMap.get(record.category)!;
    entry.revenue += record.sales;
    entry.profit += record.profit;
    entry.orders += 1;
    entry.quantity += record.quantity;
  });

  return Array.from(catMap.values())
    .map(c => ({
      ...c,
      revenue: Math.round(c.revenue * 100) / 100,
      profit: Math.round(c.profit * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getRegionData(data: SalesRecord[]): RegionData[] {
  const regMap = new Map<string, RegionData>();

  data.forEach(record => {
    if (!regMap.has(record.region)) {
      regMap.set(record.region, { region: record.region, revenue: 0, profit: 0, orders: 0 });
    }
    const entry = regMap.get(record.region)!;
    entry.revenue += record.sales;
    entry.profit += record.profit;
    entry.orders += 1;
  });

  return Array.from(regMap.values())
    .map(r => ({
      ...r,
      revenue: Math.round(r.revenue * 100) / 100,
      profit: Math.round(r.profit * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getStateData(data: SalesRecord[]): StateData[] {
  const stateMap = new Map<string, StateData>();

  data.forEach(record => {
    if (!stateMap.has(record.state)) {
      stateMap.set(record.state, { state: record.state, region: record.region, revenue: 0, profit: 0, orders: 0 });
    }
    const entry = stateMap.get(record.state)!;
    entry.revenue += record.sales;
    entry.profit += record.profit;
    entry.orders += 1;
  });

  return Array.from(stateMap.values())
    .map(s => ({
      ...s,
      revenue: Math.round(s.revenue * 100) / 100,
      profit: Math.round(s.profit * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function getProductData(data: SalesRecord[]): ProductData[] {
  const prodMap = new Map<string, ProductData>();

  data.forEach(record => {
    if (!prodMap.has(record.productName)) {
      prodMap.set(record.productName, {
        productName: record.productName,
        category: record.category,
        subCategory: record.subCategory,
        revenue: 0,
        profit: 0,
        quantity: 0,
        orders: 0,
        profitMargin: 0,
      });
    }
    const entry = prodMap.get(record.productName)!;
    entry.revenue += record.sales;
    entry.profit += record.profit;
    entry.quantity += record.quantity;
    entry.orders += 1;
  });

  return Array.from(prodMap.values())
    .map(p => ({
      ...p,
      revenue: Math.round(p.revenue * 100) / 100,
      profit: Math.round(p.profit * 100) / 100,
      profitMargin: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function generateBusinessInsights(data: SalesRecord[]): BusinessInsight[] {
  if (data.length === 0) return [];

  const insights: BusinessInsight[] = [];

  // 1. Highest revenue month
  const monthly = getMonthlySales(data);
  if (monthly.length > 0) {
    const bestMonth = monthly.reduce((max, m) => m.revenue > max.revenue ? m : max);
    insights.push({
      title: 'Highest Revenue Month',
      description: `${bestMonth.monthLabel} generated the highest revenue in the selected period with ${bestMonth.orders} orders.`,
      value: formatCurrency(bestMonth.revenue),
      type: 'success',
    });
  }

  // 2. Most profitable category
  const categories = getCategoryData(data);
  if (categories.length > 0) {
    const bestCat = categories.reduce((max, c) => c.profit > max.profit ? c : max);
    const margin = bestCat.revenue > 0 ? ((bestCat.profit / bestCat.revenue) * 100).toFixed(1) : '0';
    insights.push({
      title: 'Most Profitable Category',
      description: `${bestCat.category} leads in profitability with a ${margin}% profit margin across ${bestCat.orders} orders.`,
      value: formatCurrency(bestCat.profit),
      type: 'success',
    });
  }

  // 3. Best performing region
  const regions = getRegionData(data);
  if (regions.length > 0) {
    const bestRegion = regions.reduce((max, r) => r.revenue > max.revenue ? r : max);
    insights.push({
      title: 'Best Performing Region',
      description: `The ${bestRegion.region} region leads in revenue with ${bestRegion.orders} orders and ${formatCurrency(bestRegion.profit)} in profit.`,
      value: formatCurrency(bestRegion.revenue),
      type: 'info',
    });
  }

  // 4. High revenue but low profit products
  const products = getProductData(data);
  const highRevLowProfit = products.filter(p => p.revenue > 200 && p.profitMargin < 10 && p.profitMargin >= 0);
  if (highRevLowProfit.length > 0) {
    const topOffender = highRevLowProfit[0];
    insights.push({
      title: 'High Revenue, Low Profit Alert',
      description: `${topOffender.productName} generates ${formatCurrency(topOffender.revenue)} in revenue but only ${topOffender.profitMargin}% profit margin. ${highRevLowProfit.length} product(s) have this pattern.`,
      value: `${topOffender.profitMargin}% margin`,
      type: 'warning',
    });
  }

  // 5. Loss-making products
  const lossProducts = products.filter(p => p.profit < 0);
  if (lossProducts.length > 0) {
    const totalLoss = lossProducts.reduce((sum, p) => sum + p.profit, 0);
    insights.push({
      title: 'Products with Negative Profit',
      description: `${lossProducts.length} product(s) are generating losses. Total loss: ${formatCurrency(Math.abs(totalLoss))}. Review discount strategies and pricing for these items.`,
      value: `${lossProducts.length} products`,
      type: 'danger',
    });
  }

  // 6. Top customer segment
  const segmentMap = new Map<string, { revenue: number; orders: number }>();
  data.forEach(r => {
    if (!segmentMap.has(r.segment)) segmentMap.set(r.segment, { revenue: 0, orders: 0 });
    const entry = segmentMap.get(r.segment)!;
    entry.revenue += r.sales;
    entry.orders += 1;
  });
  const segments = Array.from(segmentMap.entries()).sort((a, b) => b[1].revenue - a[1].revenue);
  if (segments.length > 0) {
    const [bestSeg, bestData] = segments[0];
    insights.push({
      title: 'Top Customer Segment',
      description: `The ${bestSeg} segment contributes the most revenue with ${bestData.orders} orders, representing ${((bestData.revenue / data.reduce((s, r) => s + r.sales, 0)) * 100).toFixed(1)}% of total sales.`,
      value: formatCurrency(bestData.revenue),
      type: 'info',
    });
  }

  // 7. Average discount impact
  const discountedOrders = data.filter(r => r.discount > 0);
  if (discountedOrders.length > 0) {
    const avgDiscount = discountedOrders.reduce((sum, r) => sum + r.discount, 0) / discountedOrders.length;
    const discountedProfit = discountedOrders.reduce((sum, r) => sum + r.profit, 0);
    const nonDiscountedProfit = data.filter(r => r.discount === 0).reduce((sum, r) => sum + r.profit, 0);
    const discountedAvgMargin = discountedOrders.reduce((sum, r) => sum + r.sales, 0);
    const dMargin = discountedAvgMargin > 0 ? (discountedProfit / discountedAvgMargin * 100).toFixed(1) : '0';
    const nonDiscountedSales = data.filter(r => r.discount === 0).reduce((sum, r) => sum + r.sales, 0);
    const ndMargin = nonDiscountedSales > 0 ? (nonDiscountedProfit / nonDiscountedSales * 100).toFixed(1) : '0';
    insights.push({
      title: 'Discount Impact Analysis',
      description: `${discountedOrders.length} orders had discounts (avg ${(avgDiscount * 100).toFixed(1)}%). Discounted orders have ${dMargin}% margin vs ${ndMargin}% for full-price orders.`,
      value: `${(avgDiscount * 100).toFixed(1)}% avg`,
      type: 'warning',
    });
  }

  // 8. Monthly growth trend
  if (monthly.length >= 2) {
    const last = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    const growth = prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue * 100) : 0;
    insights.push({
      title: 'Latest Monthly Trend',
      description: `Revenue ${growth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(growth).toFixed(1)}% from ${prev.monthLabel} to ${last.monthLabel}.`,
      value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      type: growth >= 0 ? 'success' : 'danger',
    });
  }

  return insights;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('exportToCSV: No data provided');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        let val = row[h];
        if (val === null || val === undefined) return '';
        const strVal = String(val);
        if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
          return `"${strVal.replace(/"/g, '""')}"`;
        }
        return strVal;
      }).join(',')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}
