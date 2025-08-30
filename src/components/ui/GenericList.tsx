"use client";

import { Icon } from "@iconify/react";
import { EmptyState } from "./EmptyState";
import { ReactNode, useEffect } from "react";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { preloadIcons } from "../../lib/icon-utils";
import { Virtuoso } from 'react-virtuoso';

const GENERIC_LIST_DEFAULT_ICONS = [
  "solar:danger-triangle-bold",
  "solar:planet-bold"
];

interface GenericListItemSkeletonProps {
  accentColor: string;
}

function GenericListItemSkeleton({ accentColor }: GenericListItemSkeletonProps) {
  const baseIsDark = parseInt(accentColor.substring(1, 3), 16) < 128;
  const highlightColor = baseIsDark ? `${accentColor}99` : `${accentColor}4D`;

  return (
    <SkeletonTheme baseColor={`${accentColor}20`} highlightColor={highlightColor}>
      <li className="p-4 flex items-start gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <Skeleton height="100%" width="100%" style={{ borderRadius: '0px' }} />
        </div>
        <div className="flex-grow min-w-0 h-24 flex flex-col justify-center">
          <Skeleton width="70%" height={20} style={{ marginBottom: '0.5rem', borderRadius: '0px' }} />
          <Skeleton count={2} height={15} style={{ borderRadius: '0px' }} />
        </div>
      </li>
    </SkeletonTheme>
  );
}

interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  isLoading?: boolean;  loadingComponent?: ReactNode;
  loadingItemCount?: number;
  error?: string | null;
  errorComponent?: (error: string) => ReactNode;
  emptyStateIcon?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  emptyStateAction?: ReactNode;
  searchQuery?: string;  accentColor?: string;
  listContainerClassName?: string;
  listItemClassName?: string;
  ulClassName?: string;
  showEmptyState?: boolean;
}

export function GenericList<T>({
  items,
  renderItem,
  isLoading = false,
  loadingComponent,  loadingItemCount = 3,
  error = null,
  errorComponent,
  emptyStateIcon = GENERIC_LIST_DEFAULT_ICONS[1],
  emptyStateMessage = "no items match your search",
  emptyStateDescription = "Try adjusting your search or filters.",
  emptyStateAction,
  searchQuery = "",
  accentColor = "#FFFFFF",
  listContainerClassName = "",
  ulClassName = "space-y-2",
  showEmptyState = true,
}: GenericListProps<T>) {
  const effectiveAccentColor = accentColor || "#FFFFFF";

  useEffect(() => {
    preloadIcons(GENERIC_LIST_DEFAULT_ICONS);
  }, []);

  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }    if (loadingItemCount && loadingItemCount > 0) {
      return (
        <div
          className={`${listContainerClassName}`}
        >
          <ul className={ulClassName}>
            {Array.from({ length: loadingItemCount }).map((_, index) => (
              <GenericListItemSkeleton key={`skeleton-${index}`} accentColor={effectiveAccentColor} />
            ))}
          </ul>
        </div>
      );    } else if (items.length === 0) {
      return (
        <EmptyState
          icon={emptyStateIcon}
          message={emptyStateMessage}
          description={emptyStateDescription}
        />
      );
    }
  }  if (error && errorComponent) {
    return <>{errorComponent(error)}</>;
  }
  if (error) {
    return (
      <div
        className="p-3 flex items-center gap-2 mb-4 rounded-lg border"
        style={{
          backgroundColor: `rgba(220, 38, 38, 0.1)`,
          borderColor: `rgba(220, 38, 38, 0.3)`,
        }}
      >        <Icon
          icon={GENERIC_LIST_DEFAULT_ICONS[0]}
          className="w-5 h-5 text-red-400"
        />
        <span className="text-white font-minecraft text-lg">{error}</span>
      </div>
    );
  }
  
  const isEmpty = items.length === 0;

  if (showEmptyState && isEmpty && !isLoading) {
    return (
      <EmptyState
        icon={emptyStateIcon}
        message={searchQuery ? emptyStateMessage : "no items found"}
        description={searchQuery ? "Try a different search term." : emptyStateDescription}
        action={emptyStateAction}
      />
    );
  }
  if (isEmpty && !isLoading && !error && !showEmptyState) {
     return null; // Return nothing for empty state without background
  }
  if (!isEmpty) {
    return (
        <div
        className={`${listContainerClassName}`}
        >
        <ul className={ulClassName}>
          {items.map((item, index) => (
            <li key={index}>
              {renderItem(item, index)}
            </li>
          ))}
        </ul>
        </div>
    );
  }
  return null;
}