# LearnLens AI - Arsitektur Sistem

## Komponen Utama

1. Frontend Next.js
   - Menampilkan landing page, dashboard, document library, chat, quiz, dan Study Hub.
   - Mengirim request ke API routes internal.
   - Menyimpan session pengguna melalui cookie `learnlens_session`.

2. Backend API Routes
   - `POST /api/documents/upload`: menerima PDF, ekstraksi teks, membuat summary AI, lalu menyimpan dokumen.
   - `POST /api/chat`: menerima pertanyaan, mengambil konteks dokumen, lalu meminta jawaban ke LLM.
   - `POST /api/quiz/generate`: membuat 10 pertanyaan quiz dari dokumen.
   - `POST /api/quiz/submit`: menilai jawaban dan menyimpan aktivitas quiz.
   - `DELETE /api/documents/[id]`: menghapus dokumen milik session aktif.

3. LLM API
   - Provider: Alibaba Cloud DashScope.
   - Model aktif: `qwen-plus`.
   - Digunakan untuk summary, chat, dan quiz generation.
   - Jika API key tidak tersedia atau request gagal, aplikasi memakai fallback ekstraktif lokal agar demo tetap berjalan.

4. Database dan Session
   - Pada development lokal, dokumen dan aktivitas disimpan di `.data/*.json`.
   - Pada cloud deployment, aplikasi memakai Supabase jika env `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` tersedia.
   - Semua dokumen dan aktivitas difilter dengan `session_id`, sehingga pengguna publik lain memulai dari data kosong.

## Alur Upload PDF

```text
User
  -> Frontend Upload Panel
  -> POST /api/documents/upload
  -> pdf-parse mengekstrak teks PDF
  -> DashScope/Qwen membuat summary, key points, dan technical terms
  -> Supabase/local store menyimpan dokumen sesuai session
  -> UI menampilkan dokumen pada library, dashboard, chat, quiz, dan Study Hub
```

## Alur Chat Dokumen

```text
User memilih dokumen
  -> Frontend Chat Panel
  -> POST /api/chat
  -> Backend mengambil dokumen berdasarkan documentId + sessionId
  -> Backend mengirim konteks dokumen dan pertanyaan ke DashScope/Qwen
  -> Jawaban dikembalikan ke UI
  -> Aktivitas chat dicatat
```

## Alur Quiz

```text
User membuka quiz dokumen
  -> POST /api/quiz/generate
  -> Backend mengirim konteks dokumen ke DashScope/Qwen
  -> LLM membuat 10 soal pilihan ganda
  -> User menjawab quiz
  -> POST /api/quiz/submit
  -> Backend menghitung skor
  -> Skor masuk ke Learning Progress dan Study Hub
```

## Alur Study Hub

```text
Supabase/local documents + activities
  -> buildStudyPlan()
  -> buildFlashcards()
  -> buildActionItems()
  -> buildProgressDetails()
  -> Study Hub menampilkan pusat belajar lintas dokumen
```

## Deployment Cloud

Target deployment utama adalah Vercel:

```text
Browser user
  -> Vercel/Next.js frontend
  -> Vercel serverless API routes
  -> Alibaba Cloud DashScope LLM API
  -> Supabase PostgreSQL database
```

Dengan arsitektur ini, aplikasi memenuhi konsep cloud-native ringan: frontend/backend berjalan di cloud deployment, LLM memakai layanan cloud AI, dan data runtime disimpan di database cloud.
