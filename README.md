# Metal File Manager

This is a Take-Home Assignment for MetAI by Fiveflower0130 (Dante Chen).  
A modern file management system built with SvelteKit and Supabase, featuring secure authentication, file upload/download, and real-time updates.

## Idea & Architecture Decision

關於這個專案的架構我當初構思的方向主要有兩個，一是"傳統全端架構"，二是"BaaS 整合架構"雖然作業允許使用 Python 後端，但我選擇了 **Supabase (BaaS) 架構**，原因如下：

- **開發效率**：在 4-6 小時的時限內最大化開發速度
- **一站式服務**：Supabase 整合了 Auth、PostgreSQL 資料庫和 S3 相容儲存
- **專注核心功能**：讓我能專注於前端開發，而非後端基礎建設

## Features

- 🔐 **User Authentication** - Secure login/signup with Supabase Auth
- 📤 **File Upload** - Upload files up to 50MB with progress tracking
- 📥 **File Download** - Download files with original filenames preserved
- ✏️ **File Management** - Rename and delete files with real-time UI updates
- 🖼️ **Image Preview** - Automatic thumbnail generation for image files
- 🔒 **Row Level Security** - User-specific file access control
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Setup & Local Run Instructions

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/fiveflower0130/metal_file_manager.git
cd metal-file-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

Create a `.env.local` file in the project root:

```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_project_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

Run the following SQL in your Supabase SQL Editor:

#### Create Files Table

```sql
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own files"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files"
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files"
  ON files FOR DELETE
  USING (auth.uid() = user_id);
```

#### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `file_upload`
3. Set it to **Public** bucket
4. Run the following RLS policies in SQL Editor:

```sql
-- Storage RLS Policies
CREATE POLICY "Allow authenticated user read access"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'file_upload'
  AND auth.role() = 'authenticated'
  AND name LIKE (auth.uid()::text || '/%')
);

CREATE POLICY "Allow authenticated user insert access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'file_upload'
  AND auth.role() = 'authenticated'
  AND name LIKE (auth.uid()::text || '/%')
);

CREATE POLICY "Allow authenticated user update access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'file_upload'
  AND auth.role() = 'authenticated'
  AND name LIKE (auth.uid()::text || '/%')
);

CREATE POLICY "Allow authenticated user delete access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'file_upload'
  AND auth.role() = 'authenticated'
  AND name LIKE (auth.uid()::text || '/%')
);
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 6. Build for Production

```bash
npm run build
npm run preview
```

## Architecture & Design Decisions

### Tech Stack

- **Frontend Framework**: SvelteKit 2.0
  - Chosen for its simplicity, performance, and excellent developer experience
  - Built-in routing and SSR capabilities
  
- **Backend & Database**: Supabase
  - PostgreSQL database with real-time capabilities
  - Built-in authentication system
  - Object storage for file management
  - Row Level Security (RLS) for data protection

- **Styling**: Tailwind CSS
  - Utility-first approach for rapid UI development
  - Highly customizable and responsive design

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│            SvelteKit Frontend               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │   File   │  │   File   │   │
│  │   Page   │  │  Upload  │  │   List   │   │
│  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────┘
                    ↓ ↑
         Supabase JavaScript Client
                    ↓ ↑
┌─────────────────────────────────────────────┐
│            Supabase Backend                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Postgres │  │ Storage  │   │
│  │          │  │    DB    │  │  Bucket  │   │
│  └──────────┘  └──────────┘  └──────────┘   │
│           Row Level Security (RLS)          │
└─────────────────────────────────────────────┘
```

### Key Design Decisions

#### 1. Authentication Flow
- Used SvelteKit's reactive statements (`$:`) for automatic route guards
- Auth state managed in `+layout.ts` with `depends('supabase:auth')`
- `onAuthStateChange` in `+layout.svelte` handles SIGNED_IN/SIGNED_OUT events
- Avoids infinite redirect loops by using `invalidate()` strategically

#### 2. File Naming Strategy
- **Original filename** preserved in database for display purposes
- **Sanitized filename** used in storage (removes special characters and Unicode)
- Prevents upload failures due to special characters or Chinese filenames
- Pattern: `{timestamp}_{sanitized_name}.{ext}`

#### 3. File Storage Structure
```
file_upload/
  └── {user_id}/
      ├── 1731657890123_document.pdf
      ├── 1731657891234_image.jpg
      └── ...
