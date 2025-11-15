<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import type { Session } from '@supabase/supabase-js';

  export let session: Session;

  let file: File | undefined;
  let uploading = false;
  let uploadProgress = 0; // pregress為0，並使用 CSS 動畫
  let message = '';
  let messageType: 'success' | 'error' = 'success';

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB 

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const selectedFile = target.files[0];

      if (selectedFile.size > MAX_FILE_SIZE) { // 
        message = '檔案大小超過 50MB 限制。';
        messageType = 'error';
        file = undefined;
        (e.target as HTMLInputElement).value = '';
        return;
      }
      
      file = selectedFile;
      message = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      message = '請先選擇一個檔案。';
      messageType = 'error';
      return;
    }

    if (!session.user) {
       message = '無法驗證使用者，請重新登入。';
       messageType = 'error';
       return;
    }

    try {
      uploading = true;
      message = '';
      uploadProgress = 0;
      const userId = session.user.id;
      
      // 1. 上傳檔案到「儲存桶」
      const filePath = `${userId}/${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('file_upload') //
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // false = 不允許覆蓋同名檔案
        });

      if (uploadError) {
        if (uploadError.message.includes('duplicate')) {
            throw new Error('該檔名已存在。請更換檔名後重試。');
        }
        throw uploadError;
      }

      // 2. 取得檔案的公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('file_upload') //
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('無法取得檔案 URL。');
      }

      // 3. 將中繼資料寫入「資料庫」
      const { error: dbError } = await supabase
        .from('files') //
        .insert({ // [cite: 16]
          file_name: file.name, // [cite: 16]
          file_url: publicUrl, // [cite: 16]
          file_size: file.size, // [cite: 16]
          user_id: userId
          // upload_timestamp 欄位 [cite: 16] 是由 'created_at' 欄位自動處理的
        });

      if (dbError) {
        throw dbError;
      }

      message = '檔案上傳成功！';
      messageType = 'success';
      file = undefined;
      
    } catch (error: any) {
      if (error.message.includes('Invalid key')) {
         message = '上傳失敗：檔名可能包含無效字元 (例如 /)。請更換檔名後重試。';
      } else {
         message = error.message || '上傳失敗。';
      }
      messageType = 'error';
    } finally {
      uploading = false;
    }
  };
</script>

<div class="w-full rounded-lg bg-white p-6 shadow">
  <h2 class="text-xl font-semibold mb-4">檔案上傳區</h2>
  
  {#if message}
    <div 
      class="rounded-md p-3 mb-4 text-center"
      class:bg-green-100={messageType === 'success'}
      class:text-green-800={messageType === 'success'}
      class:bg-red-100={messageType === 'error'}
      class:text-red-800={messageType === 'error'}
    >
      {message}
    </div>
  {/if}

  <form class="space-y-4" on:submit|preventDefault={handleUpload}>
    <div>
      <label for="file-upload" class="block text-sm font-medium text-gray-700">選擇檔案 (上限 50MB)</label>
      <input
        id="file-upload"
        type="file"
        on:change={handleFileSelect}
        disabled={uploading}
        required
        class="mt-1 block w-full text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0
               file:bg-indigo-100 file:text-indigo-700
               hover:file:bg-indigo-200"
      />
    </div>

    {#if uploading}
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          class="bg-indigo-600 h-2.5 rounded-full animate-pulse" 
          style="width: 100%"
        ></div>
      </div>
      <span class="text-sm text-gray-600">上傳中，請稍候...</span>
    {/if}

    <button 
      type="submit"
      disabled={uploading || !file} 
      class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white shadow-sm
             hover:bg-indigo-700 
             disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {uploading ? '上傳中...' : '開始上傳'}
    </button>
  </form>
</div>