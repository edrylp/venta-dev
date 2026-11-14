import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      JWT_SECRET_KEY: "af27b243356ab160702c9e2c1af6d4291a2e7763ef6997a526a36b83556e2972",
      JWT_EXPIRES_IN: "1d",
      S3_PUBLIC_BASE_URL: "https://cdn.example.test",
    },
    testTimeout: 15000,
    hookTimeout: 60000, 
  },
});