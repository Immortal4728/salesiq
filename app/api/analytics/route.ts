import { NextResponse } from 'next/server';
import {
  getKPIsFromSQL,
  getMonthlySalesFromSQL,
  getCategorySalesFromSQL,
  getRegionSalesFromSQL,
  getTopProductsFromSQL,
  getBusinessInsightsFromSQL,
  getFilterMetadataFromSQL,
  getFilteredRecordsFromSQL
} from '@/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const category = searchParams.get('category') || undefined;
    const region = searchParams.get('region') || undefined;
    const exportRaw = searchParams.get('export') === 'true';

    const filters = { startDate, endDate, category, region };

    if (exportRaw) {
      const records = getFilteredRecordsFromSQL(filters);
      return NextResponse.json({ records });
    }

    const metadata = getFilterMetadataFromSQL();
    const kpis = getKPIsFromSQL(filters);
    const monthlySales = getMonthlySalesFromSQL(filters);
    const categoryData = getCategorySalesFromSQL(filters);
    const regionData = getRegionSalesFromSQL(filters);
    const topProducts = getTopProductsFromSQL(filters, 5);
    const businessInsights = getBusinessInsightsFromSQL(filters);

    return NextResponse.json({
      metadata,
      kpis,
      monthlySales,
      categoryData,
      regionData,
      topProducts,
      businessInsights,
    });
  } catch (error: any) {
    console.error('Error executing analytics query:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data', details: error.message },
      { status: 500 }
    );
  }
}
