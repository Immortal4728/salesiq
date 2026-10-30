import { getDatabase } from './db';
import {
  KPIData,
  MonthlySales,
  CategoryData,
  RegionData,
  ProductData,
  BusinessInsight,
  Filters,
  SalesRecord
} from './types';
import { formatCurrency } from './analytics';

interface QueryFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  region?: string;
}

function buildWhereClause(filters?: QueryFilters): { sql: string; params: any[] } {
  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (filters?.startDate) {
    conditions.push('order_date >= ?');
    params.push(filters.startDate);
  }
  if (filters?.endDate) {
    conditions.push('order_date <= ?');
    params.push(filters.endDate);
  }
  if (filters?.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters?.region) {
    conditions.push('region = ?');
    params.push(filters.region);
  }

  return {
    sql: conditions.join(' AND '),
    params,
  };
}

/**
 * 1. Calculate Core KPIs using SQL
 */
export function getKPIsFromSQL(filters?: QueryFilters): KPIData {
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  // Main metrics
  const currentStmt = db.prepare(`
    SELECT
      COALESCE(SUM(sales), 0) AS total_revenue,
      COALESCE(SUM(profit), 0) AS total_profit,
      COUNT(DISTINCT order_id) AS total_orders
    FROM sales
    WHERE ${sql}
  `);

  const current = currentStmt.get(...params) as {
    total_revenue: number;
    total_profit: number;
    total_orders: number;
  };

  const totalRevenue = Math.round(current.total_revenue * 100) / 100;
  const totalProfit = Math.round(current.total_profit * 100) / 100;
  const totalOrders = current.total_orders;
  const avgOrderValue = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  // Previous period calculations if dates are provided
  let prevRevenue = 0;
  let prevProfit = 0;
  let prevOrders = 0;
  let prevAvgOrderValue = 0;

  if (filters?.startDate && filters?.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    const duration = end.getTime() - start.getTime();

    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);

    const prevFilters: QueryFilters = {
      ...filters,
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
    };

    const prevWhere = buildWhereClause(prevFilters);
    const prevStmt = db.prepare(`
      SELECT
        COALESCE(SUM(sales), 0) AS prev_revenue,
        COALESCE(SUM(profit), 0) AS prev_profit,
        COUNT(DISTINCT order_id) AS prev_orders
      FROM sales
      WHERE ${prevWhere.sql}
    `);

    const prevRes = prevStmt.get(...prevWhere.params) as {
      prev_revenue: number;
      prev_profit: number;
      prev_orders: number;
    };

    prevRevenue = Math.round(prevRes.prev_revenue * 100) / 100;
    prevProfit = Math.round(prevRes.prev_profit * 100) / 100;
    prevOrders = prevRes.prev_orders;
    prevAvgOrderValue = prevOrders > 0 ? Math.round((prevRevenue / prevOrders) * 100) / 100 : 0;
  }

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

/**
 * 2. Monthly Revenue and Profit Trend via SQL
 */
export function getMonthlySalesFromSQL(filters?: QueryFilters): MonthlySales[] {
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  const stmt = db.prepare(`
    SELECT
      substr(order_date, 1, 7) AS month,
      ROUND(SUM(sales), 2) AS revenue,
      ROUND(SUM(profit), 2) AS profit,
      COUNT(DISTINCT order_id) AS orders
    FROM sales
    WHERE ${sql}
    GROUP BY substr(order_date, 1, 7)
    ORDER BY month ASC
  `);

  const rows = stmt.all(...params) as Array<{
    month: string;
    revenue: number;
    profit: number;
    orders: number;
  }>;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return rows.map(r => {
    const [year, m] = r.month.split('-');
    const label = `${monthNames[parseInt(m, 10) - 1]} ${year}`;
    return {
      month: r.month,
      monthLabel: label,
      revenue: r.revenue,
      profit: r.profit,
      orders: r.orders,
    };
  });
}

/**
 * 3. Category-Wise Performance via SQL
 */
export function getCategorySalesFromSQL(filters?: QueryFilters): CategoryData[] {
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  const stmt = db.prepare(`
    SELECT
      category,
      ROUND(SUM(sales), 2) AS revenue,
      ROUND(SUM(profit), 2) AS profit,
      COUNT(DISTINCT order_id) AS orders,
      SUM(quantity) AS quantity
    FROM sales
    WHERE ${sql}
    GROUP BY category
    ORDER BY revenue DESC
  `);

  return stmt.all(...params) as CategoryData[];
}

/**
 * 4. Region-Wise Performance via SQL
 */
export function getRegionSalesFromSQL(filters?: QueryFilters): RegionData[] {
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  const stmt = db.prepare(`
    SELECT
      region,
      ROUND(SUM(sales), 2) AS revenue,
      ROUND(SUM(profit), 2) AS profit,
      COUNT(DISTINCT order_id) AS orders
    FROM sales
    WHERE ${sql}
    GROUP BY region
    ORDER BY revenue DESC
  `);

  return stmt.all(...params) as RegionData[];
}

/**
 * 5. Top-Selling Products via SQL
 */
