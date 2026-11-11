import vine from "@vinejs/vine";

export const registerValidator = vine.create({
    username: vine.string().trim().minLength(4).maxLength(15).regex(/^[a-z0-9_]+$/),
    email: vine.string().trim().toLowerCase().email(),
    password: vine.string().minLength(8).maxLength(72),
});

export const loginValidator = vine.create({
    email: vine.string().trim().toLowerCase().email(),
    password: vine.string(),
});

export const changePasswordValidator = vine.create({
    currentPassword: vine.string(),
    newPassword: vine.string().minLength(8).maxLength(72),
});