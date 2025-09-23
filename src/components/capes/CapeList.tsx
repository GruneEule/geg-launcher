"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useInView } from "react-intersection-observer";
import type { CosmeticCape } from "../../types/noriskCapes";
import type { VanillaCape } from "../../types/vanillaCapes";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "@iconify/react";
import { CapeImage } from "./CapeImage";
import { VanillaCapeImage } from "./VanillaCapeImage";
import { getPlayerProfileByUuidOrName, getCapesByHashes } from "../../services/cape-service";
// Removed VirtuosoGrid import - using native scrolling instead
import { useThemeStore } from "../../store/useThemeStore";
import { cn } from "../../lib/utils";
import { Button } from "../ui/buttons/Button";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { SkinView3DWrapper } from "../common/SkinView3DWrapper";
import { useMinecraftAuthStore } from "../../store/minecraft-auth-store";
import gsap from "gsap";
import { IconButton } from "../ui/buttons/IconButton";
import { useCapeFavoritesStore } from "../../store/useCapeFavoritesStore";
import { useGlobalModal } from "../../hooks/useGlobalModal";


// Removed ListComponent - using native grid layout instead

interface CapeItemDisplayProps {
  cape: CosmeticCape | VanillaCape;
  imageUrl: string;
  isCurrentlyEquipping: boolean;
  onEquipCape: (capeId: string) => void;
  canDelete?: boolean;
  onDeleteCapeClick?: (cape: CosmeticCape | VanillaCape, e: React.MouseEvent) => void;
  creatorNameCache: Map<string, string>;
  onContextMenu?: (e: React.MouseEvent) => void;
  activeAccount?: any;
  showModal?: (id: string, component: ReactNode) => void;
  hideModal?: (id: string) => void;
  isVanilla?: boolean;
}

