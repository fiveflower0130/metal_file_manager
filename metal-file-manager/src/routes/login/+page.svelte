<script lang="ts">
  import { supabase } from '$lib/supabaseClient'
  
  let email = ''
  let password = ''
  let loading = false
  let message = ''

  const handleLogin = async () => {
    try {
      loading = true
      message = ''
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // 登入成功，不需要手動 goto
      // +layout.svelte 會偵測到 Auth 變化並觸發 +layout.ts 的守衛
    } catch (error: any) {
      message = error.message || "登入時發生錯誤"
    } finally {
      loading = false
    }
  }

  const handleSignUp = async () => {
    try {
      loading = true
      message = ''
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      message = '註冊成功！請檢查您的 Email 以進行驗證。'
    } catch (error: any) {
      message = error.message || "註冊時發生錯誤"
    } finally {
      loading = false
    }
  }
</script>

<div class="flex min-h-[80vh] items-center justify-center">
  <div class="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md">
    <h2 class="text-center text-3xl font-bold">登入檔案系統</h2>
    
    {#if message}
      <div 
        class="rounded-md p-3 text-center"
        class:bg-blue-100={message.includes('註冊成功')}
        class:text-blue-800={message.includes('註冊成功')}
        class:bg-red-100={!message.includes('註冊成功')}
        class:text-red-800={!message.includes('註冊成功')}
      >
        {message}
      </div>
    {/if}

    <form class="space-y-4" on:submit|preventDefault>
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">密碼</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="••••••••"
        />
      </div>
      
      <div class="flex flex-col space-y-2 pt-2">
        <button 
          on:click={handleLogin} 
          disabled={loading} 
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? '處理中...' : '登入'}
        </button>
        <button 
          on:click={handleSignUp} 
          disabled={loading} 
          class="w-full rounded-md bg-gray-600 px-4 py-2 text-white shadow-sm hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '處理中...' : '註冊'}
        </button>
      </div>
    </form>
  </div>
</div>