"use client";

import React, { useState } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { StockItem, JewelleryCategory } from "../../modules/inventory/types";
import { generateBarcodeForIndex, generateSkuForCategory } from "../../modules/inventory/store";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Trash2,
  Table,
} from "lucide-react";

export interface BulkStockImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (items: StockItem[]) => void;
  existingCount: number;
}

const SAMPLE_CSV_DATA = `Name,Category,Metal,Purity,GrossWeight,StoneWeight,OtherDeductions,WholesaleCost,MakingValue,TrayLocation,Supplier
18K Diamond Tennis Bracelet,Bangles & Kadas,gold,18K,14.500,1.200,0,165000,18,Tray #4 · Diamond Counter,Surat Diamond Craft
22K Antique Temple Choker,Necklaces & Sets,gold,22K,32.400,2.500,1.500,395000,16,Vault Safe #A,Jaipur Heritage Guild
22K Traditional Jhumka Earrings,Earrings & Jhumkas,gold,22K,8.750,0.500,0,105000,18,Tray #2 · Earrings,Zaveri Bullion Mumbai
18K Rose Gold Minimal Band,Rings,gold,18K,3.100,0,0,34000,20,Tray #1 · Rings,Surat Diamond Craft
925 Sterling Silver Pooja Thali,Silver Articles & Payal,silver,925,250.000,0,0,21000,30,Silver Showcase Section,Agra Silver Works`;

