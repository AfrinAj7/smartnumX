import { describe, expect, it } from "vitest";
import { courseSchema } from "./course-service";

describe("Course validation schema", () => {
  it("validates valid course inputs properly", () => {
    const valid = {
      title: "Class 10 Board Excellence",
      slug: "class-10-board-excellence",
      description: "Comprehensive mathematics tuition with NCERT and past paper drills.",
      price: 1999,
      discountPrice: 1499,
      validityDays: 365,
      status: "PUBLISHED",
    };

    const parsed = courseSchema.parse(valid);
    expect(parsed.title).toBe("Class 10 Board Excellence");
    expect(parsed.slug).toBe("class-10-board-excellence");
    expect(parsed.price).toBe(1999);
    expect(parsed.discountPrice).toBe(1499);
    expect(parsed.requireFullProgress).toBe(true);
  });

  it("rejects invalid slugs with uppercase or special characters", () => {
    const invalid = {
      title: "Class 10 Board Excellence",
      slug: "Class_10_Board!",
      description: "Comprehensive mathematics tuition with NCERT and past paper drills.",
      price: 1999,
    };

    expect(() => courseSchema.parse(invalid)).toThrow();
  });

  it("rejects negative prices", () => {
    const invalid = {
      title: "Class 10 Board Excellence",
      slug: "class-10-board-excellence",
      description: "Comprehensive mathematics tuition with NCERT and past paper drills.",
      price: -100,
    };

    expect(() => courseSchema.parse(invalid)).toThrow();
  });

  it("rejects short titles or descriptions", () => {
    const invalid = {
      title: "Cl",
      slug: "cl",
      description: "Short",
      price: 100,
    };

    expect(() => courseSchema.parse(invalid)).toThrow();
  });
});
