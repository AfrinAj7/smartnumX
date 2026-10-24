import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const uploadTypes = {
  "image/jpeg": { extension: "jpg", maximumBytes: 8 * 1024 * 1024 },
  "image/png": { extension: "png", maximumBytes: 8 * 1024 * 1024 },
  "image/webp": { extension: "webp", maximumBytes: 8 * 1024 * 1024 },
  "image/avif": { extension: "avif", maximumBytes: 8 * 1024 * 1024 },
  "image/gif": { extension: "gif", maximumBytes: 8 * 1024 * 1024 },
  "video/mp4": { extension: "mp4", maximumBytes: 150 * 1024 * 1024 },
} as const;

export function normalizeContentType(val: unknown): string {
  if (typeof val !== "string") return "";
  const cleaned = val.trim().toLowerCase();
  if (cleaned === "image/jpg" || cleaned === "image/pjpeg") return "image/jpeg";
  return cleaned;
}

export const homepageUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(250),
  contentType: z.preprocess(
    normalizeContentType,
    z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "video/mp4"]),
  ),
  size: z.number().int().positive().max(150 * 1024 * 1024),
}).superRefine((input, context) => {
  const typeConfig = uploadTypes[input.contentType as keyof typeof uploadTypes];
  if (typeConfig && input.size > typeConfig.maximumBytes) {
    context.addIssue({ code: "custom", path: ["size"], message: "This file is larger than the limit for its type." });
  }
});

let s3Client: S3Client | undefined;

export function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
    process.env.S3_REGION &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY,
  );
}

function getS3Client() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Media storage is not configured.");
  }

  s3Client ??= new S3Client({
    region,
    ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client: s3Client, bucket, region };
}

function getPublicBaseUrl(bucket: string, region: string) {
  const configuredUrl = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
  if (configuredUrl) return configuredUrl;
  if (process.env.S3_ENDPOINT) throw new Error("Set S3_PUBLIC_URL for the configured S3-compatible endpoint.");
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export async function createHomepageMediaUpload(input: unknown) {
  const data = homepageUploadSchema.parse(input);
  const { client, bucket, region } = getS3Client();
  const extension = uploadTypes[data.contentType as keyof typeof uploadTypes].extension;
  const objectKey = `homepage/${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: data.contentType,
    ContentLength: data.size,
    CacheControl: "public, max-age=31536000, immutable",
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return {
    uploadUrl,
    mediaUrl: `${getPublicBaseUrl(bucket, region)}/${objectKey}`,
    objectKey,
    expiresIn: 300,
    requiredHeaders: { "Content-Type": data.contentType },
  };
}

export async function uploadDirectMedia(buffer: Buffer, originalName: string, rawContentType: string) {
  const normType = normalizeContentType(rawContentType) as keyof typeof uploadTypes;
  homepageUploadSchema.parse({
    fileName: originalName,
    contentType: rawContentType,
    size: buffer.length,
  });

  const extension = uploadTypes[normType]?.extension || "jpg";
  const uniqueName = `media-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

  // If S3 is configured, upload directly to S3
  if (hasS3Config()) {
    const { client, bucket, region } = getS3Client();
    const objectKey = `homepage/${uniqueName}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: normType,
      ContentLength: buffer.length,
      Body: buffer,
      CacheControl: "public, max-age=31536000, immutable",
    });
    await client.send(command);
    return {
      mediaUrl: `${getPublicBaseUrl(bucket, region)}/${objectKey}`,
      objectKey,
    };
  }

  // Fallback to local storage in public/uploads/
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, uniqueName), buffer);
  return {
    mediaUrl: `/uploads/${uniqueName}`,
    objectKey: uniqueName,
  };
}