export const BulkStockImportModal: React.FC<BulkStockImportModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
  existingCount,
}) => {
  const [rawText, setRawText] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<StockItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsed, setIsParsed] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleParse = (textToParse: string) => {
    const text = textToParse.trim();
    if (!text) {
      setParseErrors(["Input text is empty. Please paste CSV or tabular data."]);
      setParsedRows([]);
      setIsParsed(false);
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      setParseErrors(["At least 1 header line and 1 data row required."]);
      return;
    }

    // Auto-detect delimiter: comma or tab
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : ",";
    const headers = firstLine.split(delimiter).map((h) => h.trim().toLowerCase());

    const items: StockItem[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim());
      if (parts.length < 5) continue;

      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = parts[idx] || "";
      });

      const name = rowObj["name"] || `Jewellery Piece #${i}`;
      const category = (rowObj["category"] || "Other") as JewelleryCategory;
      const metal = (rowObj["metal"]?.toLowerCase() === "silver" ? "silver" : "gold") as "gold" | "silver";
      const purity = (rowObj["purity"] || (metal === "gold" ? "22K" : "925")) as any;
      const gross = parseFloat(rowObj["grossweight"] || rowObj["gross"] || "0") || 0;
      const stone = parseFloat(rowObj["stoneweight"] || rowObj["stone"] || "0") || 0;
      const deductions = parseFloat(rowObj["otherdeductions"] || rowObj["deductions"] || "0") || 0;
      const cost = parseFloat(rowObj["wholesalecost"] || rowObj["cost"] || "0") || 0;
      const making = parseFloat(rowObj["makingvalue"] || rowObj["making"] || "18") || 18;
      const tray = rowObj["traylocation"] || rowObj["location"] || "Main Counter Tray";
      const supplier = rowObj["supplier"] || "Direct Consignment";

      if (gross <= 0) {
        errors.push(`Row ${i} (${name}): Gross weight must be greater than 0.`);
        continue;
      }

      const net = Math.max(0, gross - stone - deductions);
      const sku = generateSkuForCategory(category, purity, existingCount + i);
      const barcode = generateBarcodeForIndex(existingCount + i + 10);

      // Fine weight estimation (e.g. 75% for 18K, 91.6% for 22K, 92.5% for 925 silver)
      const purityFactor = purity.includes("24K") ? 1 : purity.includes("22K") ? 0.9167 : purity.includes("18K") ? 0.75 : purity.includes("14K") ? 0.585 : 0.925;
      const fine = Number((net * purityFactor).toFixed(3));

      items.push({
        id: `bulk-${Date.now()}-${i}`,
        sku,
        barcode,
        name,
        category,
        metal,
        purity,
        purityDisplay: `${purity}`,
        grossWeight: Number(gross.toFixed(3)),
        stoneWeight: Number(stone.toFixed(3)),
        otherDeductions: Number(deductions.toFixed(3)),
        netWeight: Number(net.toFixed(3)),
        fineWeight: fine,
        hsnCode: "7113",
        acquisitionCost: cost,
        defaultMakingType: "percentage",
        defaultMakingValue: making,
        trayLocation: tray,
        supplierName: supplier,
        status: "in_showcase",
        dateAdded: new Date().toISOString().split("T")[0],
      });
    }

    setParsedRows(items);
    setParseErrors(errors);
    setIsParsed(true);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_CSV_DATA);
    handleParse(SAMPLE_CSV_DATA);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onImportItems(parsedRows);
    onClose();
  };

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Excel / CSV Stock Ingestion"
      description="Import manufacturer spreadsheets or migrate existing inventory with automatic SKU, barcode, and Tunch fine weight generation."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Actions & Quick Load Sample */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-[#DFC488]" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Supported: Excel .CSV or Tab-Separated Clipboard Paste
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-[var(--text-secondary)] hover:text-white cursor-pointer transition-all">
              <Upload size={13} />
              <span>Upload CSV</span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C5A059]/15 hover:bg-[#C5A059]/25 border border-[#C5A059]/30 text-xs text-[#DFC488] font-medium transition-all"
            >
              <Sparkles size={13} />
              <span>Load 5 Sample Ornaments</span>
            </button>
          </div>
        </div>

        {/* Textarea Input */}
        <div>
          <textarea
            rows={5}
            placeholder="Paste CSV rows here (Name, Category, Metal, Purity, GrossWeight, StoneWeight, OtherDeductions, WholesaleCost, MakingValue, TrayLocation, Supplier)..."
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setIsParsed(false);
            }}
            className="w-full rounded-xl bg-black/30 border border-white/[0.08] p-3 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059]"
          />
          <div className="flex justify-between items-center pt-1.5 text-[11px] text-[var(--text-tertiary)]">
            <span>Columns required: Name, Category, Metal, Purity, GrossWeight</span>
            {!isParsed && rawText.trim() && (
              <GlassButton variant="secondary" size="sm" onClick={() => handleParse(rawText)}>
                Parse & Validate Data
              </GlassButton>
            )}
          </div>
        </div>

        {/* Errors Alert */}
        {parseErrors.length > 0 && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} /> Validation Warnings ({parseErrors.length})
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
              {parseErrors.slice(0, 3).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Parsed Items Preview Table */}
        {isParsed && parsedRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 size={14} /> {parsedRows.length} Pieces Verified for Ingestion
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Total Net Gold: {parsedRows.filter(p => p.metal === "gold").reduce((a, b) => a + b.netWeight, 0).toFixed(3)}g
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/40 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] bg-white/[0.02]">
                    <th className="py-2 px-3">Generated SKU</th>
                    <th className="py-2 px-3">Barcode</th>
                    <th className="py-2 px-3">Ornament</th>
                    <th className="py-2 px-3">Purity</th>
                    <th className="py-2 px-3 text-right">Gross Wt</th>
                    <th className="py-2 px-3 text-right">Net Wt</th>
                    <th className="py-2 px-3">Tray Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {parsedRows.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-3 font-mono font-semibold text-[var(--text-primary)]">
                        {item.sku}
                      </td>
                      <td className="py-2 px-3 font-mono text-[#DFC488] text-[11px]">
                        {item.barcode}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-[var(--text-primary)]">{item.name}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{item.category}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-[#DFC488]">
                          {item.purity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[var(--text-secondary)]">
                        {item.grossWeight.toFixed(3)}g
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                        {item.netWeight.toFixed(3)}g
                      </td>
                      <td className="py-2 px-3 text-[11px] text-[var(--text-tertiary)] truncate max-w-[120px]">
                        {item.trayLocation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <GlassButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0}
            icon={<CheckCircle2 size={14} />}
          >
            Import {parsedRows.length} Pieces to Inventory
          </GlassButton>
        </div>
      </div>
    </GlassDialog>
  );
};
