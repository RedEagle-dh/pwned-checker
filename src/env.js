import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // API keys are now optional - stored encrypted in database
    HIBP_API_KEY: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    NOTIFICATION_EMAIL: z.string().email().optional(),
    // Required for encrypting API keys in database (32-byte key as hex or base64)
    ENCRYPTION_KEY: z.string().min(32),
  },

  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    HIBP_API_KEY: process.env.HIBP_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
