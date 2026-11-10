import vine from "@vinejs/vine";

export const registerValidator = vine.create({
    username: vine.string().trim().minLength(4).maxLength(15).regex(/^[a-z0-9_]+$/),
    email: vine.string().trim().email(),
    password: vine.string().minLength(8).maxLength(72),
});