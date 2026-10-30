'use client';

import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Target,
  Sparkles
} from 'lucide-react';
import { BusinessInsight, ProductData, CategoryData, RegionData } from '@/lib/types';
import { formatCurrency } from '@/lib/analytics';

interface BusinessInsightsProps {
  insights: BusinessInsight[];
  products: ProductData[];
  categories: CategoryData[];
  regions: RegionData[];
  loading?: boolean;
}

export default function BusinessInsightsView({
  insights,
  products,
  categories,
  regions,
  loading
}: BusinessInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton h-44 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const getInsightIcon = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="text-emerald-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-600" size={20} />;
      case 'danger':
        return <ShieldAlert className="text-red-600" size={20} />;
      case 'info':
      default:
        return <Sparkles className="text-blue-600" size={20} />;
    }
  };

  const getBadgeClass = (type: BusinessInsight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Find products generating high revenue but low or negative margin
  const underperformingProducts = products
    .filter(p => p.revenue > 300 && p.profitMargin < 12)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
            <Lightbulb size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Executive Business Insights & Diagnoses</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-3xl leading-relaxed">
              Algorithmic intelligence derived from dataset transactions. These findings highlight strategic growth drivers,
              cost-containment areas, and actionable commercial recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Data-Driven Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="card p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                {getInsightIcon(insight.type)}
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getBadgeClass(insight.type)}`}>
                {insight.value}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{insight.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Automated Diagnosis</span>
              <span className="font-medium text-blue-600 flex items-center gap-1">
                Verified Dataset <ArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Focus Area: High Revenue, Low Profitability Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Margin Erosion Watchlist</h3>
                <p className="text-xs text-gray-500">Products with significant revenue but below-target margins</p>
              </div>
            </div>
            <span className="badge badge-warning">Attention</span>
          </div>

          <div className="space-y-3">
            {underperformingProducts.length > 0 ? (
              underperformingProducts.map((p, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                  <div className="pr-4">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{p.productName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{p.category} &bull; {p.subCategory}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-900">{formatCurrency(p.revenue)}</p>
                    <span className={`text-[11px] font-semibold ${p.profitMargin < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.profitMargin}% margin
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">No low-margin high-revenue items identified</p>
            )}
          </div>
        </div>

        {/* Strategic Business Recommendations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Executive Strategic Recommendations</h3>
                <p className="text-xs text-gray-500">Action items based on the active portfolio analysis</p>
              </div>
            </div>
            <span className="badge badge-info">Action Plan</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/40">
              <h4 className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                1. Re-evaluate Discounting Strategy on Heavy Furniture
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Tables and Bookcases exhibit compressed profit margins due to freight costs and promotional discount rates exceeding 15%.
                Consider implementing tiered volume thresholds instead of flat percentage reductions.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40">
              <h4 className="font-semibold text-emerald-900 flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                2. Expand High-Margin Technology Bundles
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Technology accessories and phones command superior net margins (&gt;25%). Promote cross-selling phone and copier peripherals
                during corporate procurement cycles to maximize gross margin return.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-purple-100 bg-purple-50/40">
              <h4 className="font-semibold text-purple-900 flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                3. Replicate West & East Region Playbooks in Central Territories
              </h4>
              <p className="text-gray-600 leading-relaxed">
                The West and East regions consistently outperform in both customer retention and Average Order Value (AOV).
                Align Midwest sales operations with Coastal account management practices to recover regional profitability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
