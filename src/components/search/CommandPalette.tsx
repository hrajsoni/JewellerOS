"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import {
  Search,
  ScanLine,
  Sparkles,
  Coins,
  Users,
  BookOpen,
  Hammer,
  Landmark,
  Calculator,
  Receipt,
  Package,
  ArrowRight,
  TrendingUp,
  Tag,
  Phone,
  Check,
  Plus,
  Compass,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { StockItem } from "../../modules/inventory/types";
import { Customer } from "../../modules/customers/types";
import { getSavedStock } from "../../modules/inventory/store";
import { getSavedCustomers } from "../../modules/customers/store";
import { formatINR, formatGrams } from "../../lib/formatters";

export interface CommandPaletteProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigateTab?: (href: string) => void;
  onOpenRatesModal?: () => void;
  onAddToPOS?: (stockItem: StockItem) => void;
  onSelectCustomer?: (customer: Customer) => void;
  stockItems?: StockItem[];
  customers?: Customer[];
  activeTenantId?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  onNavigateTab,
  onOpenRatesModal,
  onAddToPOS,
  onSelectCustomer,
  stockItems: propStockItems,
  customers: propCustomers,
  activeTenantId = "tenant-sandhya-jaipur",
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(open);
      } else {
        setInternalIsOpen(open);
      }
    },
    [isControlled, controlledOnOpenChange]
  );

  const [query, setQuery] = useState("");
  const [localStock, setLocalStock] = useState<StockItem[]>([]);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);

  // Refresh or initialize data when opened
  useEffect(() => {
    if (isOpen) {
      if (!propStockItems || propStockItems.length === 0) {
        try {
          const loaded = getSavedStock(activeTenantId);
          setLocalStock(loaded);
        } catch {
          setLocalStock([]);
        }
      }
      if (!propCustomers || propCustomers.length === 0) {
        try {
          const loaded = getSavedCustomers();
          setLocalCustomers(loaded);
        } catch {
          setLocalCustomers([]);
        }
      }
    }
  }, [isOpen, propStockItems, propCustomers, activeTenantId]);

  const allStock = propStockItems && propStockItems.length > 0 ? propStockItems : localStock;
  const allCustomers = propCustomers && propCustomers.length > 0 ? propCustomers : localCustomers;

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen, setIsOpen]);

  // Fast filtered stock items
  const filteredStock = useMemo(() => {
    if (!query.trim()) return allStock.slice(0, 5);
    const q = query.trim().toLowerCase();
    return allStock
      .filter((item) => {
        const barcodeMatch = item.barcode.toLowerCase() === q;
        const skuMatch = item.sku.toLowerCase().includes(q);
        const titleMatch = item.name.toLowerCase().includes(q);
        const categoryMatch = (item.category || "").toLowerCase().includes(q);
        const huidMatch = (item.huid || "").toLowerCase() === q;
        return barcodeMatch || skuMatch || titleMatch || categoryMatch || huidMatch;
      })
      .slice(0, 8);
  }, [allStock, query]);

  // Fast filtered customers
  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return allCustomers.slice(0, 4);
    const q = query.trim().toLowerCase();
    const cleanDigits = q.replace(/\D/g, "");
    return allCustomers
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q);
        const phoneMatch = cleanDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(cleanDigits);
        const cityMatch = (c.city || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || cityMatch;
      })
      .slice(0, 6);
  }, [allCustomers, query]);

  const handleSelectQuickLink = (href: string) => {
    setIsOpen(false);
    onNavigateTab?.(href);
  };

  const handleOpenRates = () => {
    setIsOpen(false);
    if (onOpenRatesModal) {
      onOpenRatesModal();
    } else {
      onNavigateTab?.("/calculator");
    }
  };

  const handleStockAction = (item: StockItem) => {
    setIsOpen(false);
    if (onAddToPOS) {
      onAddToPOS(item);
    }
    onNavigateTab?.("/invoices");
  };

  const handleCustomerAction = (customer: Customer) => {
    setIsOpen(false);
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    onNavigateTab?.("/customers");
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 sm:px-6 bg-black/70 backdrop-blur-md animate-in fade-in-0 duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#0C0D12] border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col backdrop-blur-2xl text-[var(--text-primary)]">
        <Command
          label="JewelleryOS Command Palette"
          shouldFilter={false}
          className="flex flex-col w-full"
        >
          {/* Header Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3 bg-white/[0.02]">
            <Search className="w-4 h-4 text-[#DFC488] shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search stock by barcode/SKU, lookup customers, or jump to..."
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-zinc-500 outline-none border-none font-medium"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[11px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-white/[0.06] transition-colors"
              >
                Clear
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-white/[0.06] border border-white/[0.08]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-white/[0.03]">
            {filteredStock.length === 0 &&
              filteredCustomers.length === 0 &&
              query.trim() !== "" && (
                <Command.Empty className="py-12 text-center text-xs text-zinc-400 space-y-1">
                  <Package className="w-8 h-8 text-zinc-600 mx-auto stroke-1" />
                  <p className="font-medium text-zinc-300">No matching stock items or customers</p>
                  <p className="text-[11px] text-zinc-500">
                    Try searching by 10-digit barcode, HUID, product SKU, or phone number
                  </p>
                </Command.Empty>
              )}

            {/* Quick sarafa navigation links */}
            <Command.Group
              heading="Sarafa Quick Actions & Ledgers"
              className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                <Command.Item
                  value="live metal rates sarafa board gold silver"
                  onSelect={handleOpenRates}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-200 cursor-pointer hover:bg-[#C5A059]/15 hover:text-[#DFC488] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-[#C5A059]/10 text-[#DFC488] group-hover:bg-[#C5A059]/25">
                    <TrendingUp size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Live Metal Rates</div>
                    <div className="text-[10px] text-zinc-500">Sarafa Daily Board & Pricing</div>
                  </div>
                </Command.Item>

                <Command.Item
                  value="day book roznamcha daily cash closing accounts"
                  onSelect={() => handleSelectQuickLink("/accounts")}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-200 cursor-pointer hover:bg-[#C5A059]/15 hover:text-[#DFC488] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                    <BookOpen size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Day Book (Roznamcha)</div>
                    <div className="text-[10px] text-zinc-500">Daily Cash Closing & Ledgers</div>
                  </div>
                </Command.Item>

                <Command.Item
                  value="karigar ledger labour issue receive ghadai"
                  onSelect={() => handleSelectQuickLink("/karigar")}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-200 cursor-pointer hover:bg-[#C5A059]/15 hover:text-[#DFC488] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                    <Hammer size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Karigar Ledger</div>
                    <div className="text-[10px] text-zinc-500">Artisan Metal Accounts & Job Cards</div>
                  </div>
                </Command.Item>

                <Command.Item
                  value="girvi loans gold pledge pawn brokering omunim"
                  onSelect={() => handleSelectQuickLink("/girvi")}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-200 cursor-pointer hover:bg-[#C5A059]/15 hover:text-[#DFC488] transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                    <Landmark size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Girvi Loans</div>
                    <div className="text-[10px] text-zinc-500">Pawn Brokering & Interest</div>
                  </div>
                </Command.Item>
              </div>
            </Command.Group>

            {/* Stock Ornaments Scan & POS Trigger */}
            {filteredStock.length > 0 && (
              <Command.Group
                heading="Stock Ornaments (Press Enter to Add to POS)"
                className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
              >
                <div className="space-y-1 mt-1">
                  {filteredStock.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.name} ${item.barcode} ${item.sku} ${item.category} ${item.purity}`}
                      onSelect={() => handleStockAction(item)}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs text-zinc-200 cursor-pointer hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-white/[0.05] text-[#DFC488] shrink-0">
                          <Tag size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/10 text-[#DFC488] font-mono">
                              {item.purity}
                            </span>
                            {item.status && item.status !== "in_showcase" && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.08] text-zinc-400 uppercase">
                                {item.status.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-3 font-mono mt-0.5">
                            <span>SKU: {item.sku}</span>
                            <span>•</span>
                            <span>Barcode: {item.barcode}</span>
                            {item.huid && (
                              <>
                                <span>•</span>
                                <span>HUID: {item.huid}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div className="font-mono text-white text-xs font-semibold">
                            {formatGrams(item.netWeight)}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Gross: {formatGrams(item.grossWeight)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C5A059]/15 text-[#DFC488] text-[10px] font-semibold group-hover:bg-[#C5A059] group-hover:text-black transition-colors"
                        >
                          <Plus size={10} />
                          <span>POS</span>
                        </button>
                      </div>
                    </Command.Item>
                  ))}
                </div>
              </Command.Group>
            )}

            {/* Customers Lookup */}
            {filteredCustomers.length > 0 && (
              <Command.Group
                heading="Customers (Search by Phone / Name)"
                className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
              >
                <div className="space-y-1 mt-1">
                  {filteredCustomers.map((c) => (
                    <Command.Item
                      key={c.id}
                      value={`${c.name} ${c.phone} ${c.city}`}
                      onSelect={() => handleCustomerAction(c)}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs text-zinc-200 cursor-pointer hover:bg-white/[0.04] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                          <Users size={13} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate flex items-center gap-2">
                            <span>{c.name}</span>
                            {c.customerType && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-white/[0.08] text-zinc-400">
                                {c.customerType}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                            <Phone size={10} className="text-zinc-500" />
                            <span>{c.phone}</span>
                            {c.city && <span>· {c.city}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {c.outstandingCredit && c.outstandingCredit > 0 ? (
                          <div className="text-rose-400 text-[11px] font-mono font-medium">
                            Due: {formatINR(c.outstandingCredit)}
                          </div>
                        ) : (
                          <div className="text-zinc-500 text-[10px]">Settled</div>
                        )}
                        <div className="text-[10px] text-zinc-500">
                          {c.totalInvoicesCount || 0} Bills
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </div>
              </Command.Group>
            )}
          </Command.List>

          {/* Footer Bar with Keyboard Shortcuts */}
          <div className="px-4 py-2.5 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[9px] text-zinc-300">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[9px] text-zinc-300">
                  ↵
                </kbd>
                Select / Add to POS
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] font-mono text-[9px] text-zinc-300">
                  esc
                </kbd>
                Close
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
              <ScanLine size={12} className="text-[#DFC488]" />
              <span>Barcode Ready</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};
