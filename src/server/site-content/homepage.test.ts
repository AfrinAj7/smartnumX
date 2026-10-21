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
});