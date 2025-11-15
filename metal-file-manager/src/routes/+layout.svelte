<script lang="ts">
  import { invalidate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabaseClient'
  
  import '../app.css';

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log('Auth event:', event);
      
      // 當 auth 狀態改變時，重新載入 session
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        invalidate('supabase:auth')
      }
    })

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