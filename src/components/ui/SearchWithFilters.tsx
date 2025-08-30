"use client";

import { Icon } from "@iconify/react";
import { StableIcon } from "./IconWrapper";
import { CustomDropdown } from "./CustomDropdown";
import type { DropdownOption } from "./CustomDropdown";

export interface SearchWithFiltersProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Current search value */
  searchValue?: string;
  /** Callback when search value changes */
  onSearchChange?: (value: string) => void;
  /** Sort options for the sort dropdown */
  sortOptions?: DropdownOption[];
  /** Current sort value */
  sortValue?: string;
  /** Callback when sort value changes */
  onSortChange?: (value: string) => void;
  /** Filter options for the filter dropdown */
  filterOptions?: DropdownOption[];
  /** Current filter value */
  filterValue?: string;
  /** Callback when filter value changes */
  onFilterChange?: (value: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Optional icon for the search input */
  searchIcon?: string;
  /** Whether to show the sort dropdown */
  showSort?: boolean;
  /** Whether to show the filter dropdown */
  showFilter?: boolean;
}

export function SearchWithFilters({
  placeholder = "Search...",
  searchValue = "",
  onSearchChange,
  sortOptions = [],
  sortValue = "",
  onSortChange,
  filterOptions = [],
  filterValue = "",
  onFilterChange,
  className = "",
  searchIcon = "solar:magnifer-bold",
  showSort = true,
  showFilter = true,
}: SearchWithFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Search with integrated filters */}
      <div className="flex items-center gap-2 bg-black/50 rounded-lg px-4 py-3 border border-white/10 hover:border-white/20 transition-colors flex-1 max-w-md">
        <StableIcon icon={searchIcon} className="w-4 h-4 text-white/50" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={handleSearchChange}
          className="bg-transparent text-white placeholder-white/50 font-minecraft-ten text-sm flex-1 outline-none"
        />
        
        {/* Sort Filter */}
        {showSort && sortOptions.length > 0 && (
          <>
            {/* Separator */}
            <div className="h-4 w-px bg-white/20 mx-2"></div>
            
            {/* Sort Filter Button */}
            <div className="relative">
              <CustomDropdown
                label=""
                value={sortValue}
                onChange={onSortChange}
                options={sortOptions}
                className="w-auto"
              />
            </div>
          </>
        )}
        
        {/* Version/Filter */}
        {showFilter && filterOptions.length > 0 && (
          <>
            {/* Separator */}
            <div className="h-4 w-px bg-white/20 mx-2"></div>
            
            {/* Filter Button */}
            <div className="relative">
              <CustomDropdown
                label=""
                value={filterValue}
                onChange={onFilterChange}
                options={filterOptions}
                className="w-auto"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