function CapeItemDisplay({
  cape,
  imageUrl,
  isCurrentlyEquipping,
  onEquipCape,
  canDelete,
  onDeleteCapeClick,
  creatorNameCache,
  onContextMenu,
  activeAccount,
  showModal,
  hideModal,
  isVanilla = false,
}: CapeItemDisplayProps) {
  const handleCapeClick = useCallback(() => {
    if (isCurrentlyEquipping || !showModal) return;

    const userSkinUrl = activeAccount?.id
      ? `https://crafatar.com/skins/${activeAccount.id}`
      : undefined;

    const capeId = isVanilla ? (cape as VanillaCape).id : (cape as CosmeticCape)._id;
    const capeUrl = isVanilla ? (cape as VanillaCape).url : `https://cdn.norisk.gg/capes/prod/${capeId}.png`;

    showModal(`cape-preview-${capeId}`, (
      <Modal
        title="Cape Preview"
        onClose={() => hideModal && hideModal(`cape-preview-${capeId}`)}
        width="md"
        variant="flat"
      >
        <Cape3DPreviewWithToggle
          skinUrl={userSkinUrl}
          capeUrl={isVanilla ? capeUrl : undefined}
          capeId={capeId}
          isEquipped={false}
          onEquipCape={() => {
            onEquipCape(capeId);
            hideModal && hideModal(`cape-preview-${capeId}`);
          }}
        />
      </Modal>
    ));
  }, [cape, isCurrentlyEquipping, activeAccount, showModal, hideModal, onEquipCape, isVanilla]);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [creatorLoading, setCreatorLoading] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState(false);
  const accentColor = useThemeStore((state) => state.accentColor);

  // Only use favorites for NoRisk capes
  const isFavorite = !isVanilla ? useCapeFavoritesStore((s) => s.isFavorite((cape as CosmeticCape)._id)) : false;
  const toggleFavoriteOptimistic = useCapeFavoritesStore((s) => s.toggleFavoriteOptimistic);

  useEffect(() => {
    if (isVanilla) return; // Vanilla capes don't have creators

    let isMounted = true;
    const cosmeticCape = cape as CosmeticCape;
    if (cosmeticCape.firstSeen) {
      if (creatorNameCache.has(cosmeticCape.firstSeen)) {
        setCreatorName(creatorNameCache.get(cosmeticCape.firstSeen)!);
        setCreatorLoading(false);
        return;
      }

      setCreatorLoading(true);
      getPlayerProfileByUuidOrName(cosmeticCape.firstSeen)
        .then((profile) => {
          if (isMounted) {
            const nameToCache =
              profile && profile.name ? profile.name : "Unknown";
            setCreatorName(nameToCache);
            creatorNameCache.set(cosmeticCape.firstSeen, nameToCache);
          }
        })
        .catch(() => {
          if (isMounted) {
            const errorNameToCache = "Error";
            setCreatorName(errorNameToCache);
            creatorNameCache.set(cosmeticCape.firstSeen, errorNameToCache);
          }
        })
        .finally(() => {
          if (isMounted) {
            setCreatorLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [cape, creatorNameCache, isVanilla]);

  // Use consistent dimensions like original CapeDisplay
  const displayWidth = 140;
  const displayHeight = Math.round(displayWidth * (16 / 10)); // 16:10 aspect ratio for capes

  // Grid layout (similar to ProfileCardV2 grid mode)
  return (
    <div
      className="relative flex flex-col gap-3 p-4 rounded-lg bg-black/20 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.preventDefault();
        handleCapeClick();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        handleCapeClick();
      }}
    >
      {/* Action buttons - top right */}
      <div className={`absolute top-3 right-3 z-20 flex flex-col gap-1`}>
        {/* Favorite button (only for NoRisk capes) */}
        {!isVanilla && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavoriteOptimistic((cape as CosmeticCape)._id);
            }}
            className="w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all duration-200"
            title={isFavorite ? "Unfavorite" : "Favorite"}
            disabled={isCurrentlyEquipping}
          >
            <Icon
              icon={isFavorite ? "ph:heart-fill" : "ph:heart"}
              className="w-4 h-4"
              style={{ color: isFavorite ? "#ef4444" : undefined }}
            />
          </button>
        )}

        {/* Delete button (only if canDelete and not vanilla) */}
        {canDelete && onDeleteCapeClick && !isVanilla && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteCapeClick(cape as CosmeticCape, e);
            }}
            className="w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-red-700/80 text-white/70 hover:text-white border border-white/10 hover:border-white/20 rounded transition-all duration-200"
            title="Delete Cape"
            disabled={isCurrentlyEquipping}
          >
            <Icon
              icon="solar:close-circle-bold"
              className="w-4 h-4"
            />
          </button>
        )}
      </div>

      {/* Cape content */}
      <div className="flex flex-col items-center gap-3 relative z-10 w-full">
        {/* Cape Image */}
        <div
          className="relative flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden border-2 transition-all duration-300 ease-out"
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            backgroundColor: isHovered ? `${accentColor.value}20` : 'transparent',
            borderColor: isHovered ? `${accentColor.value}60` : 'transparent',
          }}
        >
          {isVanilla ? (
            <VanillaCapeImage
              imageUrl={imageUrl}
              width={displayWidth}
              className="rounded-sm block"
            />
          ) : (
            <CapeImage
              imageUrl={imageUrl}
              part="front"
              width={displayWidth}
              className="rounded-sm block"
            />
          )}

          {/* Equipping overlay */}
          {isCurrentlyEquipping && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
              <Icon
                icon="solar:refresh-bold"
                className="w-8 h-8 animate-spin mb-1"
                style={{ color: accentColor.value }}
              />
              <span className="font-minecraft text-xs text-white lowercase">
                Equipping
              </span>
            </div>
          )}

        </div>

        {/* Cape Info */}
        <div className="flex-grow min-w-0 w-full text-center">
          {/* Creator Name or Cape Name */}
          <h3
            className="font-minecraft-ten text-white text-base whitespace-nowrap overflow-hidden text-ellipsis max-w-full normal-case mb-1"
            title={
              isVanilla
                ? (cape as VanillaCape).name
                : creatorName || (cape as CosmeticCape).firstSeen
            }
          >
            {isVanilla
              ? (cape as VanillaCape).name
              : creatorLoading
                ? "Loading..."
                : creatorName || "Unknown"
            }
          </h3>

          {/* Usage Stats (only for NoRisk capes) */}
          {!isVanilla && (
            <div className="flex items-center justify-center gap-2 text-xs font-minecraft-ten">
              <div className="text-white/60 flex items-center gap-1">
                <Icon
                  icon="solar:download-minimalistic-outline"
                  className="w-3 h-3 text-white/50"
                />
                <span>{(cape as CosmeticCape).uses.toLocaleString()} uses</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export interface CapeListProps {
  capes: CosmeticCape[] | VanillaCape[];
  onEquipCape: (capeHash: string) => void;
  isLoading?: boolean;
  isEquippingCapeId?: string | null;
  searchQuery?: string;
  canDelete?: boolean;
  onDeleteCape?: (cape: CosmeticCape) => void;
  loadMoreItems?: () => void;
  hasMoreItems?: boolean;
  isFetchingMore?: boolean;
  onTriggerUpload?: () => void;
  onDownloadTemplate?: () => void;
  groupFavoritesInHeader?: boolean;
  showFavoritesOnly?: boolean;
  isVanilla?: boolean;
}

export function CapeList({
  capes,
  onEquipCape,
  isLoading = false,
  isEquippingCapeId = null,
  searchQuery = "",
  canDelete = false,
  onDeleteCape,
  loadMoreItems,
  hasMoreItems = false,
  isFetchingMore = false,
  onTriggerUpload,
  onDownloadTemplate,
  groupFavoritesInHeader = true,
  showFavoritesOnly = false,
  isVanilla = false,
}: CapeListProps) {
  const accentColor = useThemeStore((state) => state.accentColor);
  const creatorNameCacheRef = useRef<Map<string, string>>(new Map());
  const { showModal, hideModal } = useGlobalModal();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    cape: CosmeticCape | null;
  } | null>(null);
  const authStore = useMinecraftAuthStore();
  const activeAccount = authStore.activeAccount;

  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const favoriteCapeIds = useCapeFavoritesStore((s) => s.favoriteCapeIds);
  const [favoriteCapesFetched, setFavoriteCapesFetched] = useState<Map<string, CosmeticCape>>(new Map());

  const favoriteCapes = useMemo(() => {
    if (isVanilla) return []; // Vanilla capes don't have favorites

    // Simple approach: Filter available capes that are marked as favorites
    const result = (capes as CosmeticCape[]).filter(cape => favoriteCapeIds.includes(cape._id));

    // Also include any fetched favorites that aren't in the main capes list
    const fetchedFavorites = Array.from(favoriteCapesFetched.values()).filter(
      cape => !capes.some(c => (c as CosmeticCape)._id === cape._id)
    );

    const finalResult = [...result, ...fetchedFavorites];
    return finalResult;
  }, [favoriteCapeIds, favoriteCapesFetched, capes, isVanilla]); // Keep capes dependency but optimize the calculation


  const missingFavoriteIds = useMemo(() => {
    // Always fetch missing favorites, regardless of groupFavoritesInHeader
    // Don't include placeholders in the check
    const presentIds = new Set(capes.map((c) => c._id));
    const fetchedIds = new Set(favoriteCapesFetched.keys());
    return favoriteCapeIds.filter((id) => !presentIds.has(id) && !fetchedIds.has(id));
  }, [favoriteCapeIds, capes, favoriteCapesFetched]);

  useEffect(() => {
    const idsToFetch = missingFavoriteIds.filter((id) => !favoriteCapesFetched.has(id));
    if (idsToFetch.length === 0) return;
    const chunk = idsToFetch.slice(0, 100);
    getCapesByHashes(chunk)
      .then((capes) => {
        setFavoriteCapesFetched((prev) => {
          const next = new Map(prev);
          capes.forEach((c) => next.set(c._id, c));
          return next;
        });
      })
      .catch((e) => {
        console.warn("[CapeList] Failed to fetch favorite capes by hashes:", e);
      });
  }, [missingFavoriteIds, favoriteCapesFetched]);

  // Separate state for stable favorites display - completely independent of capes loading
  const [stableFavoriteCapes, setStableFavoriteCapes] = useState<CosmeticCape[]>([]);

  // Update stable favorites only when favorite data actually changes, not when main capes change
  useEffect(() => {
    if (favoriteCapeIds.length === 0 || isVanilla) {
      setStableFavoriteCapes([]);
      return;
    }

    // Use favoriteCapes directly since it already contains the correct data from both sources
    // If we don't have all favorites yet, they will be fetched and added to favoriteCapesFetched
    const result: CosmeticCape[] = [];

    for (const id of favoriteCapeIds) {
      let cape = favoriteCapes.find(c => c._id === id);

      // If not in favoriteCapes but in fetched map, use that
      if (!cape) {
        cape = favoriteCapesFetched.get(id);
      }

      // If still not found, create placeholder (will be replaced when fetched)
      if (!cape) {
        cape = {
          _id: id,
          uses: 0,
          firstSeen: "",
          elytra: false,
        } as CosmeticCape;
      }

      result.push(cape);
    }

    setStableFavoriteCapes(result);
  }, [favoriteCapeIds, favoriteCapes, favoriteCapesFetched, isVanilla]); // Always update favorites


  // Track if we've ever loaded capes successfully (for EmptyState logic)
  useEffect(() => {
    if (!isLoading && !hasInitiallyLoaded) {
      // For favorites mode, only consider it loaded if we actually have capes available to filter from
      const hasContent = showFavoritesOnly
        ? capes.length > 0 // Only loaded if we have capes to filter favorites from
        : capes.length > 0;

      if (hasContent) {
        setHasInitiallyLoaded(true);
      }
    }
  }, [isLoading, capes.length, showFavoritesOnly, hasInitiallyLoaded]);

  // Reset hasInitiallyLoaded when switching tabs
  useEffect(() => {
    setHasInitiallyLoaded(false);
  }, [showFavoritesOnly]);

  // No loading spinner - capes appear immediately when available

  const itemsToRender = useMemo(() => {
    // If showing favorites only, return only favorites
    if (showFavoritesOnly) {
      return stableFavoriteCapes;
    }

    if (!groupFavoritesInHeader) return capes;
    // Since favorites are now rendered separately above Virtuoso, always filter them out
    if (stableFavoriteCapes.length === 0 || isVanilla) return capes;
    const favoriteIdsSet = new Set(stableFavoriteCapes.map(cape => cape._id));
    return (capes as CosmeticCape[]).filter((item) => !favoriteIdsSet.has(item._id));
  }, [capes, stableFavoriteCapes, groupFavoritesInHeader, showFavoritesOnly]);

// Removed virtuosoComponents - using native scrolling grid instead 

  function calculateMenuPosition(x: number, y: number, menuWidth: number, menuHeight: number) {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const padding = 16;
    let adjustedX = x;
    let adjustedY = y;
    if (x + menuWidth + padding > viewport.width) {
      adjustedX = x - menuWidth;
      if (adjustedX < padding) adjustedX = viewport.width - menuWidth - padding;
    }
    if (y + menuHeight + padding > viewport.height) {
      adjustedY = y - menuHeight;
      if (adjustedY < padding) adjustedY = viewport.height - menuHeight - padding;
    }
    adjustedX = Math.max(padding, Math.min(adjustedX, viewport.width - menuWidth - padding));
    adjustedY = Math.max(padding, Math.min(adjustedY, viewport.height - menuHeight - padding));
    return { x: adjustedX, y: adjustedY };
  }

  useEffect(() => {
    if (contextMenu) {
      const menuWidth = 200;
      const menuHeight = 56;
      setMenuPosition(calculateMenuPosition(contextMenu.x, contextMenu.y, menuWidth, menuHeight));
      window.addEventListener("click", () => setContextMenu(null));
      return () => window.removeEventListener("click", () => setContextMenu(null));
    }
  }, [contextMenu]);

  useEffect(() => {
    if (contextMenu && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, scale: 0.95, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power2.out" }
      );
    }
  }, [contextMenu]);

  const handleCapeContextMenu = useCallback(
    (cape: CosmeticCape, e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, cape });
    },
    []
  );

  const handleDeleteClickInternal = useCallback(
    (cape: CosmeticCape | VanillaCape, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDeleteCape && !isVanilla) {
        onDeleteCape(cape as CosmeticCape);
      }
    },
    [onDeleteCape, isVanilla],
  );

  const handlePreview3D = useCallback(() => {
    // Preview is now handled by direct click, this function is kept for potential future use
    setContextMenu(null);
  }, []);

  // No loading spinner - capes appear immediately when available


  const noActualCapesToDisplay = itemsToRender.length === 0;

  // For favorites, don't show loading state since favorites are filtered from available capes
  // Just show the filtered results immediately

  if (!isLoading && noActualCapesToDisplay && hasInitiallyLoaded) {
    return (
      <div className="flex-grow flex items-center justify-center p-5">
        <EmptyState
          icon="solar:hanger-wave-line-duotone"
          message={
            isVanilla
              ? searchQuery
                ? `No vanilla capes found for "${searchQuery}"`
                : "You don't own any vanilla Minecraft capes yet"
              : showFavoritesOnly
              ? "Mark some capes as favorites by clicking the heart icon!"
              : searchQuery
              ? `No capes found for "${searchQuery}"`
              : "No capes available"
          }
        />
      </div>
    );
  }

  // Load more trigger component for intersection observer
  const LoadMoreTrigger = () => {
    const { ref, inView } = useInView({
      threshold: 0,
      rootMargin: '500px', // Load more when 500px from bottom - even earlier!
    });

    useEffect(() => {
      if (inView && hasMoreItems && !isFetchingMore && loadMoreItems) {
        console.log("[CapeList] Load more trigger activated, loading more items...");
        loadMoreItems();
      }
    }, [inView, hasMoreItems, isFetchingMore, loadMoreItems]);

    if (!hasMoreItems) return null;

    return (
      <div ref={ref} className="flex justify-center items-center p-8">
        {isFetchingMore ? (
          <Icon
            icon="eos-icons:loading"
            className="w-8 h-8 animate-spin"
            style={{ color: accentColor.value }}
          />
        ) : (
          <div className="w-full h-4" /> // Invisible trigger area
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex-grow custom-scrollbar h-full",
        onTriggerUpload ? "" : "p-4",
      )}
    >
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Render favorites separately above native grid to prevent flickering */}
        {groupFavoritesInHeader && stableFavoriteCapes.length > 0 && !showFavoritesOnly && !isVanilla && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "16px",
              padding: "16px",
            }}
          >
            {stableFavoriteCapes.map((cape) => {
              const imageUrl = `https://cdn.norisk.gg/capes/prod/${cape._id}.png`;
              return (
                <CapeItemDisplay
                  key={`fav-${cape._id}`}
                  cape={cape}
                  imageUrl={imageUrl}
                  isCurrentlyEquipping={isEquippingCapeId === cape._id}
                  onEquipCape={onEquipCape}
                  canDelete={canDelete}
                  onDeleteCapeClick={handleDeleteClickInternal}
                  creatorNameCache={creatorNameCacheRef.current}
                  onContextMenu={(e) => handleCapeContextMenu(cape, e)}
                  activeAccount={activeAccount}
                  showModal={(id, component) => showModal(id, component)}
                  hideModal={(id) => hideModal(id)}
                  isVanilla={isVanilla}
                />
              );
            })}
          </div>
        )}

        {/* Native scrolling grid - similar to ScreenshotsTab */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
              gap: "16px",
              padding: "16px",
          }}
        >
          {itemsToRender.map((cape) => {
            const imageUrl = isVanilla
              ? (cape as VanillaCape).url
              : `https://cdn.norisk.gg/capes/prod/${(cape as CosmeticCape)._id}.png`;
            const capeId = isVanilla ? (cape as VanillaCape).id : (cape as CosmeticCape)._id;
            return (
              <CapeItemDisplay
                key={capeId}
                cape={cape}
                imageUrl={imageUrl}
                isCurrentlyEquipping={isEquippingCapeId === capeId}
                onEquipCape={onEquipCape}
                canDelete={canDelete && !isVanilla}
                onDeleteCapeClick={handleDeleteClickInternal}
                creatorNameCache={creatorNameCacheRef.current}
                onContextMenu={(e) => handleCapeContextMenu(cape, e)}
                activeAccount={activeAccount}
                showModal={(id, component) => showModal(id, component)}
                hideModal={(id) => hideModal(id)}
                isVanilla={isVanilla}
              />
            );
          })}

          {/* Load more trigger - only for non-favorites modes */}
          {!showFavoritesOnly && <LoadMoreTrigger />}
          </div>
        </div>
      </div>

      {contextMenu && contextMenu.cape && (
        <div
          ref={menuRef}
          className="fixed z-[9999] rounded-md shadow-xl border-2 border-b-4 overflow-hidden"
          style={{
            top: menuPosition.y,
            left: menuPosition.x,
            backgroundColor: accentColor.value + "20",
            borderColor: accentColor.value + "90",
            borderBottomColor: accentColor.value,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 8px 16px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)",
          }}
          onClick={e => e.stopPropagation()}
        >
          <span
            className="absolute inset-x-0 top-0 h-[2px] rounded-t-sm"
            style={{ backgroundColor: `${accentColor.value}80` }}
          />
          <ul className="py-1">
            <li
              className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 cursor-pointer transition-colors duration-150"
              onClick={handlePreview3D}
            >
              <Icon icon="ph:eye-bold" className="w-5 h-5 text-white" />
              <span className="font-minecraft-ten text-base text-white/80">
                Preview
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

function Cape3DPreviewWithToggle({
  skinUrl,
  capeUrl,
  capeId,
  onEquipCape,
  isEquipped = false
}: {
  skinUrl?: string;
  capeUrl?: string; // Optional - falls nicht übergeben, wird CDN URL verwendet
  capeId: string;
  onEquipCape: () => void;
  isEquipped?: boolean; // Optional - für Vanilla Capes relevant
}) {
  const [showElytra, setShowElytra] = useState(false);

  // Verwende capeUrl falls übergeben, sonst CDN URL
  const finalCapeUrl = capeUrl || `https://cdn.norisk.gg/capes/prod/${capeId}.png`;

  return (
    <div className="p-4">
      <div style={{ width: 300, height: 380, margin: "0 auto", position: "relative" }}>
        <IconButton
          onClick={() => setShowElytra((v) => !v)}
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10"
          icon={
            <Icon
              icon={showElytra ? "ph:airplane-tilt-fill" : "ph:airplane-tilt-duotone"}
              className="w-5 h-5"
            />
          }
          title={showElytra ? "Show as Cape" : "Show as Elytra"}
          aria-label={showElytra ? "Show as Cape" : "Show as Elytra"}
        />
        <SkinView3DWrapper
          skinUrl={skinUrl}
          capeUrl={finalCapeUrl}
          enableAutoRotate={true}
          autoRotateSpeed={0.5}
          startFromBack={true}
          zoom={0.9}
          displayAsElytra={showElytra}
          width={300}
          height={380}
        />
      </div>

      <div className="flex justify-center mt-4">
        <Button
          onClick={onEquipCape}
          variant="flat"
          size="lg"
          className="px-8"
        >
          {isEquipped ? 'UNEQUIP CAPE' : 'SELECT CAPE'}
        </Button>
      </div>
    </div>
  );
}

