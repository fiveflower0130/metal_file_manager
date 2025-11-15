<!-- <h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p> -->

<script lang="ts">
  import { supabase } from '$lib/supabaseClient'
  import type { PageData } from './$types'

  export let data: PageData
  $: session = data.session

  const handleLogout = async () => {
    console.log('handleLogout called...'); // <-- 除錯用
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error logging out:', error.message);
      alert(error.message)
    } else {
      console.log('Supabase signOut successful.');
      // 登出成功，不需要手動 goto
      // +layout.svelte 的 onAuthStateChange 會自動偵測到
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between rounded-lg bg-white p-4 shadow">
    <div>
      <h1 class="text-2xl font-bold">我的檔案</h1>
      <p class="text-gray-600">歡迎, {session?.user?.email ?? '使用者'}</p>
    </div>
    <button 
      on:click={handleLogout}
      class="rounded-md bg-red-500 px-4 py-2 text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      登出
    </button>
  </div>
  
  <div class="rounded-lg bg-white p-6 shadow">
    <h2 class="text-xl font-semibold">檔案上傳區 (即將推出)</h2>
  </div>
  <div class="rounded-lg bg-white p-6 shadow">
    <h2 class="text-xl font-semibold">檔案列表 (即將推出)</h2>
  </div>

</div>