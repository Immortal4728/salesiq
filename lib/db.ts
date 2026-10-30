import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const DB_PATH = path.join(process.cwd(), 'data', 'salesiq.db');
const CSV_PATH = path.join(process.cwd(), 'data', 'sales_data.csv');

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Initialize schema if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      order_date TEXT NOT NULL,
      ship_date TEXT,
      ship_mode TEXT,
      customer_id TEXT,
      customer_name TEXT,
      segment TEXT,
      country TEXT,
      city TEXT,
      state TEXT,
      region TEXT NOT NULL,
      product_id TEXT,
      category TEXT NOT NULL,
      sub_category TEXT,
      product_name TEXT NOT NULL,
      sales REAL NOT NULL,
      quantity INTEGER NOT NULL,
      discount REAL DEFAULT 0,
      profit REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(order_date);
    CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(category);
    CREATE INDEX IF NOT EXISTS idx_sales_region ON sales(region);
  `);

  // Check if data is already imported
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM sales');
  const { count } = countStmt.get() as { count: number };

  if (count === 0 && fs.existsSync(CSV_PATH)) {
    console.log('Seeding SQLite database from CSV dataset...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    const insertStmt = db.prepare(`
      INSERT INTO sales (
        order_id, order_date, ship_date, ship_mode, customer_id, customer_name,
        segment, country, city, state, region, product_id, category,
        sub_category, product_name, sales, quantity, discount, profit
      ) VALUES (
        @orderId, @orderDate, @shipDate, @shipMode, @customerId, @customerName,
        @segment, @country, @city, @state, @region, @productId, @category,
        @subCategory, @productName, @sales, @quantity, @discount, @profit
      )
    `);

    const insertMany = db.transaction((rows: any[]) => {
      for (const row of rows) {
        // Clean & normalize data types
        const cleaned = {
          orderId: String(row.orderId || '').trim(),
          orderDate: String(row.orderDate || '').trim(),
          shipDate: String(row.shipDate || '').trim(),
          shipMode: String(row.shipMode || 'Standard').trim(),
          customerId: String(row.customerId || '').trim(),
          customerName: String(row.customerName || 'Anonymous').trim(),
          segment: String(row.segment || 'Consumer').trim(),
          country: String(row.country || 'United States').trim(),
          city: String(row.city || '').trim(),
          state: String(row.state || '').trim(),
          region: String(row.region || 'Unknown').trim(),
          productId: String(row.productId || '').trim(),
          category: String(row.category || 'General').trim(),
          subCategory: String(row.subCategory || '').trim(),
          productName: String(row.productName || 'Unnamed Product').trim(),
          sales: typeof row.sales === 'number' ? row.sales : parseFloat(row.sales) || 0,
          quantity: typeof row.quantity === 'number' ? row.quantity : parseInt(row.quantity, 10) || 1,
          discount: typeof row.discount === 'number' ? row.discount : parseFloat(row.discount) || 0,
          profit: typeof row.profit === 'number' ? row.profit : parseFloat(row.profit) || 0,
        };
        if (cleaned.orderId && cleaned.orderDate) {
          insertStmt.run(cleaned);
        }
      }
    });

    insertMany(parsed.data);
    console.log(`Successfully imported ${parsed.data.length} records into SQLite database.`);
  }

  dbInstance = db;
  return dbInstance;
}
