"use client";

import React, { useRef } from "react";
import { StockItem } from "../../modules/inventory/types";
import { generateBarcodeSvg } from "../../lib/barcode";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { Printer, Sparkles, X, Check, Tag } from "lucide-react";

export interface JewelleryBarcodeTagProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  shopName?: string;
}

export const JewelleryBarcodeTag: React.FC<JewelleryBarcodeTagProps> = ({
  item,
  isOpen,
  onClose,
  shopName = "Sandhya Jewellers",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !item) return null;

  const barcodeData = generateBarcodeSvg(item.barcode || item.sku, {
    height: 38,
    moduleWidth: 1.5,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Print Jewellery Barcode Tag"
      description="Thermal jewelry label tag format (Rat-tail / Dumbbell 50mm x 15mm standard). Ready for TSC, Zebra, and Citizen tag printers."
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Printable Jewellery Tag Container */}
        <div className="flex justify-center p-6 bg-black/40 rounded-2xl border border-white/[0.06]">
          <div
            ref={printRef}
            id="jewellery-printable-tag"
            className="jewellery-tag-sheet bg-white text-black p-3.5 rounded-lg shadow-2xl border border-gray-300 w-[360px] flex items-center justify-between gap-3 font-sans select-none"
          >
            {/* Left Section (Flap A) */}
            <div className="flex-1 space-y-0.5 text-left pr-2 border-r border-dashed border-gray-400">
              <div className="text-[11px] font-black uppercase tracking-tight text-[#08090C] truncate">
                {shopName}
              </div>
              <div className="font-mono font-bold text-xs text-black">
                {item.sku}
              </div>
              <div className="text-[9px] font-bold text-gray-800">
                Purity: <span className="bg-black text-white px-1 py-0.2 rounded font-mono">{item.purityDisplay || item.purity}</span>
              </div>
              <div className="text-[8px] text-gray-600 font-mono">
                HSN: {item.hsnCode || "7113"}
              </div>
            </div>

            {/* Middle Section (Rat-Tail Loop Bridge representation) */}
            <div className="w-4 flex flex-col items-center justify-center">
              <div className="w-1.5 h-10 rounded-full bg-gray-200 border border-gray-400"></div>
            </div>

            {/* Right Section (Flap B - Barcode & Milligram Weights) */}
            <div className="flex-1 space-y-0.5 pl-2 text-right">
              {/* Barcode SVG */}
              <div className="flex justify-end mb-1">
                <svg
                  viewBox={barcodeData.viewBox}
                  className="w-28 h-8"
                  style={{ shapeRendering: "crispEdges" }}
                >
                  <path d={barcodeData.svgPath} fill="#000000" />
                </svg>
              </div>

              <div className="text-[9px] font-mono leading-tight">
                <span className="text-gray-500">GW: </span>
                <span className="font-bold text-black">{item.grossWeight.toFixed(3)}g</span>
              </div>

              {item.stoneWeight > 0 && (
                <div className="text-[9px] font-mono leading-tight">
                  <span className="text-gray-500">SW: </span>
                  <span className="font-medium text-black">{item.stoneWeight.toFixed(3)}g</span>
                </div>
              )}

              <div className="text-[10px] font-mono leading-tight pt-0.5 border-t border-gray-300">
                <span className="text-gray-700 font-bold">NW: </span>
                <span className="font-black text-black">{item.netWeight.toFixed(3)}g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Specifications & Print Guide */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Barcode standard:</span>
            <span className="font-mono text-[#DFC488] font-semibold">Code 128 (Subset B)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Encoded Barcode:</span>
            <span className="font-mono text-[var(--text-primary)]">{item.barcode || item.sku}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Tray / Location:</span>
            <span className="text-[var(--text-primary)]">{item.trayLocation}</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-[11px] text-[var(--text-tertiary)]">
            Print margin: 0mm · Scale: 100%
          </span>
          <div className="flex items-center gap-2">
            <GlassButton variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="sm" onClick={handlePrint} icon={<Printer size={14} />}>
              Print Tag (थर्मल टैग प्रिंट)
            </GlassButton>
          </div>
        </div>
      </div>
    </GlassDialog>
  );
};
