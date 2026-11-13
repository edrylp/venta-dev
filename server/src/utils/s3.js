import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

export const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per photo
export const MAX_FILES = 10; // 10 photos limit for upload
const URL_TTL_SECONDS = 300; // presigned URL valid only for 5 minutes

let client;
const getClient = () =>
  (client ??= new S3Client({ region: process.env.AWS_REGION }));

export const keyPrefix = (userId) => `listings/${userId}/`;

export const hasValidUserKeys = (userId, keys) =>
  Array.isArray(keys) &&
  keys.every(
    (key) =>
      typeof key === "string" &&
      key.startsWith(keyPrefix(userId)) &&
      !key.includes(".."),
  );

export const createUploadUrl = async ({ userId, contentType, size }) => {
  const key = `${keyPrefix(userId)}${randomUUID()}.${ALLOWED_TYPES[contentType]}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(getClient(), command, {
    expiresIn: URL_TTL_SECONDS,
  });

  return { key, uploadUrl };
};
