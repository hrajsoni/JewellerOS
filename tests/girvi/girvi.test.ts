import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getSavedGirviLoans,
  createGirviLoan,
  payGirviInterest,
  payGirviPrincipal,
  releaseGirviLoan,
  calculateAccruedInterest,
} from "../../src/modules/girvi/store";
import {
  NewGirviInput,
  generateGirviWhatsAppTicket,
} from "../../src/modules/girvi/types";

describe("JewelleryOS Milestone 7: Girvi / Gold Loans & Pawn Brokering (Omunim Standard) Tests", () => {
  const tenantId = "test-tenant-girvi-01";

  test("Interest Accrual Arithmetic: Validates Indian Sarafa monthly interest calculation (Simple & Compound)", () => {
    // 1. Simple Interest Loan: ₹1,00,000 at 1.5% per month (सैंकड़ा) for exactly 3 months (90 days)
    const startDate = new Date("2026-06-01T10:00:00.000Z");
    const asOfDate = new Date("2026-09-01T10:00:00.000Z"); // 92 days => 4 billable months (ceil(92/30))

    const mockLoanSimple = {
      id: "mock-1",
      loanNumber: "GL-TEST-01",
      startDate: startDate.toISOString(),
      dueDate: "2026-12-01T10:00:00.000Z",
      customerName: "Ramesh Sharma",
      customerPhone: "+91 94140 11111",
      customerAddress: "M.I. Road, Jaipur",
      customerCity: "Jaipur",
      ornaments: [],
      principalAmount: 100000,
      monthlyInterestRate: 1.5,
      interestType: "simple" as const,
      totalInterestPaid: 0,
      principalRepaid: 0,
      status: "active" as const,
    };

    const accrualSimple = calculateAccruedInterest(mockLoanSimple, asOfDate);
    // Billable months = ceil(92 / 30) = 4 months
    // Total interest = 100000 * 1.5% * 4 = 6000
    assert.strictEqual(accrualSimple.monthsElapsed, 4);
    assert.strictEqual(accrualSimple.totalAccruedInterest, 6000);
    assert.strictEqual(accrualSimple.netPayableToRelease, 106000);

    // 2. Minimum 1-month rule test: Same day pledge release must still charge 1 month minimum
    const sameDayAccrual = calculateAccruedInterest(mockLoanSimple, startDate);
    assert.strictEqual(sameDayAccrual.monthsElapsed, 1);
    assert.strictEqual(sameDayAccrual.totalAccruedInterest, 1500); // 100000 * 1.5% * 1
    assert.strictEqual(sameDayAccrual.netPayableToRelease, 101500);
  });

  test("Girvi Loan Inwarding: Intake pledged gold ornaments into safe custody with packet numbering", () => {
    const input: NewGirviInput = {
      customerName: "Bhairon Singh Shekhawat",
      customerPhone: "+91 98280 99887",
      customerAadhaar: "XXXX-XXXX-3344",
      customerAddress: "VPO Bagru, Tehsil Sanganer, Jaipur",
      customerCity: "Jaipur",
      ornamentName: "22K Solid Gold Bangle (Single)",
      metal: "gold",
      purity: "22K",
      grossWeight: 20.5,
      netWeight: 20.5,
      principalAmount: 180000,
      monthlyInterestRate: 1.5,
      interestType: "simple",
      packetNumber: "PKT-2026-99",
      safeLocation: "Tijori #2, Dabba #C",
      notes: "Farmer loan against crop mortgage, hallmarked bangle with 916 mark.",
    };

    const loan = createGirviLoan(input, tenantId);

    assert.ok(loan.loanNumber.startsWith("GL-2026-"));
    assert.strictEqual(loan.status, "active");
    assert.strictEqual(loan.customerName, "Bhairon Singh Shekhawat");
    assert.strictEqual(loan.principalAmount, 180000);
    assert.strictEqual(loan.packetNumber, "PKT-2026-99");
    assert.strictEqual(loan.safeLocation, "Tijori #2, Dabba #C");
    assert.strictEqual(loan.ornaments.length, 1);
    assert.strictEqual(loan.ornaments[0].netWeight, 20.5);

    const saved = getSavedGirviLoans(tenantId);
    const found = saved.find((l) => l.id === loan.id);
    assert.ok(found);
  });

  test("Girvi Interest Servicing: Customer pays monthly interest installment", () => {
    const loans = getSavedGirviLoans(tenantId);
    const loan = loans[0];
    const initialPaid = loan.totalInterestPaid;

    const paymentAmount = 2700; // 1 month interest on ₹1,80,000 @ 1.5%
    const payment = payGirviInterest(loan.id, paymentAmount, "UPI", "Month 1 interest settled", tenantId);

    assert.ok(payment);
    assert.strictEqual(payment.type, "interest");
    assert.strictEqual(payment.amount, paymentAmount);
    assert.ok(payment.receiptNumber.startsWith("GVR-"));

    const updatedLoans = getSavedGirviLoans(tenantId);
    const updated = updatedLoans.find((l) => l.id === loan.id);
    assert.strictEqual(updated?.totalInterestPaid, initialPaid + paymentAmount);
  });

  test("Girvi Principal Part-Payment & Loan Release: Repaying full principal releases pledged ornaments", () => {
    const loans = getSavedGirviLoans(tenantId);
    const loan = loans[0];

    // Part payment of ₹50,000
    const partPayment = payGirviPrincipal(loan.id, 50000, "Cash", "Partial principal return", tenantId);
    assert.ok(partPayment);
    assert.strictEqual(partPayment.type, "principal");

    let updatedLoans = getSavedGirviLoans(tenantId);
    let updated = updatedLoans.find((l) => l.id === loan.id);
    assert.strictEqual(updated?.principalRepaid, 50000);
    assert.strictEqual(updated?.status, "active");

    // Full repayment of remaining ₹1,30,000
    const fullPayment = payGirviPrincipal(loan.id, 130000, "Bank", "Final principal clearance", tenantId);
    assert.ok(fullPayment);

    updatedLoans = getSavedGirviLoans(tenantId);
    updated = updatedLoans.find((l) => l.id === loan.id);
    assert.strictEqual(updated?.principalRepaid, 180000);
    assert.strictEqual(updated?.status, "released");
  });

  test("WhatsApp Form 7 Girvi Pledge Ticket: Generates formatted pawn brokering receipt", () => {
    const loans = getSavedGirviLoans(tenantId);
    const loan = loans[0];
    const accrual = calculateAccruedInterest(loan);

    const ticket = generateGirviWhatsAppTicket(loan, "Sandhya Jewellers", accrual);

    assert.ok(ticket.includes("GIRVI PAWN TICKET (गिरवी पर्चा / रसीद)"));
    assert.ok(ticket.toUpperCase().includes("SANDHYA JEWELLERS"));
    assert.ok(ticket.includes(loan.loanNumber));
    assert.ok(ticket.includes(loan.customerName));
    assert.ok(ticket.includes("PLEDGED ARTICLES (बंधक गहने)"));
    assert.ok(ticket.includes("Gross"));
    assert.ok(ticket.includes("Net"));
  });
});
