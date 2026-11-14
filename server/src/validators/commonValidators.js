import vine from "@vinejs/vine";

const objectId = () => vine.string().regex(/^[a-f\d]{24}$/i);

export const idParamValidator = vine.create({
  id: objectId(),
});