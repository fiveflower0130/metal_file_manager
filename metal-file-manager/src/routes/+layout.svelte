<script lang="ts">
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabaseClient'
  import type { LayoutData } from './$types'
  
  // 導入 Tailwind CSS 的基礎樣式 (SvelteKit + Tailwind 會自動處理)
  import favicon from '$lib/assets/favicon.svg';
  import '../app.css';

  // 從 +layout.ts 接收 session 資料
  export let data: LayoutData
  
  // 建立一個響應式變數
  $: session = data.session

  onMount(() => {
    // 監聽 Supabase Auth 狀態的變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      
      // 檢查 session 是否真的改變了
      console.log('Auth state changed, invalidating session...');
      invalidate('supabase:auth')
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