---
name: barcode-inventory
description: Dual barcode generation (Code-128 via bwip-js), physical USB/Bluetooth scanner wedge handling, camera scanning via ZXing, and thermal tag printing.
---

# Barcode & Inventory Management Skill

## 1. Dual Barcode Strategy
1. **Serialized Unique Barcodes (High-Value Ornaments):**
   - Every individual jewellery piece receives a unique barcode: `JW-` followed by an 8-character zero-padded integer or sequence (e.g. `JW-00018452`).
   - Looked up against `StockItem` table directly.
2. **Non-Serialized Variant Barcodes (Fast-Moving / Bullion):**
   - Coins, findings, nose pins, or silver articles can share an SKU barcode (e.g. `COIN-24K-10G`).
   - Scanning increments quantity or prompts for individual piece weight.

---

## 2. Barcode Generation via `bwip-js`
- **Symbology:** **Code-128** (high density, alphanumeric, universally supported by commercial jewellery barcode scanners).
- **Format:** Rendered as vector SVG or high-DPI PNG for sharp thermal label printing.

```typescript
import bwipjs from 'bwip-js';

export async function generateCode128Svg(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128',
        text: code,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      },
      (err, png) => {
        if (err) reject(err);
        else resolve(`data:image/png;base64,${png.toString('base64')}`);
      }
    );
  });
}
```

---

## 3. Physical Scanner & Camera Integration
1. **Hardware Keyboard Wedge (USB / Bluetooth Scanners):**
   - Barcode scanners emulate ultra-fast keyboard input terminated by an `Enter` key (`keyCode 13`).
   - The scanner listener measures inter-keystroke latency ($< 35\text{ms}$ between keystrokes indicates a hardware scanner, rather than manual typing).
   - Automatically catches barcode inputs even when the focus is not inside the search input box.
2. **Camera Scanner via `@zxing/browser`:**
   - WebRTC video stream for mobile tablets and smartphones without dedicated hardware scanners.
   - Continuous frame decoding with vibration / beep feedback on successful scan.

---

## 4. Thermal Jewellery Tag Formats
- **Butterfly Tag (50mm x 25mm):** The industry standard for rings and earrings. Left wing contains barcode and price/making; tail wraps around the shank; right wing displays Gross Wt, Net Wt, and HUID.
- **Dumbbell Tag (38mm x 25mm):** Used for lightweight chains and bracelets.
