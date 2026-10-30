// Core data types for SalesIQ analytics dashboard

export interface SalesRecord {
  orderId: string;
  orderDate: string;
  shipDate: string;
  shipMode: string;
  customerId: string;
  customerName: string;
  segment: string;
  country: string;
  city: string;
  state: string;
  region: string;
  productId: string;
  category: string;
  subCategory: string;
  productName: string;
  sales: number;
  quantity: number;
  discount: number;
  profit: number;
}

export interface KPIData {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  avgOrderValue: number;
  prevRevenue: number;
  prevProfit: number;
  prevOrders: number;
  prevAvgOrderValue: number;
}

export interface MonthlySales {
  month: string;
  monthLabel: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface CategoryData {
  category: string;
  revenue: number;
  profit: number;
  orders: number;
  quantity: number;
}

export interface RegionData {
  region: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface StateData {
  state: string;
  region: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface ProductData {
  productName: string;
  category: string;
  subCategory: string;
  revenue: number;
  profit: number;
  quantity: number;
  orders: number;
  profitMargin: number;
}

export interface BusinessInsight {
  title: string;
  description: string;
  value: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}

export interface DateRange {
  start: string;
  end: string;
}

export interface Filters {
  dateRange: DateRange;
  categories: string[];
  regions: string[];
}
