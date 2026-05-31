# LearnLens AI - Deployment Checklist

## Target

Target deployment yang direkomendasikan adalah:

- Vercel untuk hosting Next.js.
- Supabase untuk database dokumen dan aktivitas.
- Alibaba Cloud DashScope untuk LLM API.

## Environment Variables

Isi env berikut di platform deployment:

```text
NEXT_PUBLIC_APP_URL=https://domain-deploy-kamu.vercel.app
DASHSCOPE_API_KEY=isi_api_key_dashscope
DASHSCOPE_MODEL=qwen-plus
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
NEXT_PUBLIC_SUPABASE_URL=isi_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key_supabase
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key_supabase
SUPABASE_STORAGE_BUCKET=documents
```

Jangan masukkan `.env.local` ke GitHub atau source code publik.

## Setup Supabase

1. Buat project Supabase.
2. Buka SQL Editor.
3. Jalankan isi file `supabase/schema.sql`.
4. Ambil `Project URL`, `anon key`, dan `service_role key`.
5. Masukkan key tersebut ke environment variables Vercel.

## Setup Vercel

1. Push project ke GitHub.
2. Import repository ke Vercel.
3. Framework preset: Next.js.
4. Build command: `npm run build`.
5. Output directory: default Next.js.
6. Masukkan semua environment variables.
7. Deploy.

## Final Check Setelah Deploy

- Landing page terbuka.
- Dashboard terbuka.
- Upload PDF berhasil.
- Dokumen muncul hanya di session browser yang sama.
- Chat menjawab sesuai dokumen.
- Quiz generate 10 soal dan submit menampilkan skor.
- Study Hub menampilkan data dari dokumen dan aktivitas.
- Delete dokumen berhasil.

## Catatan Penting

Vercel serverless tidak cocok untuk menyimpan file runtime di `.data`. Karena itu, pada cloud deployment wajib isi env Supabase agar data dokumen dan aktivitas tersimpan di database cloud. Jika env Supabase kosong, aplikasi tetap bisa jalan lokal dengan fallback file JSON.
