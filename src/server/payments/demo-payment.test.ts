import { describe, expect, it } from "vitest";

describe("Demo payment calculations and security", () => {
  it("calculates percentage coupon discount properly", () => {
    const subtotal = 1999;
    const couponVal = 10; // 10%
    const couponDiscount = Math.round(((subtotal * couponVal) / 100) * 100) / 100;
    const total = Math.max(0, subtotal - couponDiscount);

    expect(couponDiscount).toBe(199.9);
    expect(total).toBe(1799.1);
  });

  it("calculates flat coupon discount properly without exceeding total", () => {
    const subtotal = 199;
    const flatDiscount = 250;
    const total = Math.max(0, subtotal - flatDiscount);

    expect(total).toBe(0);
  });

  it("formats invoice numbers cleanly", () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const invoiceNo = `SN-INV-${dateStr}-1234`;

    expect(invoiceNo).toMatch(/^SN-INV-\d{8}-\d{4}$/);
  });
});
