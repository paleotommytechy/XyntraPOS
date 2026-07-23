import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  VITE_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),
  MODE: z.string().default('development'),
  DEV: z.boolean().default(true),
  PROD: z.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

function parseEnv(): Env {
  const envValues = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };

  const parsed = envSchema.safeParse(envValues);

  if (!parsed.success) {
    console.error('❌ Environment validation failure:', parsed.error.format());
    // Return fallback in non-production to allow dev server start gracefully
    return {
      VITE_SUPABASE_URL: envValues.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: envValues.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      VITE_PAYSTACK_PUBLIC_KEY: envValues.VITE_PAYSTACK_PUBLIC_KEY,
      VITE_SENTRY_DSN: envValues.VITE_SENTRY_DSN,
      MODE: envValues.MODE || 'development',
      DEV: envValues.DEV ?? true,
      PROD: envValues.PROD ?? false,
    };
  }

  return parsed.data;
}

export const env = parseEnv();
