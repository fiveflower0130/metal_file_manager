<script lang="ts">
  import { supabase } from '$lib/supabaseClient'
  import type { PageData } from './$types'

  // 從 +layout.ts 繼承 session 資料
  export let data: PageData
  $: session = data.session

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error.message); // <-- 2. 檢查登出錯誤
      alert(error.message)
    } else {
      console.log('Supabase signOut successful.'); // <-- 3. 檢查登出成功
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