export function getTopProductsFromSQL(filters?: QueryFilters, limit: number = 5): ProductData[] {
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  const stmt = db.prepare(`
    SELECT
      product_name AS productName,
      category,
      sub_category AS subCategory,
      ROUND(SUM(sales), 2) AS revenue,
      ROUND(SUM(profit), 2) AS profit,
      SUM(quantity) AS quantity,
      COUNT(DISTINCT order_id) AS orders,
      CASE
        WHEN SUM(sales) > 0 THEN ROUND((SUM(profit) / SUM(sales)) * 100, 1)
        ELSE 0
      END AS profitMargin
    FROM sales
    WHERE ${sql}
    GROUP BY product_name, category, sub_category
    ORDER BY revenue DESC
    LIMIT ?
  `);

  return stmt.all(...params, limit) as ProductData[];
}

/**
 * 6. Business Insights from Analyzed SQL Dataset
 */
export function getBusinessInsightsFromSQL(filters?: QueryFilters): BusinessInsight[] {
  const insights: BusinessInsight[] = [];
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  // Highest revenue month
  const monthly = getMonthlySalesFromSQL(filters);
  if (monthly.length > 0) {
    const bestMonth = monthly.reduce((max, m) => m.revenue > max.revenue ? m : max);
    insights.push({
      title: 'Highest Revenue Month',
      description: `${bestMonth.monthLabel} generated the peak revenue of the selected timeframe across ${bestMonth.orders} orders.`,
      value: formatCurrency(bestMonth.revenue),
      type: 'success',
    });
  }

  // Top category by profit
  const categories = getCategorySalesFromSQL(filters);
  if (categories.length > 0) {
    const topCat = categories.reduce((max, c) => c.profit > max.profit ? c : max);
    const margin = topCat.revenue > 0 ? ((topCat.profit / topCat.revenue) * 100).toFixed(1) : '0';
    insights.push({
      title: 'Top Profit Category',
      description: `${topCat.category} leads overall profitability with a ${margin}% profit margin.`,
      value: formatCurrency(topCat.profit),
      type: 'success',
    });
  }

  // Best performing region
  const regions = getRegionSalesFromSQL(filters);
  if (regions.length > 0) {
    const topRegion = regions.reduce((max, r) => r.revenue > max.revenue ? r : max);
    insights.push({
      title: 'Dominant Sales Territory',
      description: `The ${topRegion.region} region generated highest commercial volume with ${formatCurrency(topRegion.profit)} profit.`,
      value: formatCurrency(topRegion.revenue),
      type: 'info',
    });
  }

  // High Revenue but low margin alert
  const alertStmt = db.prepare(`
    SELECT
      product_name AS productName,
      ROUND(SUM(sales), 2) AS revenue,
      CASE WHEN SUM(sales) > 0 THEN ROUND((SUM(profit) / SUM(sales)) * 100, 1) ELSE 0 END AS margin
    FROM sales
    WHERE ${sql}
    GROUP BY product_name
    HAVING SUM(sales) > 500 AND (SUM(profit) / SUM(sales)) < 0.12
    ORDER BY revenue DESC
    LIMIT 1
  `);

  const lowMarginProd = alertStmt.get(...params) as { productName: string; revenue: number; margin: number } | undefined;
  if (lowMarginProd) {
    insights.push({
      title: 'Margin Compression Alert',
      description: `${lowMarginProd.productName} produced substantial revenue (${formatCurrency(lowMarginProd.revenue)}) but operates at only ${lowMarginProd.margin}% margin.`,
      value: `${lowMarginProd.margin}% margin`,
      type: 'warning',
    });
  }

  return insights;
}

/**
 * 7. Filter boundaries & Raw transactions export
 */
export function getFilterMetadataFromSQL() {
  const db = getDatabase();
  const dateBounds = db.prepare(`SELECT MIN(order_date) as minDate, MAX(order_date) as maxDate FROM sales`).get() as { minDate: string; maxDate: string };
  const categories = (db.prepare(`SELECT DISTINCT category FROM sales ORDER BY category ASC`).all() as { category: string }[]).map(r => r.category);
  const regions = (db.prepare(`SELECT DISTINCT region FROM sales ORDER BY region ASC`).all() as { region: string }[]).map(r => r.region);
  const totalCount = (db.prepare(`SELECT COUNT(*) as count FROM sales`).get() as { count: number }).count;

  return {
    dateRange: { min: dateBounds.minDate, max: dateBounds.maxDate },
    categories,
    regions,
    totalCount,
  };
}

export function getFilteredRecordsFromSQL(filters?: QueryFilters): SalesRecord[] {
  const db = getDatabase();
  const { sql, params } = buildWhereClause(filters);

  const stmt = db.prepare(`
    SELECT
      order_id AS orderId,
      order_date AS orderDate,
      ship_date AS shipDate,
      ship_mode AS shipMode,
      customer_id AS customerId,
      customer_name AS customerName,
      segment,
      country,
      city,
      state,
      region,
      product_id AS productId,
      category,
      sub_category AS subCategory,
      product_name AS productName,
      sales,
      quantity,
      discount,
      profit
    FROM sales
    WHERE ${sql}
    ORDER BY order_date DESC
  `);

  return stmt.all(...params) as SalesRecord[];
}
