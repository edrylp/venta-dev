import vine from "@vinejs/vine";

const objectId = () => vine.string().regex(/^[a-f\d]{24}$/i);
const idParam = (name) => vine.create({ [name]: objectId() });

export const idParamValidator = idParam("id");
export const listingIdParamValidator = idParam("listingId");
export const conversationIdParamValidator = idParam("conversationId");
