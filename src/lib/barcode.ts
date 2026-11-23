/**
 * High-performance, zero-dependency Code 128 (Subset B) Barcode Generator
 * Generates vector SVG barcodes suitable for 203/300 DPI thermal jewellery tag printers
 * (Zebra, TSC, Citizen, Godex, Brother) and high-resolution screen display.
 */

// Code 128 Patterns (107 patterns, each pattern is 11 modules: alternating bars and spaces)
const CODE128_PATTERNS: number[] = [
  0x6cc, 0x66c, 0x666, 0x498, 0x48c, 0x44c, 0x4c8, 0x4c4, 0x464, 0x648,
  0x644, 0x624, 0x59c, 0x4dc, 0x4ce, 0x5c9, 0x4e9, 0x4e7, 0x671, 0x659,
  0x64d, 0x716, 0x6b6, 0x76b, 0x69b, 0x67b, 0x677, 0x739, 0x719, 0x70d,
  0x71a, 0x70e, 0x68e, 0x4a8, 0x494, 0x48a, 0x4a4, 0x486, 0x446, 0x528,
  0x524, 0x514, 0x594, 0x58a, 0x586, 0x628, 0x622, 0x612, 0x692, 0x68a,
  0x682, 0x722, 0x6e2, 0x6e6, 0x762, 0x742, 0x726, 0x716, 0x706, 0x6b2,
  0x696, 0x686, 0x732, 0x72a, 0x712, 0x70a, 0x6ea, 0x6e2, 0x6a2, 0x692,
  0x682, 0x722, 0x6e2, 0x6b2, 0x6a6, 0x696, 0x686, 0x732, 0x72a, 0x712,
  0x70a, 0x6ea, 0x6da, 0x6d6, 0x756, 0x74e, 0x72e, 0x71a, 0x70e, 0x6ce,
  0x6ae, 0x6aa, 0x69a, 0x68e, 0x72e, 0x71a, 0x70e, 0x6ee, 0x6ea, 0x6ae,
  0x6aa, 0x69a, 0x68e, 0x674, 0x672, 0x656, 0x6b8
];

const START_B = 104;
const STOP = 106;

// Converts an 11-bit integer into a binary module sequence
function patternToModules(pattern: number, length: number = 11): boolean[] {
  const modules: boolean[] = [];
  for (let i = length - 1; i >= 0; i--) {
    modules.push(Boolean((pattern >> i) & 1));
  }
  return modules;
}

/**
 * Encodes text into Code 128 Subset B binary modules (bars = true, spaces = false)
 */
export function encodeCode128B(text: string): boolean[] {
  const sanitized = text.replace(/[^\x20-\x7E]/g, ""); // ASCII 32 - 126
  if (!sanitized) return [];

  const values: number[] = [START_B];
  let checksum = START_B;

  for (let i = 0; i < sanitized.length; i++) {
    const code = sanitized.charCodeAt(i) - 32;
    values.push(code);
    checksum += code * (i + 1);
  }

  const checkDigit = checksum % 103;
  values.push(checkDigit);
  values.push(STOP);

  const modules: boolean[] = [];

  // Quiet zone: 10 modules
  for (let q = 0; q < 10; q++) modules.push(false);

  // Encode values
  for (let idx = 0; idx < values.length; idx++) {
    const val = values[idx];
    const isStop = idx === values.length - 1;
    // Stop code is 13 modules (pattern 106 + 2 trailing termination bars: 0x18eb or 0x6b8 + 11)
    if (isStop) {
      // Standard Stop pattern: 1100011101011 (13 bits)
      const stopBits = [true, true, false, false, false, true, true, true, false, true, false, true, true];
      modules.push(...stopBits);
    } else {
      const p = CODE128_PATTERNS[val] || 0;
      modules.push(...patternToModules(p, 11));
    }
  }

  // Trailing quiet zone: 10 modules
  for (let q = 0; q < 10; q++) modules.push(false);

  return modules;
}

/**
 * Returns SVG path definition for the barcode
 */
export function generateBarcodeSvg(
  text: string,
  options?: {
    height?: number;
    moduleWidth?: number;
    showText?: boolean;
    fillColor?: string;
  }
): {
  svgPath: string;
  width: number;
  height: number;
  viewBox: string;
} {
  const height = options?.height || 50;
  const moduleWidth = options?.moduleWidth || 1.8;
  const modules = encodeCode128B(text);

  let svgPath = "";
  let barStart = -1;

  for (let i = 0; i < modules.length; i++) {
    const isBar = modules[i];
    if (isBar && barStart === -1) {
      barStart = i;
    } else if (!isBar && barStart !== -1) {
      const x = (barStart * moduleWidth).toFixed(1);
      const w = ((i - barStart) * moduleWidth).toFixed(1);
      svgPath += `M${x},0 h${w} v${height} h-${w} Z `;
      barStart = -1;
    }
  }

  if (barStart !== -1) {
    const x = (barStart * moduleWidth).toFixed(1);
    const w = ((modules.length - barStart) * moduleWidth).toFixed(1);
    svgPath += `M${x},0 h${w} v${height} h-${w} Z `;
  }

  const totalWidth = Math.ceil(modules.length * moduleWidth);

  return {
    svgPath,
    width: totalWidth,
    height,
    viewBox: `0 0 ${totalWidth} ${height}`,
  };
}
