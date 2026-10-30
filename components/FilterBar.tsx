'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';
import { Filters } from '@/lib/types';

interface FilterBarProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  categories: string[];
  regions: string[];
  dateMin: string;
  dateMax: string;
}

export default function FilterBar({
  filters,
  onFiltersChange,
  categories,
  regions,
  dateMin,
  dateMax,
}: FilterBarProps) {
  const [catDropdown, setCatDropdown] = useState(false);
  const [regDropdown, setRegDropdown] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const regRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatDropdown(false);
      if (regRef.current && !regRef.current.contains(e.target as Node)) setRegDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasActiveFilters =
    filters.dateRange.start !== dateMin ||
    filters.dateRange.end !== dateMax ||
    filters.categories.length > 0 ||
    filters.regions.length > 0;

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { start: dateMin, end: dateMax },
      categories: [],
      regions: [],
    });
  };

  const toggleCategory = (cat: string) => {
    const newCats = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ ...filters, categories: newCats });
  };

  const toggleRegion = (reg: string) => {
    const newRegs = filters.regions.includes(reg)
      ? filters.regions.filter(r => r !== reg)
      : [...filters.regions, reg];
    onFiltersChange({ ...filters, regions: newRegs });
  };

  return (
    <div className="card">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Filter size={16} />
            <span>Filters</span>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <input
              type="date"
              className="filter-input text-sm"
              value={filters.dateRange.start}
              min={dateMin}
              max={filters.dateRange.end || dateMax}
              onChange={e =>
                onFiltersChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, start: e.target.value },
                })
              }
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              className="filter-input text-sm"
              value={filters.dateRange.end}
              min={filters.dateRange.start || dateMin}
              max={dateMax}
              onChange={e =>
                onFiltersChange({
                  ...filters,
                  dateRange: { ...filters.dateRange, end: e.target.value },
                })
              }
            />
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Category Multi-select */}
          <div className="multi-select" ref={catRef}>
            <button
              className="filter-input text-sm flex items-center gap-2 cursor-pointer"
              onClick={() => setCatDropdown(!catDropdown)}
            >
              <span>
                {filters.categories.length === 0
                  ? 'All Categories'
                  : `${filters.categories.length} selected`}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {catDropdown && (
              <div className="multi-select-dropdown">
                {categories.map(cat => (
                  <label key={cat} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Region Multi-select */}
          <div className="multi-select" ref={regRef}>
            <button
              className="filter-input text-sm flex items-center gap-2 cursor-pointer"
              onClick={() => setRegDropdown(!regDropdown)}
            >
              <span>
                {filters.regions.length === 0
                  ? 'All Regions'
                  : `${filters.regions.length} selected`}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {regDropdown && (
              <div className="multi-select-dropdown">
                {regions.map(reg => (
                  <label key={reg} className="multi-select-option">
                    <input
                      type="checkbox"
                      checked={filters.regions.includes(reg)}
                      onChange={() => toggleRegion(reg)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{reg}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              className="btn-outline text-sm !py-1.5 !px-3"
              onClick={clearFilters}
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
