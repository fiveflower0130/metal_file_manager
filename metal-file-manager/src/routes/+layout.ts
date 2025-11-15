// src/routes/+layout.ts
import type { LayoutLoad } from './$types'
import { supabase } from '$lib/supabaseClient'

export const load: LayoutLoad = async ({ depends }) => {
  depends('supabase:auth')

  const { data: { session } } = await supabase.auth.getSession()

  // 不做任何 redirect，只回傳 session
  return { session }
}