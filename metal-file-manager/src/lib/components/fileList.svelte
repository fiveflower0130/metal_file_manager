<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount, tick } from 'svelte';

  // 定義檔案資料的 TypeScript 類型
  type FileEntry = {
    id: string;
    created_at: string;
    file_name: string; //
    file_url: string;  //
    file_size: number; //
    file_path: string; //
  };

  let files: FileEntry[] = [];
  let loading = true;
  let message = '';
  let editingId: string | null = null;
  let editingName = '';

  // 載入檔案列表
  const fetchFiles = async () => {
    try {
      loading = true;
      message = '';

      // 從 'files' 資料表 讀取資料
      const { data, error } = await supabase
        .from('files') //
        .select('*')
        .order('created_at', { ascending: false }); // 依照建立時間排序

      if (error) throw error;

      if (data) {
        files = data;
      }

    } catch (error: any) {
      message = `讀取檔案失敗: ${error.message}`;
    } finally {
      loading = false;
    }
  };

  // 刪除檔案
  const deleteFile = async (file: FileEntry) => {
    // 彈出確認視窗
    if (!confirm(`您確定要刪除 "${file.file_name}" 嗎？此操作無法復原。`)) {
      return;
    }

    try {
      // 從「儲存桶」刪除檔案本體
      const { error: storageError } = await supabase.storage
        .from('file_upload') //
        .remove([file.file_path]); //

      if (storageError) throw storageError;

      // 從「資料庫」刪除中繼資料
      const { error: dbError } = await supabase
        .from('files') //
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      // 從 UI 列表中移除該檔案
      files = files.filter(f => f.id !== file.id);
      message = `"${file.file_name}" 已成功刪除。`;

    } catch (error: any) {
      message = `刪除失敗: ${error.message}`;
    }
  };

  // --- 開始編輯 ---
  const startEditing = async (file: FileEntry) => {
    editingId = file.id;
    editingName = file.file_name;
    
    // 等待 DOM 更新 (顯示輸入框)
    await tick(); 
    
    const input = document.getElementById(`edit-${file.id}`) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  };

  // --- 取消編輯 ---
  const cancelEditing = () => {
    editingId = null;
    editingName = '';
  };

  // --- 儲存編輯 ---
  const saveEditing = async (file: FileEntry) => {
    if (!editingId || editingName.trim() === '') {
      cancelEditing();
      return;
    }
    
    const newName = editingName.trim();
    const oldName = file.file_name;

    if (newName === oldName) {
      cancelEditing();
      return;
    }

    try {
      // 更新資料庫 'files' 表中的 'file_name'
      const { data, error } = await supabase
        .from('files') 
        .update({ file_name: newName })
        .eq('id', file.id)
        .select(); // 要求 Supabase 回傳更新後的那一筆資料

      if (error) throw error;
      // 更新 UI (無需重新整理)
      if (data && data.length > 0) {
        // 在 files 陣列中找到並更新該筆資料
        const index = files.findIndex(f => f.id === file.id);
        if (index !== -1) {
          files[index] = data[0] as FileEntry;
        }
      }   
      message = '檔名更新成功！';

    } catch (error: any) {
      message = `更新失敗: ${error.message}`;
    } finally {
      // 結束編輯模式
      cancelEditing();
    }
  };

  const handleKeydown = (event: KeyboardEvent, file: FileEntry) => {
    if (event.key === 'Escape') {
      cancelEditing();
    } else if (event.key === 'Enter') {
      saveEditing(file);
    }
  };

  // 檢查是否為圖片 (用於縮圖)
  const isImage = (fileName: string) => {
    return /\.(jpe?g|png|gif|webp)$/i.test(fileName);
  };

  // 格式化檔案大小
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // 在元件載入時，執行 fetchFiles
  onMount(() => {
    fetchFiles();
  });
</script>

<div class="w-full rounded-lg bg-white p-6 shadow">
  <h2 class="text-xl font-semibold mb-4">檔案列表</h2>

  {#if message}
    <!--<div class="rounded-md p-3 mb-4 text-center bg-red-100 text-red-800">-->
    <div 
      class="rounded-md p-3 mb-4 text-center"
      class:bg-green-100={message.includes('成功')}
      class:text-green-800={message.includes('成功')}
      class:bg-red-100={!message.includes('成功')}
      class:text-red-800={!message.includes('成功')}
    >
      {message}
    </div>
  {/if}

  {#if loading}
    <p class="text-gray-500">正在載入檔案...</p>
  {:else if files.length === 0}
    <p class="text-gray-500">您尚未上傳任何檔案。</p>
  {:else}
    <ul class="space-y-4">
      {#each files as file (file.id)}
        <li class="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50">
          <div class="flex items-center space-x-3">
            {#if isImage(file.file_name)}
              <img 
                src={file.file_url} 
                alt="縮圖" 
                class="h-12 w-12 rounded-md object-cover"
              />
            {:else}
              <div class="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              </div>
            {/if}

            <div>
              {#if editingId === file.id}
                <input
                  type="text"
                  id={`edit-${file.id}`}
                  bind:value={editingName}
                  on:keydown={(e) => handleKeydown(e, file)}
                  on:blur={() => saveEditing(file)}
                  class="text-sm font-medium text-gray-900 border-indigo-500 rounded-md shadow-sm"
                />
              {:else}
                <p 
                  class="text-sm font-medium text-gray-900 truncate max-w-xs" 
                  title={file.file_name}
                >
                  {file.file_name}
                </p>
              {/if}

              <p class="text-xs text-gray-500">
                {formatBytes(file.file_size)}
              </p>
            </div>
          </div>

          <div class="flex space-x-2">
            {#if editingId !== file.id}
              <button 
                on:click={() => startEditing(file)}
                title="編輯檔名"
                class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
              </button>
            {/if}

            <a 
              href={file.file_url} 
              download={file.file_name}
              title="下載"
              class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>

            <button 
              on:click={() => deleteFile(file)}
              title="刪除"
              class="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>