import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Cliente Supabase para uso no browser (client components).
 * Singleton pattern para evitar múltiplas instâncias.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Instância singleton para uso direto
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
