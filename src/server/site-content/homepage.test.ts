import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  homepageContentSchema,
  parseHomepageContent,
} from "./homepage";

describe("homepage content", () => {
  it("provides valid SmartNum defaults with the supplied contact details", () => {
    expect(homepageContentSchema.safeParse(DEFAULT_HOMEPAGE_CONTENT).success).toBe(true);
    expect(DEFAULT_HOMEPAGE_CONTENT.siteName).toBe("SmartNum");
    expect(DEFAULT_HOMEPAGE_CONTENT.contact.phone).toBe("+91 99589 47774");
  });

  it("falls back to safe defaults when stored content is malformed", () => {
    expect(parseHomepageContent({ siteName: "Other brand" })).toBe(DEFAULT_HOMEPAGE_CONTENT);
  });

  it("rejects unsafe media URL schemes and more than three hero slides", () => {
    const unsafe = {
      ...DEFAULT_HOMEPAGE_CONTENT,
      heroSlides: DEFAULT_HOMEPAGE_CONTENT.heroSlides.map((slide, index) => ({
        ...slide,
        imageUrl: index === 0 ? "javascript:alert(1)" : slide.imageUrl,
      })),
    };
    expect(homepageContentSchema.safeParse(unsafe).success).toBe(false);
    expect(homepageContentSchema.safeParse({
      ...DEFAULT_HOMEPAGE_CONTENT,
      heroSlides: [...DEFAULT_HOMEPAGE_CONTENT.heroSlides, DEFAULT_HOMEPAGE_CONTENT.heroSlides[0]],
    }).success).toBe(false);
  });

  it("validates faculty profiles with comprehensive credentials and auto-normalizes photo URLs", () => {
    const validWithFaculty = {
      ...DEFAULT_HOMEPAGE_CONTENT,
      faculty: [
        {
          name: "Dr. Sweta Agrawal",
          subject: "Mathematics & Statistics",
          qualification: "Ph.D. in Mathematics, Assistant Professor with extensive international research publications in statistics, reliability theory, and quality control",
          experience: "Over 12 years of impactful teaching and intellectual exploration across CBSE, ICSE, and IIT-JEE students",
          photoUrl: "images/editorial/Confident Mathematics Teacher Portrait.png",
          approved: true,
        },
      ],
    };
    const parsed = homepageContentSchema.safeParse(validWithFaculty);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.faculty[0].photoUrl).toBe("/images/editorial/Confident Mathematics Teacher Portrait.png");
    }
  });
});