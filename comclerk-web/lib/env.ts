import { z } from 'zod'

const envSchema = z.object({
  OPENCODE_API_URL: z.string().url().default('http://localhost:4096'),
  NEXT_PUBLIC_OPENCODE_API_URL: z.string().url().default('http://localhost:4096'),
  PROJECT_DIR: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables at build time
function getEnv(): Env {
  const parsed = envSchema.safeParse({
    OPENCODE_API_URL: process.env.OPENCODE_API_URL,
    NEXT_PUBLIC_OPENCODE_API_URL: process.env.NEXT_PUBLIC_OPENCODE_API_URL,
    PROJECT_DIR: process.env.PROJECT_DIR,
  })

  if (!parsed.success) {
    console.warn('Environment validation warning:', parsed.error.flatten().fieldErrors)
    return envSchema.parse({}) // Return defaults
  }

  return parsed.data
}

export const env = getEnv()
