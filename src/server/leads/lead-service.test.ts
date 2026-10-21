import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { createDemoLead } from "./lead-service";

function setup() {
  const create = vi.fn().mockResolvedValue({ id: "lead-1" });
  const database = { lead: { create } } as unknown as PrismaClient;
  return { create, database };
}

const validLead = {
  name: "Parent Example",
  studentName: "Student Example",
  phone: "+919876543210",
  email: "parent@example.com",
  studentClass: "Class 11",
  board: "CBSE",
  interest: "SmartNum assessment",
  preferredTime: "Evening",
  message: "Wants help with calculus.",
  acceptedConsent: true,
  companyWebsite: "",
  utm: { utm_source: "newsletter" },
};

describe("createDemoLead", () => {
  it("stores consent, source and campaign attribution with a valid lead", async () => {
    const context = setup();
    expect(await createDemoLead(validLead, context.database)).toEqual({ id: "lead-1" });
    expect(context.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: validLead.name,
        email: validLead.email,
        source: "website-demo",
        utm: validLead.utm,
        consentVersion: "v1",
        consentAt: expect.any(Date),
      }),
      select: { id: true },
    });
  });

  it("rejects missing consent before attempting a database write", async () => {
    const context = setup();
    await expect(
      createDemoLead({ ...validLead, acceptedConsent: false }, context.database),
    ).rejects.toThrow();
    expect(context.create).not.toHaveBeenCalled();
  });
});