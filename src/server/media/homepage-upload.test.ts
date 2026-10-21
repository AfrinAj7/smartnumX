import { describe, expect, it } from "vitest";
import { homepageUploadSchema } from "./homepage-upload";

describe("homepage media upload validation", () => {
  it("accepts supported image and video file sizes", () => {
    expect(homepageUploadSchema.safeParse({ fileName: "hero.webp", contentType: "image/webp", size: 1024 }).success).toBe(true);
    expect(homepageUploadSchema.safeParse({ fileName: "demo.mp4", contentType: "video/mp4", size: 100 * 1024 * 1024 }).success).toBe(true);
  });

  it("rejects unsupported file types and files over type-specific limits", () => {
    expect(homepageUploadSchema.safeParse({ fileName: "script.svg", contentType: "image/svg+xml", size: 1024 }).success).toBe(false);
    expect(homepageUploadSchema.safeParse({ fileName: "large.png", contentType: "image/png", size: 9 * 1024 * 1024 }).success).toBe(false);
  });
});