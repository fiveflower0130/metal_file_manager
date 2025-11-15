<script lang="ts">
  import { supabase } from '$lib/supabaseClient'
  import { goto } from '$app/navigation'
  import type { PageData } from './$types'
  
  import FileUpload from '$lib/components/fileUpload.svelte';
  import FileList from '$lib/components/fileList.svelte';

  export let data: PageData
  $: session = data.session
  
  // 反應式檢查 session，如果沒有就導向登入頁
  $: if (typeof window !== 'undefined' && !session) {
    goto('/login')
  }

  const handleLogout = async () => {
    console.log('handleLogout called...');
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error logging out:', error.message);
      alert(error.message)
    } else {
      console.log('Supabase signOut successful.');
      // SIGNED_OUT 事件會由 +layout.svelte 處理並導向
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between rounded-lg bg-white p-4 shadow">
    <div>
      <h1 class="text-2xl font-bold">我的資料</h1>
      <p class="text-gray-600">歡迎, {session?.user?.email ?? '使用者'}</p>
    </div>
    <button 
      on:click={handleLogout}
      class="rounded-md bg-red-500 px-4 py-2 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      登出
    </button>
  </div>
  
  <!--需要 session 才顯示上傳元件-->
  {#if session}
    <FileUpload {session} />
    <FileList />
  {/if}
  
  <!--
  {#if session}
    <FileList />
  {/if}-->

</div>