import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || supabaseKey)
