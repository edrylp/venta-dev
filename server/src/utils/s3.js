import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

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
