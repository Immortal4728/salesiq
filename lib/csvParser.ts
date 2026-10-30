import Papa from 'papaparse';
import { SalesRecord } from './types';

export interface CSVParseResult {
  data: SalesRecord[];
  errors: string[];
  totalRows: number;
}

// Maps alternate common column header names to standardized SalesRecord fields
const HEADER_MAPPINGS: Record<keyof SalesRecord, string[]> = {
  orderId: ['orderid', 'order_id', 'order id', 'id', 'transaction_id', 'transaction id'],
  orderDate: ['orderdate', 'order_date', 'order date', 'date', 'transaction_date', 'sale_date'],
  shipDate: ['shipdate', 'ship_date', 'ship date', 'delivery_date'],
  shipMode: ['shipmode', 'ship_mode', 'ship mode', 'shipping_mode'],
  customerId: ['customerid', 'customer_id', 'customer id', 'client_id'],
  customerName: ['customername', 'customer_name', 'customer name', 'customer', 'client_name', 'client'],
  segment: ['segment', 'customer_segment', 'market_segment'],
  country: ['country', 'country/region', 'nation'],
  city: ['city', 'town', 'municipality'],
  state: ['state', 'province', 'state/province', 'region_state'],
  region: ['region', 'territory', 'zone', 'area'],
  productId: ['productid', 'product_id', 'product id', 'sku', 'item_id'],
  category: ['category', 'product_category', 'department'],
  subCategory: ['subcategory', 'sub_category', 'sub category', 'sub-category'],
  productName: ['productname', 'product_name', 'product name', 'product', 'item_name', 'item', 'title'],
  sales: ['sales', 'revenue', 'sale_amount', 'total_sales', 'amount', 'total_amount', 'price'],
  quantity: ['quantity', 'qty', 'units', 'quantity_sold', 'count'],
  discount: ['discount', 'discount_rate', 'disc', 'rebate'],
  profit: ['profit', 'net_profit', 'net_income', 'margin', 'earnings'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  if (!value) return defaultValue;
  const cleaned = String(value).replace(/[\$,\s%]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseInteger(value: any, defaultValue: number = 1): number {
  if (typeof value === 'number') return isNaN(value) ? defaultValue : Math.round(value);
  if (!value) return defaultValue;
  const cleaned = String(value).replace(/[\$,\s]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function normalizeDate(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // DD-MM-YYYY or MM/DD/YYYY or DD/MM/YYYY
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split('T')[0];
  }

  // Fallback
  return str;
}

/**
 * Validates and converts parsed CSV rows into standardized SalesRecord[]
 */
export function parseSalesCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        const errors: string[] = [];
        const rawRows = results.data as Record<string, any>[];

        if (!rawRows || rawRows.length === 0) {
          resolve({
            data: [],
            errors: ['The uploaded CSV file is empty.'],
            totalRows: 0,
          });
          return;
        }

        // Detect column mapping from file headers
        const firstRow = rawRows[0];
        const fileHeaders = Object.keys(firstRow);
        const resolvedMap: Partial<Record<keyof SalesRecord, string>> = {};

        for (const [key, aliases] of Object.entries(HEADER_MAPPINGS) as [keyof SalesRecord, string[]][]) {
          const match = fileHeaders.find(h => {
            const normalized = normalizeHeader(h);
            return aliases.some(alias => normalizeHeader(alias) === normalized);
          });
          if (match) {
            resolvedMap[key] = match;
          }
        }

        // Validate minimum essential columns
        const missingCrucial: string[] = [];
        if (!resolvedMap.sales) missingCrucial.push('Sales / Revenue');
        if (!resolvedMap.orderDate) missingCrucial.push('Order Date');

        if (missingCrucial.length > 0) {
          resolve({
            data: [],
            errors: [
              `Missing required column(s): ${missingCrucial.join(', ')}. Please ensure your CSV includes columns for date and sales amount.`,
            ],
            totalRows: rawRows.length,
          });
          return;
        }

        const validRecords: SalesRecord[] = [];

        rawRows.forEach((row, index) => {
          const salesVal = parseNumber(resolvedMap.sales ? row[resolvedMap.sales] : 0);
          const rawDate = resolvedMap.orderDate ? row[resolvedMap.orderDate] : null;

          if (salesVal === 0 && !rawDate) {
            // Likely an empty trailing row, skip silently
            return;
          }

          const orderDate = normalizeDate(rawDate);
          const orderId = resolvedMap.orderId && row[resolvedMap.orderId]
            ? String(row[resolvedMap.orderId]).trim()
            : `ORD-${String(index + 1).padStart(4, '0')}`;

          const category = resolvedMap.category && row[resolvedMap.category]
            ? String(row[resolvedMap.category]).trim()
            : 'General';

          const region = resolvedMap.region && row[resolvedMap.region]
            ? String(row[resolvedMap.region]).trim()
            : 'General';

          const productName = resolvedMap.productName && row[resolvedMap.productName]
            ? String(row[resolvedMap.productName]).trim()
            : 'Standard Product';

          const quantity = parseInteger(resolvedMap.quantity ? row[resolvedMap.quantity] : 1, 1);
          const discount = parseNumber(resolvedMap.discount ? row[resolvedMap.discount] : 0, 0);

          // If profit column is missing, estimate a standard 20% margin
          const profit = resolvedMap.profit !== undefined && row[resolvedMap.profit] !== undefined && row[resolvedMap.profit] !== null
            ? parseNumber(row[resolvedMap.profit])
            : Math.round(salesVal * 0.22 * 100) / 100;

          validRecords.push({
            orderId,
            orderDate,
            shipDate: resolvedMap.shipDate && row[resolvedMap.shipDate] ? String(row[resolvedMap.shipDate]) : orderDate,
            shipMode: resolvedMap.shipMode && row[resolvedMap.shipMode] ? String(row[resolvedMap.shipMode]) : 'Standard',
            customerId: resolvedMap.customerId && row[resolvedMap.customerId] ? String(row[resolvedMap.customerId]) : `CUS-${index + 1}`,
            customerName: resolvedMap.customerName && row[resolvedMap.customerName] ? String(row[resolvedMap.customerName]) : 'Customer',
            segment: resolvedMap.segment && row[resolvedMap.segment] ? String(row[resolvedMap.segment]) : 'Consumer',
            country: resolvedMap.country && row[resolvedMap.country] ? String(row[resolvedMap.country]) : 'Global',
            city: resolvedMap.city && row[resolvedMap.city] ? String(row[resolvedMap.city]) : 'City',
            state: resolvedMap.state && row[resolvedMap.state] ? String(row[resolvedMap.state]) : region,
            region,
            productId: resolvedMap.productId && row[resolvedMap.productId] ? String(row[resolvedMap.productId]) : `PRD-${index + 1}`,
            category,
            subCategory: resolvedMap.subCategory && row[resolvedMap.subCategory] ? String(row[resolvedMap.subCategory]) : category,
            productName,
            sales: salesVal,
            quantity,
            discount,
            profit,
          });
        });

        if (validRecords.length === 0) {
          errors.push('No valid records could be extracted from the uploaded CSV file.');
        }

        resolve({
          data: validRecords,
          errors,
          totalRows: rawRows.length,
        });
      },
      error: (err) => {
        resolve({
          data: [],
          errors: [`CSV Parsing Error: ${err.message}`],
          totalRows: 0,
        });
      },
    });
  });
}
