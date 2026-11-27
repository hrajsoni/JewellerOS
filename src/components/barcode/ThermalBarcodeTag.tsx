'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Printer, Tag, Sparkles, Check, Copy } from 'lucide-react';
import {
  ThermalTagType,
  TagInputItem,
  calculateTagLayout,
  formatTagData,
  generateThermalPrintCss,
} from '../../lib/barcode/thermalTags';
import { generateCode128Svg } from '../../lib/barcode/code128';

export interface ThermalBarcodeTagProps {
  item: TagInputItem;
  initialTagType?: ThermalTagType;
  shopName?: string;
  showControls?: boolean;
  className?: string;
  onPrinted?: () => void;
}

/**
 * High-precision thermal label printer tag renderer for jewellery inventory.
 * Supports:
 *  - 50x25mm Butterfly Jewellery Tag (Rings, Pendants, Bangles, Necklaces)
 *  - 38x25mm Dumbbell Jewellery Tag (Lightweight Chains, Bracelets)
 * Injects print-ready CSS rules for 203/300 DPI thermal printers (Zebra, TSC, Citizen, Godex).
 */
export const ThermalBarcodeTag: React.FC<ThermalBarcodeTagProps> = ({
  item,
  initialTagType = 'butterfly_50x25',
  shopName = 'JEWELBILL SHOWROOM',
  showControls = true,
  className = '',
  onPrinted,
}) => {
  const [tagType, setTagType] = useState<ThermalTagType>(initialTagType);
  const [barcodeSvg, setBarcodeSvg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const formatted = formatTagData(item, shopName);
  const layout = calculateTagLayout(tagType);
  const isButterfly = layout.canonicalType === 'butterfly_50x25';

  // Generate SVG Code-128 vector barcode
  useEffect(() => {
    let active = true;
    const barcodeText = formatted.barcode || formatted.productCode || 'JW-00000000';

    generateCode128Svg(barcodeText, {
      scale: 2,
      height: isButterfly ? 10 : 8,
      includeText: false,
    })
      .then((svg) => {
        if (active) {
          // Strip xml declaration if any and ensure responsive SVG
          const sanitizedSvg = svg
            .replace(/<\?xml.*?\?>/gi, '')
            .replace(/<!DOCTYPE.*?>/gi, '');
          setBarcodeSvg(sanitizedSvg);
        }
      })
      .catch((err) => {
        console.error('Failed to generate Code-128 SVG for tag:', err);
      });

    return () => {
      active = false;
    };
  }, [formatted.barcode, formatted.productCode, isButterfly]);

  // Execute standard thermal print command
  const handlePrint = () => {
    window.print();
    if (onPrinted) onPrinted();
  };

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formatted.barcode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Dynamic Thermal Print CSS injected for @media print */}
      <style
        dangerouslySetInnerHTML={{
          __html: generateThermalPrintCss(tagType),
        }}
      />

      {/* Control Selector & Actions Toolbar */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-md px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs">
          {/* Tag Type Selector Switch */}
          <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setTagType('butterfly_50x25')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                isButterfly
                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              50x25mm Butterfly
            </button>
            <button
              type="button"
              onClick={() => setTagType('dumbbell_38x25')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                !isButterfly
                  ? 'bg-amber-500 text-black font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              38x25mm Dumbbell
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy Barcode Value"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
            >
              <Printer size={13} /> Print Tag
            </button>
          </div>
        </div>
      )}

      {/* Physical Thermal Tag Sheet (Target of Thermal Printing) */}
      <div className="p-3 bg-slate-900/40 rounded-2xl border border-white/5 flex justify-center">
        <div
          ref={printContainerRef}
          id="thermal-tag-printable"
          className="thermal-tag-printable bg-white text-black select-none font-sans overflow-hidden shadow-2xl border border-gray-300"
          style={{
            width: `${layout.dimensionsMm.width}mm`,
            height: `${layout.dimensionsMm.height}mm`,
            boxSizing: 'border-box',
          }}
        >
          {isButterfly ? (
            /* ============================================================== */
            /* 50x25mm Butterfly Jewellery Tag                                */
            /* Left Wing (21mm) | Rat-Tail Loop (8mm) | Right Wing (21mm)     */
            /* ============================================================== */
            <div className="w-full h-full flex justify-between items-stretch p-[1mm] leading-none">
              {/* Left Wing (21mm): Barcode + Product Code + Shop Name */}
              <div
                className="flex flex-col justify-between overflow-hidden text-left"
                style={{ width: `${layout.dimensionsMm.leftWingWidth - 2}mm` }}
              >
                <div>
                  <div className="text-[7px] font-black uppercase tracking-tight text-gray-900 truncate">
                    {formatted.shopName}
                  </div>
                  <div className="text-[8px] font-mono font-bold tracking-tight text-black truncate">
                    {formatted.productCode}
                  </div>
                </div>

                {/* SVG Barcode Vector */}
                <div className="w-full my-0.5 flex items-center justify-start overflow-hidden">
                  {barcodeSvg ? (
                    <div
                      className="w-full max-h-[8mm] [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[8mm]"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                  ) : (
                    <div className="h-[7mm] w-full bg-gray-200 animate-pulse rounded" />
                  )}
                </div>

                <div className="flex items-center justify-between text-[6.5px] font-bold text-gray-800">
                  <span className="bg-black text-white px-0.5 py-0.2 rounded-xs font-mono">
                    {formatted.purityBadge}
                  </span>
                  <span className="font-mono text-gray-600">{formatted.hsnFormatted}</span>
                </div>
              </div>

              {/* Middle Section: Rat-Tail Non-Adhesive Loop Bridge (8mm) */}
              <div
                className="flex flex-col items-center justify-center border-l border-r border-dashed border-gray-300"
                style={{ width: `${layout.dimensionsMm.bridgeWidth}mm` }}
              >
                <div className="w-[1.5mm] h-[18mm] rounded-full bg-gray-200 border border-gray-400 opacity-60" />
              </div>

              {/* Right Wing (21mm): Gross Wt, Net Wt, Making Charges, HUID */}
              <div
                className="flex flex-col justify-between text-right pl-1 overflow-hidden"
                style={{ width: `${layout.dimensionsMm.rightWingWidth - 2}mm` }}
              >
                <div className="text-[7.5px] font-mono leading-tight">
                  <span className="text-gray-600">GW: </span>
                  <span className="font-bold text-black">{formatted.grossWeightFormatted.replace('GW: ', '')}</span>
                </div>

                {formatted.stoneWeightFormatted && (
                  <div className="text-[7px] font-mono leading-tight">
                    <span className="text-gray-500">SW: </span>
                    <span className="text-black">{formatted.stoneWeightFormatted.replace('SW: ', '')}</span>
                  </div>
                )}

                <div className="text-[8px] font-mono font-black text-black leading-tight border-y border-gray-300 py-0.5 my-0.5">
                  <span className="text-gray-800 text-[6.5px]">NW: </span>
                  {formatted.netWeightFormatted.replace('NW: ', '')}
                </div>

                <div className="text-[7px] font-mono font-semibold text-gray-900 leading-tight">
                  {formatted.makingFormatted}
                </div>

                <div className="text-[7px] font-mono font-bold text-black leading-tight truncate">
                  {formatted.huidFormatted}
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* 38x25mm Dumbbell Jewellery Tag                                 */
            /* Left Wing (15mm) | Neck Stem (8mm) | Right Wing (15mm)         */
            /* ============================================================== */
            <div className="w-full h-full flex justify-between items-stretch p-[1mm] leading-none">
              {/* Left Wing (15mm): Barcode + Product Code */}
              <div
                className="flex flex-col justify-between overflow-hidden text-left"
                style={{ width: `${layout.dimensionsMm.leftWingWidth - 2}mm` }}
              >
                <div className="text-[6.5px] font-black uppercase text-gray-900 truncate">
                  {formatted.shopName}
                </div>

                <div className="w-full my-0.5 flex items-center justify-start overflow-hidden">
                  {barcodeSvg ? (
                    <div
                      className="w-full max-h-[7mm] [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[7mm]"
                      dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    />
                  ) : (
                    <div className="h-[6mm] w-full bg-gray-200 animate-pulse rounded" />
                  )}
                </div>

                <div className="text-[7.5px] font-mono font-bold text-black truncate">
                  {formatted.productCode}
                </div>
              </div>

              {/* Middle Section: Dumbbell Neck Stem (8mm) */}
              <div
                className="flex flex-col items-center justify-center border-l border-r border-dashed border-gray-300"
                style={{ width: `${layout.dimensionsMm.bridgeWidth}mm` }}
              >
                <div className="w-[1.2mm] h-[15mm] rounded-full bg-gray-200 border border-gray-400 opacity-60" />
              </div>

              {/* Right Wing (15mm): GW, NW, Making, HUID */}
              <div
                className="flex flex-col justify-between text-right pl-0.5 overflow-hidden"
                style={{ width: `${layout.dimensionsMm.rightWingWidth - 2}mm` }}
              >
                <div className="text-[7px] font-mono font-bold leading-tight">
                  <span className="text-gray-600">GW:</span> {formatted.grossWeightFormatted.replace('GW: ', '')}
                </div>

                <div className="text-[7.5px] font-mono font-black text-black leading-tight border-y border-gray-300 py-0.5 my-0.5">
                  <span className="text-gray-800 text-[6px]">NW:</span> {formatted.netWeightFormatted.replace('NW: ', '')}
                </div>

                <div className="text-[6.5px] font-mono font-semibold text-gray-900 leading-tight">
                  {formatted.makingFormatted}
                </div>

                <div className="text-[6.5px] font-mono font-bold text-black leading-tight truncate">
                  {formatted.huidFormatted}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tag Metadata Guide */}
      <div className="text-center text-[11px] text-slate-400">
        <span>Format: <strong className="text-amber-300 font-mono">{layout.name}</strong></span>
        <span className="mx-2">·</span>
        <span>Target: <span className="text-slate-300">{layout.targetUse}</span></span>
        <span className="mx-2">·</span>
        <span>Resolution: <span className="font-mono text-slate-300">203/300 DPI</span></span>
      </div>
    </div>
  );
};
