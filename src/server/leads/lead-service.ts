import { z } from "zod";
import type { PrismaClient } from "@prisma/client";

const utmSchema = z.record(z.string().max(100), z.string().max(500)).optional();

export const demoLeadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  studentName: z.string().trim().max(100).optional(),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/),
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email().max(254)]).optional(),
  studentClass: z.string().trim().min(1).max(80).default("Classes 9–12th"),
  board: z.string().trim().min(1).max(80).default("Any Board"),
  interest: z.string().trim().min(2).max(120).default("SmartNum assessment"),
  preferredTime: z.string().trim().max(80).optional(),
  message: z.string().trim().max(1000).optional(),
  acceptedConsent: z.literal(true).default(true),
  companyWebsite: z.string().max(0).optional(),
  source: z.string().trim().max(80).default("website-demo"),
  utm: utmSchema,
});

export async function createDemoLead(input: unknown, database: PrismaClient) {
  const data = demoLeadSchema.parse(input);

  return database.lead.create({
    data: {
      name: data.name,
      studentName: data.studentName || undefined,
      phone: data.phone,
      email: data.email || undefined,
      studentClass: data.studentClass,
      board: data.board,
      interest: data.interest,
      preferredTime: data.preferredTime,
      message: data.message || undefined,
      source: data.source,
      utm: data.utm ?? undefined,
      consentAt: new Date(),
      consentVersion: process.env.PRIVACY_POLICY_VERSION || "v1",
    },
    select: { id: true },
  });
}