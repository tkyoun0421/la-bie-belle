import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("la-bie-belle"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional()
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional()
});

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}

export function getServerEnv() {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  });
}
