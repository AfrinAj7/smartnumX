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

  it("filters coupon applicability by product type", () => {
    const items = [
      { id: "1", productType: "COURSE", finalPrice: 2000 },
      { id: "2", productType: "TEST_SERIES", finalPrice: 999 },
    ];

    const testSeriesOnlyCoupon = {
      applicableTypes: ["TEST_SERIES"],
      type: "PERCENT",
      value: 20, // 20%
    };

    const eligibleItems = items.filter((item) =>
      testSeriesOnlyCoupon.applicableTypes.includes(item.productType)
    );
    const eligibleAmount = eligibleItems.reduce((acc, curr) => acc + curr.finalPrice, 0);
    const discount = Math.round(((eligibleAmount * testSeriesOnlyCoupon.value) / 100) * 100) / 100;

    expect(eligibleItems.length).toBe(1);
    expect(eligibleAmount).toBe(999);
    expect(discount).toBe(199.8);
  });

  it("identifies sold-out physical coaching batches", () => {
    const physicalItem = {
      title: "Class 10 Board Physical",
      mode: "PHYSICAL",
      seatsLeft: 0,
    };

    const isSoldOut =
      physicalItem.mode === "PHYSICAL" &&
      physicalItem.seatsLeft !== null &&
      physicalItem.seatsLeft <= 0;

    expect(isSoldOut).toBe(true);
  });
});
