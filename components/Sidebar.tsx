'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  MapPin,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales Trends', icon: TrendingUp },
  { id: 'products', label: 'Product Analysis', icon: Package },
  { id: 'regions', label: 'Regional Analysis', icon: MapPin },
  { id: 'insights', label: 'Business Insights', icon: Lightbulb },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 flex-shrink-0">
            <BarChart3 size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold text-gray-900 tracking-tight">SalesIQ</span>
              <span className="text-[11px] text-gray-400 font-medium">Analytics Platform</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <div className="px-4 mb-3">
            {!collapsed && (
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Navigation
              </span>
            )}
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileOpen(false);
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className="hidden lg:block border-t border-gray-100 p-3">
          <button
            className="flex items-center justify-center w-full p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Spacer for main content */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-250 ease-in-out`}
        style={{ width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }}
      />
    </>
  );
}
