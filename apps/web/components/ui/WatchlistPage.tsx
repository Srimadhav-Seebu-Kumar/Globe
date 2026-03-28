"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WatchlistCard, type WatchlistCardItem } from "./WatchlistCard";
import { EmptyState } from "./EmptyState";
import { Button } from "./Button";

interface WatchlistGroup {
  id: string;
  name: string;
  type: "parcel" | "market" | "search" | "polygon";
  items: WatchlistCardItem[];
}

interface WatchlistPageProps {
  groups?: WatchlistGroup[] | undefined;
  loading?: boolean | undefined;
  onRemoveItem?: ((itemId: string) => void) | undefined;
  onSetAlert?: ((itemId: string) => void) | undefined;
  onCreateList?: (() => void) | undefined;
  onExport?: (() => void) | undefined;
}

const GroupTypeIcon = ({ type }: { type: WatchlistGroup["type"] }) => {
  switch (type) {
    case "market":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" />
          <ellipse cx="6" cy="6" rx="1.8" ry="4.5" />
          <line x1="1.5" y1="6" x2="10.5" y2="6" />
        </svg>
      );
    case "parcel":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <rect x="1.5" y="1.5" width="9" height="9" rx="1" />
          <line x1="1.5" y1="5.5" x2="10.5" y2="5.5" />
          <line x1="6" y1="5.5" x2="6" y2="10.5" />
        </svg>
      );
    case "search":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <circle cx="5.5" cy="5.5" r="3.5" />
          <line x1="8.5" y1="8.5" x2="10.5" y2="10.5" />
        </svg>
      );
    case "polygon":
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <polygon points="6,1.5 10.5,4.5 9,9.5 3,9.5 1.5,4.5" />
        </svg>
      );
  }
};

const ExportIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6.5 2v6M4 5 6.5 2 9 5" />
    <path d="M2 9v2.5h9V9" />
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <line x1="6.5" y1="2" x2="6.5" y2="11" />
    <line x1="2" y1="6.5" x2="11" y2="6.5" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"
    style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}>
    <polyline points="4,2 8,6 4,10" />
  </svg>
);

function WatchlistSidebarItem({
  group,
  selected,
  onSelect
}: {
  group: WatchlistGroup;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={[
        "w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-left transition-colors",
        selected
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      ].join(" ")}
      aria-current={selected}
    >
      <span className="shrink-0 text-[var(--text-tertiary)]"><GroupTypeIcon type={group.type} /></span>
      <span className="flex-1 text-[12px] font-medium truncate">{group.name}</span>
      <span className={[
        "shrink-0 text-[10px] font-semibold tabular-nums rounded-full w-5 h-5 flex items-center justify-center",
        selected
          ? "bg-[rgba(59,130,246,0.2)] text-[var(--accent-blue)]"
          : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)]"
      ].join(" ")}>
        {group.items.length}
      </span>
    </button>
  );
}

function SectionHeader({ type, count }: { type: WatchlistGroup["type"]; count: number }) {
  const labels: Record<WatchlistGroup["type"], string> = {
    parcel: "Parcels",
    market: "Markets",
    search: "Searches",
    polygon: "Polygons"
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest">
        {labels[type]}
      </span>
      <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">({count})</span>
    </div>
  );
}

export function WatchlistPage({
  groups = [],
  loading = false,
  onRemoveItem,
  onSetAlert,
  onCreateList,
  onExport
}: WatchlistPageProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    groups.length > 0 ? (groups[0]?.id ?? null) : null
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  const groupedByType: Partial<Record<WatchlistGroup["type"], WatchlistGroup[]>> = {};
  for (const g of groups) {
    if (!groupedByType[g.type]) groupedByType[g.type] = [];
    groupedByType[g.type]!.push(g);
  }
  const typeOrder: WatchlistGroup["type"][] = ["parcel", "market", "search", "polygon"];

  function toggleSection(type: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  if (!loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          title="Nothing saved yet"
          description="Watch markets and parcels from the map or parcel dossier to track them here."
          action={onCreateList ? { label: "Create a watchlist", onClick: onCreateList } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-52 shrink-0 border-r border-[var(--border-subtle)] flex flex-col overflow-hidden">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <span className="text-[12px] font-semibold text-[var(--text-primary)]">
            Watchlists
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums">{totalItems}</span>
        </div>

        {/* Grouped nav */}
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-0.5">
          {typeOrder.map((type) => {
            const typeGroups = groupedByType[type];
            if (!typeGroups?.length) return null;
            const isCollapsed = collapsedGroups.has(type);
            return (
              <div key={type} className="flex flex-col">
                <button
                  onClick={() => toggleSection(type)}
                  className="flex items-center gap-1.5 px-3 py-1 w-full hover:bg-[var(--bg-elevated)] transition-colors"
                  aria-expanded={!isCollapsed}
                >
                  <span className="text-[var(--text-tertiary)]"><ChevronIcon open={!isCollapsed} /></span>
                  <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-widest flex-1 text-left">
                    {type === "parcel" ? "Parcels" : type === "market" ? "Markets" : type === "search" ? "Searches" : "Polygons"}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">{typeGroups.reduce((s, g) => s + g.items.length, 0)}</span>
                </button>
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5 px-2 pb-1">
                    {typeGroups.map((g) => (
                      <WatchlistSidebarItem
                        key={g.id}
                        group={g}
                        selected={g.id === selectedGroupId}
                        onSelect={() => {
                          setSelectedGroupId(g.id);
                          setSelectedItemId(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Create list button */}
        {onCreateList && (
          <div className="p-3 border-t border-[var(--border-subtle)] shrink-0">
            <Button variant="ghost" size="sm" icon={<PlusIcon />} onClick={onCreateList} fullWidth>
              New List
            </Button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            {selectedGroup && (
              <>
                <span className="text-[var(--text-tertiary)]"><GroupTypeIcon type={selectedGroup.type} /></span>
                <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">{selectedGroup.name}</h2>
                <span className="text-[12px] text-[var(--text-tertiary)]">
                  {selectedGroup.items.length} item{selectedGroup.items.length !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          {onExport && selectedGroup && selectedGroup.items.length > 0 && (
            <Button variant="outline" size="sm" icon={<ExportIcon />} onClick={onExport}>
              Export
            </Button>
          )}
        </div>

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-[var(--radius-lg)] skeleton" />
              ))}
            </div>
          ) : selectedGroup && selectedGroup.items.length > 0 ? (
            <motion.div
              key={selectedGroup.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {selectedGroup.items.map((item) => (
                  <WatchlistCard
                    key={item.id}
                    item={item}
                    selected={item.id === selectedItemId}
                    onSelect={() => setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                    onRemove={onRemoveItem}
                    onSetAlert={onSetAlert}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : selectedGroup ? (
            <div className="flex items-center justify-center h-48">
              <EmptyState
                title="This list is empty"
                description="Add items from the map to track them here."
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
