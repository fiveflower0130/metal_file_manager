// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// 從 .env.local 讀取環境變數
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

// 檢查變數是否存在，如果 .env 設置錯誤，則在開發時提早報錯
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is missing. Check your .env.local file.")
}

// 建立並導出 Supabase client 實例
export const supabase = createClient(supabaseUrl, supabaseAnonKey)