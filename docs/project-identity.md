# LearnLens AI - Identitas Proyek

## Ringkasan

LearnLens AI adalah dashboard web berbasis Large Language Model untuk membantu mahasiswa memahami dokumen PDF panjang. Aplikasi mengekstrak teks PDF, membuat ringkasan, menyediakan chat berbasis konteks dokumen, membuat quiz otomatis, dan menyusun pusat belajar melalui Study Hub.

## Masalah yang Diselesaikan

Mahasiswa sering perlu membaca dokumen panjang seperti modul, panduan tugas, materi cloud, atau paper. Proses membaca manual memakan waktu dan sulit diubah menjadi latihan belajar. LearnLens AI mempercepat proses tersebut dengan mengubah PDF menjadi insight, tanya jawab, quiz, flashcard, study plan, dan action items.

## Target Pengguna

- Mahasiswa yang ingin memahami dokumen kuliah atau panduan tugas.
- Pengguna yang perlu merangkum PDF dengan cepat.
- Pengguna yang ingin membuat latihan belajar dari dokumen sendiri.

## Fitur Utama

- Landing page interaktif dengan efek 3D.
- Dashboard aktivitas belajar.
- Upload dan ekstraksi teks PDF.
- AI summary, key points, dan technical terms.
- Chat berbasis dokumen.
- Quiz otomatis 10 soal.
- Study Hub berisi study plan, flashcard review, quiz performance, document queue, action queue, dan learning timeline.
- Session per pengguna agar upload orang lain tidak terlihat di browser berbeda.
- Integrasi LLM Alibaba Cloud DashScope/Qwen.

## Tech Stack

- Frontend dan backend: Next.js App Router + TypeScript.
- Styling: Tailwind CSS.
- UI interaction: Framer Motion, Recharts, Lucide React, Spline scene.
- PDF extraction: pdf-parse.
- LLM provider: Alibaba Cloud DashScope dengan model `qwen-plus`.
- Cloud database untuk deploy: Supabase, dengan fallback file lokal untuk development.
- Target deployment: Vercel.

## Nilai Tugas Akhir yang Ditonjolkan

- Menggunakan framework modern berbasis web.
- Mengimplementasikan cloud deployment.
- Terintegrasi dengan API LLM.
- Memiliki dashboard interaktif.
- Memiliki alur aplikasi yang dapat dijelaskan dari frontend, backend, LLM API, sampai database cloud.
