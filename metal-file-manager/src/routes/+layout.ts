// src/routes/+layout.ts
import type { LayoutLoad } from './$types'
import { supabase } from '$lib/supabaseClient'
import { redirect } from '@sveltejs/kit' // <-- 1. 匯入 redirect

export const load: LayoutLoad = async ({ depends, url }) => {
  /**
   * depends() 告訴 SvelteKit，此 load 函式依賴於 'supabase:auth'
   * 當我們稍後在 +layout.svelte 中呼叫 invalidate('supabase:auth') 時，
   * SvelteKit 會知道需要重新運行此 load 函式來獲取最新的 session。
   */
  depends('supabase:auth')

  // 從 Supabase 獲取當前的 session
  const { data: { session } } = await supabase.auth.getSession()

  // --- 2. 這是新的「Auth 守衛」邏輯 ---
  const pathname = url.pathname
  
  // 如果使用者未登入，且他們不在 /login 頁面
  if (!session && pathname !== '/login') {
    // 拋出 303 導向，將他們踢回登入頁
    throw redirect(303, '/login')
  }
  
  // 如果使用者已登入，且他們又跑去 /login 頁面
  if (session && pathname === '/login') {
    // 將他們踢回主儀表板
    throw redirect(303, '/')
  }
  // --- Auth 守衛結束 ---
  
  return { session }
}