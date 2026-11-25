import { FinalizedInvoice } from "../modules/invoicing/types";

export interface Gstr1HsnItem {
  num: number;
  hsn_sc: string;
  desc: string;
  uqc: "GMS";
  qty: number;
  val: number;
  txval: number;
  camt: number;
  samt: number;
  csamt: number;
}

export interface Gstr1B2csItem {
  sply_ty: "INTRA" | "INTER";
  pos: string;
  typ: "OE";
  rt: number;
  txval: number;
  camt: number;
  samt: number;
  csamt: number;
}

export interface Gstr1B2bCustomer {
  ctin: string;
  inv: Array<{
    inum: string;
    idt: string;
    val: number;
    pos: string;
    rchrg: "N" | "Y";
    inv_typ: "R";
    itms: Array<{
      num: number;
      itm_det: {
        rt: number;
        txval: number;
        camt: number;
        samt: number;
        csamt: number;
      };
    }>;
  }>;
}

export interface Gstr1GovtJsonPayload {
  gstin: string;
  fp: string;
  version: "GST3.0.4";
  hash: string;
  b2b: Gstr1B2bCustomer[];
  b2cs: Gstr1B2csItem[];
  hsn: {
    data: Gstr1HsnItem[];
  };
  doc_issue: {
    doc_det: Array<{
      doc_num: number;
      doc_typ: string;
      docs: Array<{
        num: number;
        from: string;
        to: string;
        totnum: number;
        canc: number;
        net_issue: number;
      }>;
    }>;
  };
}

/**
 * Transforms retail and wholesale finalised invoices into Government GST Offline Tool
 * compliant GSTR-1 schema (HSN 7113 Gold/Silver jewellery) ready for GST Portal upload.
 */
export function generateGstr1GovtJson(
  invoices: FinalizedInvoice[],
  showroomGstin = "08AAAAJ1234F1Z8",
  stateCode = "08"
): Gstr1GovtJsonPayload {
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentYear = String(now.getFullYear());
  const fp = `${currentMonth}${currentYear}`;

  let totalTaxableB2CS = 0;
  let totalCgstB2CS = 0;
  let totalSgstB2CS = 0;
  let totalGoldGrams = 0;
  let totalSilverGrams = 0;
  let totalGrossValue = 0;

  const b2bMap: Record<string, Gstr1B2bCustomer> = {};

  invoices.forEach((inv) => {
    totalGrossValue += inv.grandTotal || 0;
    const invGstin = inv.customer?.gstin?.trim();
    const isB2B = invGstin && invGstin.length === 15 && !invGstin.startsWith("URP");

    inv.items.forEach((item) => {
      if (item.metal === "silver") {
        totalSilverGrams += item.grossWeight || 0;
      } else {
        totalGoldGrams += item.grossWeight || 0;
      }
    });

    const invDateStr = (() => {
      const d = new Date(inv.invoiceDate || inv.createdAt);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${dd}-${mm}-${d.getFullYear()}`;
    })();

    if (isB2B) {
      if (!b2bMap[invGstin]) {
        b2bMap[invGstin] = {
          ctin: invGstin,
          inv: [],
        };
      }

      b2bMap[invGstin].inv.push({
        inum: inv.invoiceNumber,
        idt: invDateStr,
        val: Math.round(inv.grandTotal * 100) / 100,
        pos: stateCode,
        rchrg: "N",
        inv_typ: "R",
        itms: [
          {
            num: 1,
            itm_det: {
              rt: 3.0,
              txval: Math.round(inv.taxableAmount * 100) / 100,
              camt: Math.round(inv.cgstAmount * 100) / 100,
              samt: Math.round(inv.sgstAmount * 100) / 100,
              csamt: 0,
            },
          },
        ],
      });
    } else {
      totalTaxableB2CS += inv.taxableAmount || 0;
      totalCgstB2CS += inv.cgstAmount || 0;
      totalSgstB2CS += inv.sgstAmount || 0;
    }
  });

  const b2bList: Gstr1B2bCustomer[] = Object.values(b2bMap);

  const b2csList: Gstr1B2csItem[] =
    totalTaxableB2CS > 0
      ? [
          {
            sply_ty: "INTRA",
            pos: stateCode,
            typ: "OE",
            rt: 3.0,
            txval: Math.round(totalTaxableB2CS * 100) / 100,
            camt: Math.round(totalCgstB2CS * 100) / 100,
            samt: Math.round(totalSgstB2CS * 100) / 100,
            csamt: 0,
          },
        ]
      : [];

  const totalQuantityGms = Math.round((totalGoldGrams + totalSilverGrams) * 1000) / 1000;
  const totalTaxableAll = Math.round((totalTaxableB2CS + invoices.reduce((s, i) => s + (i.customer?.gstin && !i.customer.gstin.startsWith("URP") ? i.taxableAmount : 0), 0)) * 100) / 100;
  const totalCgstAll = Math.round((totalCgstB2CS + invoices.reduce((s, i) => s + (i.customer?.gstin && !i.customer.gstin.startsWith("URP") ? i.cgstAmount : 0), 0)) * 100) / 100;
  const totalSgstAll = Math.round((totalSgstB2CS + invoices.reduce((s, i) => s + (i.customer?.gstin && !i.customer.gstin.startsWith("URP") ? i.sgstAmount : 0), 0)) * 100) / 100;

  const hsnData: Gstr1HsnItem[] = [
    {
      num: 1,
      hsn_sc: "711319",
      desc: "Articles of jewellery and parts thereof, of precious metal",
      uqc: "GMS",
      qty: totalQuantityGms,
      val: Math.round(totalGrossValue * 100) / 100,
      txval: totalTaxableAll,
      camt: totalCgstAll,
      samt: totalSgstAll,
      csamt: 0,
    },
  ];

  const sortedInvoices = [...invoices].sort((a, b) =>
    a.invoiceNumber.localeCompare(b.invoiceNumber)
  );

  const docIssue = {
    doc_det: [
      {
        doc_num: 1,
        doc_typ: "Invoices for outward supply",
        docs: [
          {
            num: 1,
            from: sortedInvoices[0]?.invoiceNumber || "INV-001",
            to: sortedInvoices[sortedInvoices.length - 1]?.invoiceNumber || "INV-001",
            totnum: sortedInvoices.length,
            canc: 0,
            net_issue: sortedInvoices.length,
          },
        ],
      },
    ],
  };

  return {
    gstin: showroomGstin,
    fp,
    version: "GST3.0.4",
    hash: "hash_gst_sha256",
    b2b: b2bList,
    b2cs: b2csList,
    hsn: { data: hsnData },
    doc_issue: docIssue,
  };
}

/**
 * Triggers a browser file download of the GSTR-1 JSON file
 */
export function downloadGstr1JsonFile(
  invoices: FinalizedInvoice[],
  showroomGstin = "08AAAAJ1234F1Z8",
  stateCode = "08"
): void {
  const payload = generateGstr1GovtJson(invoices, showroomGstin, stateCode);
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `GSTR1_${payload.gstin}_${payload.fp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
