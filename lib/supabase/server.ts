/**
 * Supabase server client — use in Server Components, Server Actions, and Route Handlers.
 *
 * - createClient()       → uses anon key + cookies (respects RLS)
 * - createServiceClient() → uses service-role key (bypasses RLS — only in Server Actions)
 */
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/** Anon client that reads/writes cookies for session management. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // Middleware handles the actual session refresh, so this is safe to ignore.
          }
        },
      },
    },
  )
}

/**
 * Service-role client — bypasses RLS.
 * Use ONLY inside Server Actions (`'use server'`) when you need admin-level writes.
 * Never expose this client to the browser.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
