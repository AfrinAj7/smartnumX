import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { z } from "zod";

const uploadTypes = {
  "image/jpeg": { extension: "jpg", maximumBytes: 8 * 1024 * 1024 },
  "image/png": { extension: "png", maximumBytes: 8 * 1024 * 1024 },
  "image/webp": { extension: "webp", maximumBytes: 8 * 1024 * 1024 },
  "image/avif": { extension: "avif", maximumBytes: 8 * 1024 * 1024 },
  "video/mp4": { extension: "mp4", maximumBytes: 150 * 1024 * 1024 },
} as const;

export const homepageUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4"]),
  size: z.number().int().positive().max(150 * 1024 * 1024),
}).superRefine((input, context) => {
  if (input.size > uploadTypes[input.contentType].maximumBytes) {
    context.addIssue({ code: "custom", path: ["size"], message: "This file is larger than the limit for its type." });
  }
});

let s3Client: S3Client | undefined;

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
  const extension = uploadTypes[data.contentType].extension;
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