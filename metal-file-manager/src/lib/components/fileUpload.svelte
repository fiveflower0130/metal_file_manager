<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import type { Session } from '@supabase/supabase-js';
  import { createEventDispatcher } from 'svelte';

  export let session: Session;
  
  const dispatch = createEventDispatcher();

  let file: File | undefined;
  let uploading = false;
  let uploadProgress = 0;
  let message = '';
  let messageType: 'success' | 'error' = 'success';

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const selectedFile = target.files[0];

      if (selectedFile.size > MAX_FILE_SIZE) {
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
      
      // 保留「原始檔名」(用於資料庫)
      const originalFileName = file.name;
      // 建立「安全檔名」(用於儲存路徑)
      const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');  
      // 建立「安全路徑」
      const filePath = `${userId}/${sanitizedFileName}`;
      // 使用 Supabase Storage 上傳，並模擬進度
      const uploadPromise = supabase.storage
        .from('file_upload')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      // 模擬進度（根據檔案大小調整速度）
      const estimatedTime = Math.min(file.size / (1024 * 1024) * 500, 5000); // 每 MB 約 500ms，最多 5 秒
      const steps = 100;
      const interval = estimatedTime / steps;
      
      let progressInterval = setInterval(() => {
        if (uploadProgress < 90) {
          uploadProgress += 1;
        }
      }, interval);

      const { error: uploadError } = await uploadPromise;
      
      clearInterval(progressInterval);
      uploadProgress = 100;

      if (uploadError) {
        if (uploadError.message.includes('duplicate')) {
            throw new Error('該檔名已存在 (或清理後的檔名重複)。請更換檔名後重試。');
        }
        throw uploadError;
      }

      // 2. 取得「安全路徑」的公開 URL
      const { data: { publicUrl } } = supabase.storage
        .from('file_upload') //
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('無法取得檔案 URL。');
      }

      // 3. 將中繼資料寫入「資料庫」
      const { error: dbError } = await supabase
        .from('files') //
        .insert({
          file_name: originalFileName, //
          file_url: publicUrl,
          file_size: file.size,
          file_path: filePath,
          user_id: userId
        });

      if (dbError) {
        throw dbError;
      }

      message = '檔案上傳成功！';
      messageType = 'success';
      file = undefined;
      
      // 派發事件通知父元件刷新列表
      dispatch('uploadSuccess');
      
    } catch (error: any) {
      message = error.message || '上傳失敗。';
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
          class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
          style="width: {uploadProgress}%"
        ></div>
      </div>
      <span class="text-sm text-gray-600">上傳中... {Math.round(uploadProgress)}%</span>
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