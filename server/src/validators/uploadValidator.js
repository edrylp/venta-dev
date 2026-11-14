import "../config/vine.js";
import vine from "@vinejs/vine";
import { ALLOWED_TYPES, MAX_FILE_SIZE, MAX_FILES } from "../utils/s3.js";

export const presignValidator = vine.create({
  files: vine
    .array(
      vine.object({
        contentType: vine.enum(Object.keys(ALLOWED_TYPES)),
        size: vine.number().withoutDecimals().min(1).max(MAX_FILE_SIZE),
      }),
    )
    .minlength(1)
    .maxLength(MAX_FILES),
});
