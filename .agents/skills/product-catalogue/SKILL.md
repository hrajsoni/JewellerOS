---
name: product-catalogue
description: Multi-tier jewellery catalogue, design vs piece separation, category taxonomy, and variant management.
---

# Product Catalogue Skill

## 1. The 5-Tier Product Identity Architecture

```
+-----------------------------------------------------------------------------------+
| TIER 1: PRODUCT (DESIGN)                                                          |
| - ID: "cly1..." (UUID)                                                            |
| - Product Code: "RNG-22K-001" (Human Design Code)                                 |
| - Category: "Rings", Metal: GOLD, Default Purity: "22K"                           |
| - HSN Code: "7113", Default Making: 12%                                           |
| - Primary Catalogue Images (3D CAD, Studio Render, Model Photos)                  |
+-----------------------------------------------------------------------------------+
                                    |
                                    v has many
+-----------------------------------------------------------------------------------+
| TIER 2: PRODUCT VARIANT (SKU)                                                     |
| - SKU: "RNG-22K-001-SZ18"                                                         |
| - Variation Attributes: Size 18, Yellow Gold, Cubic Zirconia Accent               |
| - Standard Reference Weight: 4.500 g                                              |
| - Master Barcode (for non-serialized items)                                       |
+-----------------------------------------------------------------------------------+
                                    |
                                    v has many
+-----------------------------------------------------------------------------------+
| TIER 3: STOCK ITEM (PHYSICAL PIECE)                                               |
| - Barcode / Item Serial: "JW-00018452" (Unique Code-128 Tag)                      |
| - Actual Gross Weight: 4.520 g, Stone Weight: 0.120 g, Net Weight: 4.400 g        |
| - BIS HUID: "H7K9L2" (Assayed 6-char alphanumeric code)                           |
| - Tray Location: "Tray-G12 / Showcase-A", Status: IN_SHOWCASE                     |
| - Acquisition Cost: ₹29,840.00                                                    |
| - Piece-Specific Photographs (Actual hallmarked item, defect audit)               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Category Taxonomy & Hierarchies
Jewellery catalogues must support hierarchical classification:
- **Major Metal Class:** Gold, Silver, Platinum, Bullion / Coins.
- **Main Categories:** Rings, Necklaces, Chains, Bangles, Bracelets, Earrings, Pendants, Mangalsutras, Anklets / Payal, Utensils / Murti.
- **Sub-Categories:** Solitaire, Antique Temple, Kundan-Jadau, Rose Gold Casual, Italian Casting.
- **Attributes Matrix:**
  - Size (Rings: 10–24, Bangles: 2.2–2.10, Chains: 18"–24").
  - Gender / Target: Men, Women, Kids, Unisex.
  - Stone Details: Uncut Polished Diamond (Carats, Clarity, Color), Synthetic Stones, Enamel/Meenakari.
