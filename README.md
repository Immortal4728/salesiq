# SalesIQ — Sales Analytics & Business Intelligence Dashboard

SalesIQ is a modern, light-themed **Sales Analytics & Business Intelligence Dashboard** designed as an enterprise portfolio project. It demonstrates end-to-end data processing: from ingestion and cleaning of raw transaction records into a relational **SQLite** database, to running optimized **SQL analytical queries**, delivering dynamic REST API endpoints, and presenting interactive **Recharts** visualizations.

---

## 🚀 Key Features

- **Executive KPI Metrics**:
  - **Total Revenue**: Aggregate gross billing across all completed sales.
  - **Total Profit**: Realized net income with profit margin percentages.
  - **Total Orders**: Count of distinct transactions processed.
  - **Average Order Value (AOV)**: Revenue per transaction.
- **Interactive Visualizations (Recharts)**:
  - **Monthly Revenue Trend**: Smooth Area Chart with subtle blue gradient showing sales trajectory.
  - **Monthly Profit Trend**: Emerald line chart monitoring monthly bottom-line health.
  - **Category-Wise Performance**: Multi-color bar chart comparing Technology, Furniture, and Office Supplies.
  - **Region-Wise Sales**: Horizontal bar chart evaluating sales distribution across geographic territories (West, East, Central, South).
- **Product Ranking**: Top-selling products ranked by revenue, unit quantity, and profit margin.
- **SQL-Derived Business Insights**: Dynamic diagnostic observations (highest revenue month, most profitable category, lead sales region, and low-margin alerts).
- **Real-Time Filtering**: Start & end date filtering, category selection, and region breakdown with instant SQL re-querying and one-click reset.
- **Data Export**: One-click **Export to CSV** for active filtered transaction datasets.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router, React 19) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS |
| **Database** | [SQLite](https://sqlite.org/) via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Data Parsing** | [PapaParse](https://www.papaparse.com/) |

---

## 📊 Dataset & Schema

The application includes a realistic sales dataset (`data/sales_data.csv`) modeled after standard retail enterprise sales data, spanning 2023–2024 across 4 national regions, 3 categories, and 17 sub-categories.

### Database Schema (`sales` table in `data/salesiq.db`)

```sql
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
```

---

## 💡 SQL Analytical Queries Implemented

1. **KPI Aggregations**:
   ```sql
   SELECT
     COALESCE(SUM(sales), 0) AS total_revenue,
     COALESCE(SUM(profit), 0) AS total_profit,
     COUNT(DISTINCT order_id) AS total_orders
   FROM sales
   WHERE order_date >= ? AND order_date <= ?;
   ```
2. **Monthly Sales & Profit Grouping**:
   ```sql
   SELECT
     substr(order_date, 1, 7) AS month,
     ROUND(SUM(sales), 2) AS revenue,
     ROUND(SUM(profit), 2) AS profit,
     COUNT(DISTINCT order_id) AS orders
   FROM sales
   GROUP BY substr(order_date, 1, 7)
   ORDER BY month ASC;
   ```
3. **Category and Regional Volume**:
   ```sql
   SELECT category, ROUND(SUM(sales), 2) AS revenue, ROUND(SUM(profit), 2) AS profit
   FROM sales GROUP BY category ORDER BY revenue DESC;
   ```
4. **Product Profitability Ranking**:
   ```sql
   SELECT product_name, category, ROUND(SUM(sales), 2) AS revenue, ROUND(SUM(profit), 2) AS profit,
          ROUND((SUM(profit) / SUM(sales)) * 100, 1) AS profitMargin
   FROM sales GROUP BY product_name ORDER BY revenue DESC LIMIT 5;
   ```

---

## 📈 Key Findings & Business Observations

- **Dominant Product Division**: **Technology** accounts for **~71%** of aggregate gross revenue ($95.8k out of $134.1k) and delivers the highest profit margin (**26.5%**).
- **Geographic Leader**: The **West** region leads all territories in commercial gross billings ($45.7k) and total profit ($11.7k).
- **Peak Performance Window**: **August 2024** generated the peak monthly revenue ($11,195) driven by high-volume workstation and laptop equipment refreshes.
- **Margin Caution**: Large furniture items (specifically conference tables and oversized desks) exhibit negative or single-digit margins due to heavy freight and promotional discounts exceeding 15%.

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or yarn

### Installation & Setup

1. **Clone or open the project folder**:
   ```bash
   cd salesiq
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000). The database automatically initializes and imports `data/sales_data.csv` on the first query.

5. **Production Build**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📂 Project Structure

```text
salesiq/
├── app/
│   ├── api/analytics/route.ts  # REST API executing SQLite queries
│   ├── layout.tsx              # Root HTML & fonts metadata
│   ├── page.tsx                # Client dashboard connected to SQL API
│   └── globals.css             # Tailwind & theme styles
├── data/
│   ├── sales_data.csv          # Cleaned CSV sales records
│   └── salesiq.db              # SQLite database (auto-generated)
├── lib/
│   ├── db.ts                   # SQLite connection, schema & auto-seed
│   ├── queries.ts              # SQL query implementation functions
│   ├── types.ts                # TypeScript data interfaces
│   ├── analytics.ts            # Formatting & CSV export utilities
│   └── data.ts                 # Sample dataset reference
├── scripts/
│   └── generate_csv.ts         # CSV generation tool
├── package.json
└── README.md
```
