# LearnLens AI

Dashboard web berbasis LLM untuk belajar dari dokumen PDF. MVP ini dibuat untuk Tugas Akhir dengan fokus pada upload dokumen, ekstraksi teks PDF, ringkasan AI, chat berbasis dokumen, quiz otomatis, study plan, flashcard, action items, dan dashboard aktivitas.

## Getting Started

Install dependency dan jalankan server development:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Recharts
- Zod
- pdf-parse
- Supabase client
- Alibaba Cloud DashScope / Qwen compatible API

## Environment

Copy `.env.example` menjadi `.env.local`, lalu isi key yang tersedia.

```text
DASHSCOPE_API_KEY=
DASHSCOPE_MODEL=qwen-plus
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Jika `DASHSCOPE_API_KEY` belum diisi, aplikasi tetap berjalan dengan fallback ekstraktif dari dokumen yang diupload.

## Routes

```text
/
/dashboard
/documents
/documents/[id]
/chat
/chat/[documentId]
/quiz
/quiz/[documentId]
/study
```

## Session Data

Aplikasi memakai anonymous session cookie `learnlens_session`. Dokumen dan aktivitas difilter per session, sehingga browser/pengunjung lain memulai dari library kosong tanpa melihat upload milik session berbeda.

## API

```text
POST /api/documents/upload
POST /api/documents/[id]/summarize
POST /api/chat
POST /api/quiz/generate
POST /api/quiz/submit
```

## Deployment

Target deployment utama adalah Vercel. Untuk database dan storage, gunakan Supabase dengan schema di `supabase/schema.sql`.

Dokumentasi pendukung:

- `docs/project-identity.md`
- `docs/architecture.md`
- `docs/deployment.md`
- `docs/final-check.md`
