import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  generateCode128Svg,
  generateCode128PngDataUrl,
  isValidCode128Text,
} from '../src/lib/barcode/code128';

import {
  calculateTagLayout,
  normalizeTagType,
  mmToDots,
  formatWeight,
  calculateNetWeight,
  formatMakingCharges,
  formatHuid,
  formatPurityBadge,
  formatTagData,
  generateThermalPrintCss,
  THERMAL_TAG_PRESETS,
} from '../src/lib/barcode/thermalTags';

describe('JewelleryOS Barcode & Scanner Engine Tests', () => {
  // =========================================================================
  // SUB-SUITE 1: Code-128 SVG & PNG Generation for Valid Serials and SKUs
  // =========================================================================
  describe('Code-128 Barcode Generation (Valid Inputs)', () => {
    it('generates valid SVG for piece serial JW-00018452', async () => {
      const serial = 'JW-00018452';
      const svg = await generateCode128Svg(serial);

      assert.ok(typeof svg === 'string', 'Output should be a string');
      assert.ok(svg.length > 50, 'SVG length should be substantial');
      assert.ok(svg.includes('<svg'), 'Should contain opening <svg tag');
      assert.ok(svg.includes('</svg>'), 'Should contain closing </svg> tag');
      assert.ok(svg.includes('viewBox='), 'Should have a viewBox attribute for responsiveness');
      assert.ok(svg.includes('xmlns='), 'Should have XML namespace attribute');
    });

    it('generates valid SVG for SKU master code RNG-22K-001', async () => {
      const sku = 'RNG-22K-001';
      const svg = await generateCode128Svg(sku, {
        scale: 2,
        height: 12,
        includeText: true,
      });

      assert.ok(svg.includes('<svg'));
      assert.ok(svg.includes('</svg>'));
      assert.ok(svg.includes('viewBox='));
    });

    it('generates valid SVG for commercial 10-digit numeric barcode (8901840001)', async () => {
      const numericBarcode = '8901840001';
      const svg = await generateCode128Svg(numericBarcode, {
        scale: 3,
        height: 10,
        includeText: false,
      });

      assert.ok(svg.includes('<svg'));
      assert.ok(svg.includes('</svg>'));
    });

    it('generates valid SVG for category codes with hyphens and mixed casing', async () => {
      const testCodes = ['CHN-18K-084', 'BRC-22K-9901', 'KDM-BAN-005', 'SLV-PAY-1002'];

      for (const code of testCodes) {
        const svg = await generateCode128Svg(code);
        assert.ok(svg.includes('<svg'), `Failed for code ${code}`);
        assert.ok(svg.includes('</svg>'), `Missing closing tag for ${code}`);
      }
    });

    it('generates Base64 PNG data URL for thermal printer raster rendering', async () => {
      const serial = 'JW-00018452';
      const dataUrl = await generateCode128PngDataUrl(serial);

      assert.ok(typeof dataUrl === 'string');
      assert.ok(
        dataUrl.startsWith('data:image/png;base64,'),
        'Should be a base64 encoded PNG data URI'
      );

      const base64Content = dataUrl.replace('data:image/png;base64,', '');
      const buffer = Buffer.from(base64Content, 'base64');
      assert.ok(buffer.length > 50, 'PNG buffer should contain image data');
      // Verify PNG file signature (0x89 0x50 0x4E 0x47)
      assert.equal(buffer[0], 0x89);
      assert.equal(buffer[1], 0x50);
      assert.equal(buffer[2], 0x4e);
      assert.equal(buffer[3], 0x47);
    });

    it('supports custom altText and text alignment options without errors', async () => {
      const svg = await generateCode128Svg('JW-00018452', {
        altText: 'SERIAL: 18452',
        textXAlign: 'right',
        includeText: true,
      });

      assert.ok(svg.includes('<svg'));
      assert.ok(svg.includes('</svg>'));
    });
  });

  // =========================================================================
  // SUB-SUITE 2: Rejection and Handling of Invalid or Empty Inputs
  // =========================================================================
  describe('Input Validation & Error Handling', () => {
    it('rejects empty string barcode with descriptive error', async () => {
      await assert.rejects(
        async () => {
          await generateCode128Svg('');
        },
        {
          name: 'Error',
          message: /empty or whitespace/i,
        }
      );
    });

    it('rejects whitespace-only barcode inputs', async () => {
      await assert.rejects(
        async () => {
          await generateCode128Svg('    ');
        },
        {
          name: 'Error',
          message: /empty or whitespace/i,
        }
      );
    });

    it('rejects non-string inputs (null, undefined, numbers)', async () => {
      await assert.rejects(
        async () => {
          await generateCode128Svg(null as any);
        },
        {
          name: 'Error',
          message: /empty or whitespace/i,
        }
      );

      await assert.rejects(
        async () => {
          await generateCode128Svg(undefined as any);
        },
        {
          name: 'Error',
          message: /empty or whitespace/i,
        }
      );

      await assert.rejects(
        async () => {
          await generateCode128Svg(12345 as any);
        },
        {
          name: 'Error',
          message: /empty or whitespace/i,
        }
      );
    });

    it('rejects non-ASCII / Unicode characters not supported by standard Code-128', async () => {
      await assert.rejects(
        async () => {
          await generateCode128Svg('JEWEL-💎');
        },
        {
          name: 'Error',
          message: /ASCII only/i,
        }
      );

      await assert.rejects(
        async () => {
          await generateCode128Svg('सोने का कड़ा');
        },
        {
          name: 'Error',
          message: /ASCII only/i,
        }
      );
    });

    it('isValidCode128Text helper correctly classifies valid vs invalid inputs', () => {
      // Valid inputs
      assert.equal(isValidCode128Text('JW-00018452'), true);
      assert.equal(isValidCode128Text('RNG-22K-001'), true);
      assert.equal(isValidCode128Text('8901840001'), true);
      assert.equal(isValidCode128Text('A'), true);
      assert.equal(isValidCode128Text('TEST-1234$%'), true);

      // Invalid inputs
      assert.equal(isValidCode128Text(''), false);
      assert.equal(isValidCode128Text('   '), false);
      assert.equal(isValidCode128Text(null), false);
      assert.equal(isValidCode128Text(undefined), false);
      assert.equal(isValidCode128Text(12345), false);
      assert.equal(isValidCode128Text('JEWEL-💎'), false);
      assert.equal(isValidCode128Text('सोना'), false);
    });

    it('generateCode128PngDataUrl also rejects empty or invalid text', async () => {
      await assert.rejects(
        async () => {
          await generateCode128PngDataUrl('');
        },
        {
          name: 'Error',
          message: /empty or whitespace/i,
        }
      );
    });
  });

  // =========================================================================
  // SUB-SUITE 3: Thermal Tag Layout Calculations (Butterfly and Dumbbell)
  // =========================================================================
  describe('Thermal Tag Layout Calculations', () => {
    it('calculates exact 50x25mm Butterfly Tag layout for rings and necklaces', () => {
      const layout = calculateTagLayout('butterfly_50x25', 203);

      assert.equal(layout.canonicalType, 'butterfly_50x25');
      assert.equal(layout.dimensionsMm.width, 50);
      assert.equal(layout.dimensionsMm.height, 25);
      assert.equal(layout.dimensionsMm.leftWingWidth, 21);
      assert.equal(layout.dimensionsMm.bridgeWidth, 8);
      assert.equal(layout.dimensionsMm.rightWingWidth, 21);

      // Sum of left wing, bridge, and right wing must equal total width (21 + 8 + 21 = 50mm)
      const sumMm =
        layout.dimensionsMm.leftWingWidth +
        layout.dimensionsMm.bridgeWidth +
        layout.dimensionsMm.rightWingWidth;
      assert.equal(sumMm, 50, 'Wings and loop bridge width must sum to 50mm');

      // Check fields assignment: Barcode & Product Code on left wing, GW, NW, Making, HUID on right wing
      assert.ok(layout.leftWingFields.includes('barcode'), 'Left wing must include barcode');
      assert.ok(layout.leftWingFields.includes('productCode'), 'Left wing must include productCode');
      assert.ok(layout.rightWingFields.includes('grossWeight'), 'Right wing must include grossWeight');
      assert.ok(layout.rightWingFields.includes('netWeight'), 'Right wing must include netWeight');
      assert.ok(layout.rightWingFields.includes('makingCharges'), 'Right wing must include makingCharges');
      assert.ok(layout.rightWingFields.includes('huid'), 'Right wing must include huid');

      // 203 DPI dots calculation (8.0 dots/mm standard)
      // 50mm / 25.4 * 203 = 399.6 => 400 dots
      // 25mm / 25.4 * 203 = 199.8 => 200 dots
      assert.equal(layout.dimensionsDots.width, 400);
      assert.equal(layout.dimensionsDots.height, 200);
      assert.equal(layout.dimensionsDots.leftWingWidth, 168);
      assert.equal(layout.dimensionsDots.bridgeWidth, 64);
      assert.equal(layout.dimensionsDots.rightWingWidth, 168);
    });

    it('calculates 50x25mm Butterfly Tag at 300 DPI for high-resolution printers', () => {
      const layout = calculateTagLayout('butterfly', 300);

      assert.equal(layout.canonicalType, 'butterfly_50x25');
      assert.equal(layout.dpi, 300);
      // 50mm / 25.4 * 300 = 590.55 => 591 dots
      // 25mm / 25.4 * 300 = 295.27 => 295 dots
      assert.equal(layout.dimensionsDots.width, 591);
      assert.equal(layout.dimensionsDots.height, 295);
    });

    it('calculates exact 38x25mm Dumbbell Tag layout for lightweight chains and bracelets', () => {
      const layout = calculateTagLayout('dumbbell_38x25', 203);

      assert.equal(layout.canonicalType, 'dumbbell_38x25');
      assert.equal(layout.dimensionsMm.width, 38);
      assert.equal(layout.dimensionsMm.height, 25);
      assert.equal(layout.dimensionsMm.leftWingWidth, 15);
      assert.equal(layout.dimensionsMm.bridgeWidth, 8);
      assert.equal(layout.dimensionsMm.rightWingWidth, 15);

      // Sum: 15 + 8 + 15 = 38mm
      const sumMm =
        layout.dimensionsMm.leftWingWidth +
        layout.dimensionsMm.bridgeWidth +
        layout.dimensionsMm.rightWingWidth;
      assert.equal(sumMm, 38, 'Dumbbell heads and neck stem width must sum to 38mm');

      // Check fields assignment
      assert.ok(layout.leftWingFields.includes('barcode'), 'Left wing must include barcode');
      assert.ok(layout.leftWingFields.includes('productCode'), 'Left wing must include productCode');
      assert.ok(layout.rightWingFields.includes('grossWeight'), 'Right wing must include grossWeight');
      assert.ok(layout.rightWingFields.includes('netWeight'), 'Right wing must include netWeight');

      // 203 DPI dots calculation
      // 38mm / 25.4 * 203 = 303.7 => 304 dots
      // 25mm / 25.4 * 203 = 199.8 => 200 dots
      assert.equal(layout.dimensionsDots.width, 304);
      assert.equal(layout.dimensionsDots.height, 200);
      assert.equal(layout.dimensionsDots.leftWingWidth, 120);
      assert.equal(layout.dimensionsDots.bridgeWidth, 64);
      assert.equal(layout.dimensionsDots.rightWingWidth, 120);
    });

    it('calculates 38x25mm Dumbbell Tag at 300 DPI', () => {
      const layout = calculateTagLayout('dumbbell', 300);

      assert.equal(layout.canonicalType, 'dumbbell_38x25');
      assert.equal(layout.dpi, 300);
      // 38mm / 25.4 * 300 = 448.8 => 449 dots
      // 25mm / 25.4 * 300 = 295.27 => 295 dots
      assert.equal(layout.dimensionsDots.width, 449);
      assert.equal(layout.dimensionsDots.height, 295);
    });

    it('normalizeTagType correctly resolves aliases', () => {
      assert.equal(normalizeTagType('butterfly'), 'butterfly_50x25');
      assert.equal(normalizeTagType('BUTTERFLY'), 'butterfly_50x25');
      assert.equal(normalizeTagType('butterfly_50x25'), 'butterfly_50x25');
      assert.equal(normalizeTagType('50x25'), 'butterfly_50x25');

      assert.equal(normalizeTagType('dumbbell'), 'dumbbell_38x25');
      assert.equal(normalizeTagType('DUMBBELL'), 'dumbbell_38x25');
      assert.equal(normalizeTagType('dumbbell_38x25'), 'dumbbell_38x25');
      assert.equal(normalizeTagType('38x25'), 'dumbbell_38x25');
    });

    it('mmToDots converts standard metric units accurately', () => {
      assert.equal(mmToDots(25.4, 203), 203); // Exactly 1 inch
      assert.equal(mmToDots(25.4, 300), 300); // Exactly 1 inch
      assert.equal(mmToDots(0, 203), 0);
    });
  });

  // =========================================================================
  // SUB-SUITE 4: Printable Data Formatters
  // =========================================================================
  describe('Printable Jewellery Tag Data Formatters', () => {
    it('formatWeight accurately formats milligram decimal precision', () => {
      assert.equal(formatWeight(10.45), '10.450g');
      assert.equal(formatWeight(0.852), '0.852g');
      assert.equal(formatWeight(125.0), '125.000g');
      assert.equal(formatWeight(0), '0.000g');
      assert.equal(formatWeight(undefined), '0.000g');
      assert.equal(formatWeight(-5), '0.000g', 'Negative weight is normalized to 0.000g');
    });

    it('calculateNetWeight correctly subtracts stone weight and deductions', () => {
      const net = calculateNetWeight(10.5, 0.45, 0.05);
      assert.equal(net, 10.0);

      const netZeroDeductions = calculateNetWeight(8.25, 0, 0);
      assert.equal(netZeroDeductions, 8.25);

      const netClamped = calculateNetWeight(2.0, 3.0, 0);
      assert.equal(netClamped, 0, 'Excess deductions must clamp net weight at 0');
    });

    it('formatMakingCharges formats percentage, per_gram, and fixed amounts', () => {
      assert.equal(formatMakingCharges('percentage', 18), 'MK: 18%');
      assert.equal(formatMakingCharges('per_gram', 450), 'MK: ₹450/g');
      assert.equal(formatMakingCharges('fixed', 1500), 'MK: ₹1,500');
      assert.equal(formatMakingCharges(undefined, undefined), 'MK: 0%');
    });

    it('formatHuid standardizes 6-character alphanumeric BIS hallmark code', () => {
      assert.equal(formatHuid('ab12cd'), 'HUID: AB12CD');
      assert.equal(formatHuid('  X9Y8Z7  '), 'HUID: X9Y8Z7');
      assert.equal(formatHuid(''), 'HUID: N/A');
      assert.equal(formatHuid(undefined), 'HUID: N/A');
    });

    it('formatPurityBadge handles 22K, 18K, 14K, 24K and silver', () => {
      assert.equal(formatPurityBadge('22K'), '22K (916)');
      assert.equal(formatPurityBadge('18K'), '18K (750)');
      assert.equal(formatPurityBadge('14K'), '14K (585)');
      assert.equal(formatPurityBadge('24K'), '24K (999)');
      assert.equal(formatPurityBadge('925'), '925 Silver');
      assert.equal(formatPurityBadge('22K', '22K 916 BIS'), '22K 916 BIS');
    });

    it('formatTagData seamlessly prepares full printable data payload', () => {
      const item = {
        barcode: '8901840001',
        sku: 'RNG-22K-001',
        name: '22K Antique Filigree Ring',
        category: 'Rings',
        grossWeight: 10.45,
        stoneWeight: 0.65,
        otherDeductions: 0.1,
        purity: '22K',
        defaultMakingType: 'percentage' as const,
        defaultMakingValue: 16,
        huid: 'AB12CD',
        hsnCode: '7113',
        trayLocation: 'Tray #4 · Bridal Rings',
      };

      const tagData = formatTagData(item, 'Sandhya Jewellers');

      assert.equal(tagData.barcode, '8901840001');
      assert.equal(tagData.productCode, 'RNG-22K-001');
      assert.equal(tagData.shopName, 'SANDHYA JEWELLERS');
      assert.equal(tagData.purityBadge, '22K (916)');
      assert.equal(tagData.grossWeightFormatted, 'GW: 10.450g');
      // Net weight: 10.450 - 0.650 - 0.100 = 9.700g
      assert.equal(tagData.netWeightFormatted, 'NW: 9.700g');
      assert.equal(tagData.stoneWeightFormatted, 'SW: 0.650g');
      assert.equal(tagData.makingFormatted, 'MK: 16%');
      assert.equal(tagData.huidFormatted, 'HUID: AB12CD');
      assert.equal(tagData.hsnFormatted, 'HSN: 7113');
      assert.equal(tagData.trayLocation, 'Tray #4 · Bridal Rings');
    });

    it('generateThermalPrintCss generates valid page size for printing', () => {
      const butterflyCss = generateThermalPrintCss('butterfly_50x25');
      assert.ok(butterflyCss.includes('size: 50mm 25mm;'));
      assert.ok(butterflyCss.includes('@media print'));
      assert.ok(butterflyCss.includes('.thermal-tag-printable'));

      const dumbbellCss = generateThermalPrintCss('dumbbell_38x25');
      assert.ok(dumbbellCss.includes('size: 38mm 25mm;'));
      assert.ok(dumbbellCss.includes('@media print'));
    });
  });
});
