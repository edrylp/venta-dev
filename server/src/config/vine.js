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

        // presign uploads
        "files.minLength": "Add at least {{ min }} photo",
        "files.maxLength": "You can upload at most {{ max }} photos",
        "files.*.contentType.enum": "Only JPEG, PNG, or WebP photos are allowed",
        "files.*.size.max": "Each photo must be 5 MB or smaller",
        "files.*.size.min": "Photo cannot be empty",
        "files.*.size.withoutDecimals": "Photo size must be a whole number of bytes",
    },
    {
        currentPassword: "current password",
        newPassword: "new password",
        files: "photos",
    },
)