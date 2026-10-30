import fs from 'fs';
import path from 'path';
import { getSalesData } from '../lib/data';

const data = getSalesData();
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Convert dataset to CSV
const headers = [
  'orderId',
  'orderDate',
  'shipDate',
  'shipMode',
  'customerId',
  'customerName',
  'segment',
  'country',
  'city',
  'state',
  'region',
  'productId',
  'category',
  'subCategory',
  'productName',
  'sales',
  'quantity',
  'discount',
  'profit'
];

const csvRows = [headers.join(',')];

for (const row of data) {
  const values = headers.map(header => {
    let val = (row as any)[header];
    if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
      val = `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  });
  csvRows.push(values.join(','));
}

const csvPath = path.join(dataDir, 'sales_data.csv');
fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
console.log(`Generated CSV dataset at: ${csvPath} with ${data.length} records.`);
