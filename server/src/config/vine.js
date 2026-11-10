import vine, { SimpleMessagesProvider } from "@vinejs/vine";

vine.messagesProvider = new SimpleMessagesProvider(
    {
        // Applicable for all fields
        required: "The {{ field }} field is required",
        email: "The value is not a valid email address",

        // username
        "username.minLength": "Username must be at least 4 characters",
        "username.maxLength": "Username cannot exceed 15 characters",
        "username.regex": "Username may contain only lowercase letters, numbers, and underscores",

        // passwords
        "password.minLength": "Password must be at least 8 characters",
        "password.maxLength": "Password cannot exceed 72 characters",
        "newPassword.minLength": "New password must be at least 8 characters",
        "newPassword.maxLength": "New password cannot exceed 72 characters",

    },
    {
        currentPassword: "current password",
        newPassword: "new password",
    },
)