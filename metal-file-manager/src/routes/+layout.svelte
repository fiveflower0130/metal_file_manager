<script lang="ts">
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabaseClient'
  import type { LayoutData } from './$types'
  import { goto } from '$app/navigation' // <-- 匯入 goto

  import '../app.css';

  export let data: LayoutData
  $: session = data.session

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      
      console.log('Auth state changed:', event); // <-- 除錯用

      // 1. 觸發 +layout.ts 重新運行
      invalidate('supabase:auth') 
      
      // 2.【客戶端守衛】(處理 Stale Session 和即時登出)
      // 如果事件是 SIGNED_OUT 或 newSession 變為 null，
      // 我們立即在「客戶端」觸發 goto 導向。
      if (event === 'SIGNED_OUT' || !newSession) {
        console.log('Detected SIGNED_OUT, forcing client-side redirect to /login');
        
        // 確保我們不會在 /login 頁面又把自己導向 /login (雖然 +layout.ts 應該會處理)
        if (window.location.pathname !== '/login') {
          goto('/login'); // <-- 強制客戶端導向
        }
      }
    })

    // 在元件卸載時取消訂閱
    return () => {
      subscription.unsubscribe()
    }
  })
</script>

<div class="min-h-screen bg-gray-50 text-gray-900">
  <main class="container mx-auto max-w-4xl p-4">
    <slot />
  </main>
</div>