```
- User-specific folders prevent file conflicts
- RLS policies ensure users only access their own files

#### 4. Component Communication
- Parent-child communication via Svelte events (`createEventDispatcher`)
- `FileUpload` dispatches `uploadSuccess` event
- `FileList` exposes `refresh()` method via component binding
- Enables automatic list refresh after upload/edit/delete

#### 5. Progress Tracking
- Simulated progress based on file size (Supabase JS Client limitation)
- Uses `setInterval` to gradually increase progress to 90%
- Jumps to 100% when actual upload completes
- Provides better UX than indeterminate spinners

## Trade-offs & Known Limitations

### Current Limitations

1. **Progress Bar Accuracy**
   - Progress is simulated, not actual upload progress
   - Supabase JS Client doesn't support native progress events
   - May not reflect real network conditions accurately

2. **File Size Limit**
   - Hard-coded 50MB limit per file
   - Supabase free tier has total storage limits
   - Large files may cause timeout issues

3. **Filename Sanitization**
   - Special characters and Unicode (Chinese) are replaced with underscores
   - Original filename preserved only in database
   - Downloaded files may have different names than expected

4. **No File Versioning**
   - Duplicate filenames are rejected (no overwrite)
   - No version history or recovery mechanism

5. **Client-Side Only Validation**
   - File type and size validation done in browser
   - Could be bypassed by malicious users
   - Should add server-side validation in production

6. **No Folder Structure**
   - All files stored in flat structure per user
   - No subdirectories or organization features

### Security Considerations

- ✅ Row Level Security (RLS) enforced at database level
- ✅ Authentication required for all file operations
- ✅ User-specific storage paths
- ⚠️ No server-side file type validation
- ⚠️ No virus/malware scanning
- ⚠️ Public bucket (files accessible if URL is known)

## Future Improvements

### Short-term Enhancements

1. **Real Progress Tracking**
   - Implement XMLHttpRequest with progress events
   - Or use Supabase REST API directly with fetch streaming

2. **File Type Restrictions**
   - Add whitelist/blacklist for file extensions
   - Server-side MIME type validation
   - Separate storage policies for different file types

3. **Improved Error Handling**
   - Retry mechanism for failed uploads
   - Better error messages with recovery suggestions
   - Network status detection

4. **File Preview**
   - PDF preview with PDF.js
   - Video/audio player integration
   - Document preview for Office files

### Medium-term Features

5. **Folder Management**
   - Create/rename/delete folders
   - Drag-and-drop file organization
   - Breadcrumb navigation

6. **Batch Operations**
   - Multi-select files
   - Bulk download as ZIP
   - Bulk delete with confirmation

7. **File Sharing**
   - Generate shareable links with expiration
   - Permission management (view/edit)
   - Password-protected links

8. **Search & Filtering**
   - Full-text search in filenames
   - Filter by file type, size, date
   - Sort options (name, size, date)

### Long-term Vision

9. **Collaboration Features**
   - Real-time collaborative editing
   - Comments and annotations
   - Activity feed and notifications

10. **Advanced Storage**
    - File versioning and history
    - Trash/recycle bin with recovery
    - Cloud storage integration (Google Drive, Dropbox)

11. **Performance Optimization**
    - Lazy loading for large file lists
    - Virtual scrolling for thousands of files
    - CDN integration for faster downloads

12. **Mobile App**
    - Native iOS/Android apps
    - Camera integration for photos
    - Offline mode with sync

## Technology Stack Details

| Technology | Version | Purpose |
|-----------|---------|---------|
| SvelteKit | 2.x | Frontend framework & routing |
| Svelte | 5.x | Component framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| Supabase | Latest | Backend (Auth, DB, Storage) |
| Vite | 5.x | Build tool & dev server |

## License

N/A

## Contact

For questions or support, please email fiveflower0130@gmail.com
