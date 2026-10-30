# SalesIQ — Sales Analytics Dashboard

SalesIQ is an in-memory, client-side **Sales Analytics & Business Intelligence Dashboard** designed as a portfolio project. It operates **100% in browser memory** without requiring any database or backend storage, making it lightweight and deployable to static hosts like **Vercel** and **Netlify**.

---

## 🚀 Key Features

1. **Instant CSV Ingestion & Client Parsing**:
   - Upload any sales CSV file directly via the **Upload CSV** button.
   - Parsed locally in browser memory via [PapaParse](https://www.papaparse.com/) — no files or customer records are ever transmitted to or stored on a server.
   - Intelligent column header matching (automatically recognizes aliases such as `Sales`, `Revenue`, `Order Date`, `Date`, `Category`, `Region`, `Product Name`, etc.).
   - Explicit error handling for missing crucial columns or invalid files.

2. **Executive KPI Calculations**:
   - **Total Revenue**: Aggregate gross volume across filtered transactions.
   - **Total Profit**: Calculated net margin with overall profitability percentage.
   - **Total Orders**: Distinct count of customer transactions.
   - **Average Order Value (AOV)**: Revenue per transaction.

3. **Interactive Recharts Visualizations**:
   - **Monthly Revenue Trend**: Smooth Area Chart with blue gradient fill.
   - **Monthly Profit Trend**: Emerald line chart highlighting bottom-line trends.
   - **Category-Wise Breakdown**: Multi-color bar chart comparing sales by department.
   - **Region-Wise Breakdown**: Horizontal bar chart comparing regional distribution.

4. **Product Ranking & Diagnostic Insights**:
   - Top-selling products table with profit contributions.
   - Automated business insights (highest revenue month, top-performing product category, dominant sales territory, and low-margin warnings).

5. **Universal Interactive Filters**:
   - Date range pickers, category dropdowns, and regional selectors that instantly re-aggregate data in-memory.
   - One-click **Reset Filters** button.

6. **Client-Side Filtered CSV Export**:
   - **Export CSV** button downloads the currently filtered slice of data with UTF-8 BOM encoding.

7. **Privacy & Ephemeral Storage**:
   - All uploaded datasets remain strictly in browser RAM and are automatically wiped on page refresh.
   - Includes a sample dataset on initial load and a **Reset Data** button.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **CSV Engine**: [PapaParse](https://www.papaparse.com/)
- **Database**: **None** (100% Client-Side In-Memory)

---

## 💻 Getting Started Locally

```bash
# Navigate to the project directory
cd salesiq

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Vercel

Because SalesIQ operates entirely client-side without native database binaries or file system dependencies:

1. Push your repository to GitHub.
2. Import the `salesiq` repository on [Vercel](https://vercel.com).
3. Leave build settings as default (`npm run build`).
4. Deploy — it will build and deploy cleanly as a static frontend application.
