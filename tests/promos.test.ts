import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validatePromoCode } from "../src/lib/promo/service";
import prisma from "../src/lib/prisma";

describe("JewelBill Promo Code & Discount Engine Tests", () => {
  it("successfully validates 20% discount code WELCOME2026 for Starter plan", async () => {
    const res = await validatePromoCode("WELCOME2026", "starter", 19990, prisma);

    assert.equal(res.valid, true);
    assert.equal(res.code, "WELCOME2026");
    assert.equal(res.discountType, "PERCENTAGE");
    assert.equal(res.discountValue, 20);
    // 20% of 19990 is 3998, but capped at maxDiscount 2000
    assert.equal(res.discountAmount, 2000);
    assert.equal(res.finalPrice, 17990);
  });

  it("successfully validates flat discount code SARAFABAZAR for Growth plan", async () => {
    const res = await validatePromoCode("SARAFABAZAR", "growth", 4999, prisma);

    assert.equal(res.valid, true);
    assert.equal(res.code, "SARAFABAZAR");
    assert.equal(res.discountType, "FLAT");
    assert.equal(res.discountValue, 1500);
    assert.equal(res.discountAmount, 1500);
    assert.equal(res.finalPrice, 3499);
  });

  it("handles case-insensitivity and whitespace stripping", async () => {
    const res = await validatePromoCode("  welcome2026  ", "growth", 4999, prisma);

    assert.equal(res.valid, true);
    assert.equal(res.code, "WELCOME2026");
    // 20% of 4999 = 999.8, under 2000 cap
    assert.equal(res.discountAmount, 999.8);
    assert.equal(res.finalPrice, 3999.2);
  });

  it("rejects non-existent promo code", async () => {
    const res = await validatePromoCode("FAKECODE99", "growth", 4999, prisma);

    assert.equal(res.valid, false);
    assert.match(res.error || "", /does not exist/i);
  });

  it("rejects promo code when order is below minOrderValue", async () => {
    // SARAFABAZAR has minOrderValue 3500
    const res = await validatePromoCode("SARAFABAZAR", "growth", 1000, prisma);

    assert.equal(res.valid, false);
    assert.match(res.error || "", /Minimum order value/i);
  });

  it("validates 100% off pilot code LAUNCH100", async () => {
    const res = await validatePromoCode("LAUNCH100", "starter", 1999, prisma);

    assert.equal(res.valid, true);
    assert.equal(res.discountAmount, 1999);
    assert.equal(res.finalPrice, 0);
  });
});
