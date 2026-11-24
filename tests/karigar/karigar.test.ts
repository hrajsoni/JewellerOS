import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getSavedKarigars,
  getSavedKarigarTxns,
  getSavedJobCards,
  addKarigar,
  issueMetalToKarigar,
  receiveOrnamentFromKarigar,
  payLabourToKarigar,
  createJobCard,
  updateJobCardStatus,
} from "../../src/modules/karigar/store";
import {
  CreateJobCardInput,
  generateKarigarWhatsAppText,
} from "../../src/modules/karigar/types";

describe("JewelleryOS Milestone 6: Karigar & Manufacturing Bullion Reconciliation Tests", () => {
  const tenantId = "test-tenant-karigar-01";

  test("Metal Issue: Weigh and issue 24K pure bullion bar to karigar", () => {
    const karigars = getSavedKarigars(tenantId);
    const artisan = karigars[0]; // Gopal Babu
    const initialGold = artisan.pureGoldBalanceGrams;

    const issueTxn = issueMetalToKarigar(
      {
        karigarId: artisan.id,
        metal: "gold",
        grossWeight: 50.0,
        purity: "24K Fine Bar (99.9%)",
        fineWeight: 50.0,
        ornamentOrderName: "40g Kundan Bangle Order",
        notes: "Weighed on digital scale, 24K bullion dispatched",
      },
      tenantId
    );

    assert.strictEqual(issueTxn.type, "issue_metal");
    assert.strictEqual(issueTxn.fineWeightDelta, 50.0);

    const updatedKarigars = getSavedKarigars(tenantId);
    const updatedArtisan = updatedKarigars.find((k) => k.id === artisan.id);
    assert.strictEqual(
      updatedArtisan?.pureGoldBalanceGrams,
      Math.round((initialGold + 50.0) * 1000) / 1000
    );
  });

  test("Ornament Receipt with Ghat/Wastage: Credits finished goods, deducts pure gold, adds labour due", () => {
    const karigars = getSavedKarigars(tenantId);
    const artisan = karigars[0];
    const initialGold = artisan.pureGoldBalanceGrams;
    const initialLabour = artisan.labourBalanceDue;

    // Receive finished 22K bangles: Net wt = 46.5g -> Fine gold = 46.5 * (22/24) = 42.625g
    const fineDeduction = 42.625;
    const labourCharges = 12500;

    const rcvTxn = receiveOrnamentFromKarigar(
      {
        karigarId: artisan.id,
        metal: "gold",
        ornamentName: "22K Solid Cast Bangles (Pair)",
        grossWeight: 47.0,
        netWeight: 46.5,
        purity: "22K (916)",
        fineWeightDeducted: fineDeduction,
        labourCharges,
        huid: "HA916K",
        notes: "Passed BIS hallmarking, 0.5g enamel weight excluded",
      },
      tenantId
    );

    assert.strictEqual(rcvTxn.type, "receive_ornament");
    assert.strictEqual(rcvTxn.fineWeightDelta, -fineDeduction);
    assert.strictEqual(rcvTxn.labourAmount, labourCharges);

    const updatedKarigars = getSavedKarigars(tenantId);
    const updatedArtisan = updatedKarigars.find((k) => k.id === artisan.id);

    const expectedGold = Math.round((initialGold - fineDeduction) * 1000) / 1000;
    assert.strictEqual(updatedArtisan?.pureGoldBalanceGrams, expectedGold);
    assert.strictEqual(updatedArtisan?.labourBalanceDue, initialLabour + labourCharges);
  });

  test("Labour Settlement: Pay artisan making charges via Cash/Bank", () => {
    const karigars = getSavedKarigars(tenantId);
    const artisan = karigars[0];
    const initialLabour = artisan.labourBalanceDue;

    const payTxn = payLabourToKarigar(
      {
        karigarId: artisan.id,
        amount: 10000,
        paymentMethod: "Cash",
        notes: "Settled making charges voucher #VC-201",
      },
      tenantId
    );

    assert.strictEqual(payTxn.type, "labour_payment");
    assert.strictEqual(payTxn.paymentAmount, 10000);

    const updatedKarigars = getSavedKarigars(tenantId);
    const updatedArtisan = updatedKarigars.find((k) => k.id === artisan.id);
    assert.strictEqual(updatedArtisan?.labourBalanceDue, initialLabour - 10000);
  });

  test("Job Card Lifecycle: Creation, Bullion Inwarding & HUID Hallmarking Advancement", () => {
    const karigars = getSavedKarigars(tenantId);
    const artisan = karigars[1]; // Bhanwar Lal Soni

    const jcInput: CreateJobCardInput = {
      karigarId: artisan.id,
      karigarName: artisan.name,
      customerName: "Mrs. Pushpa Jain",
      customerPhone: "+91 94140 33221",
      category: "Kundan Meena",
      title: "Jaipuri Navratan Jadau Haar",
      description: "Traditional 9-gem pendant necklace with red/green reverse meena",
      metal: "gold",
      targetGrossWeight: 65.0,
      targetNetWeight: 52.0,
      purity: "22K (916)",
      issuedFineWeightGrams: 50.0,
      expectedDeliveryDate: "2026-12-10",
      labourRate: 28000,
      labourType: "fixed",
      allowedWastagePercent: 1.8,
      notes: "Wedding date 15th Dec. Pure 24K gold leaf ghatai required.",
    };

    const newJobCard = createJobCard(jcInput, tenantId);
    assert.ok(newJobCard.id.startsWith("jc-"));
    assert.ok(newJobCard.jobCardNumber.startsWith("JC-2026-"));
    assert.strictEqual(newJobCard.status, "created");

    // Advance to in_production
    const inProd = updateJobCardStatus(newJobCard.id, "in_production", undefined, tenantId);
    assert.strictEqual(inProd?.status, "in_production");

    // Advance to BIS Hallmarking with HUID
    const completed = updateJobCardStatus(newJobCard.id, "completed", "HM916JADAU", tenantId);
    assert.strictEqual(completed?.status, "completed");
    assert.strictEqual(completed?.huid, "HM916JADAU");
    assert.ok(completed?.completedAt);
  });

  test("WhatsApp Karigar Statement: Generates formatted Sarafa hisab statement", () => {
    const karigars = getSavedKarigars(tenantId);
    const artisan = karigars[0];
    const txns = getSavedKarigarTxns(tenantId).filter((t) => t.karigarId === artisan.id);

    const statement = generateKarigarWhatsAppText(artisan, "Sandhya Jewellers", txns);

    assert.ok(statement.includes("SANDHYA JEWELLERS"));
    assert.ok(statement.includes(artisan.name));
    assert.ok(statement.includes("CURRENT BULLION BALANCES"));
    assert.ok(statement.includes(`${artisan.pureGoldBalanceGrams.toFixed(3)} g`));
    assert.ok(statement.includes(`₹${artisan.labourBalanceDue.toLocaleString("en-IN")}`));
  });
});
