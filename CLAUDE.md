## Agent skills

### Issue tracker

Issues dilacak di GitHub Issues repo `n0yy/bjour` pakai `gh` CLI (PR bukan surface triage). See `docs/agents/issue-tracker.md`.

### Triage labels

Lima label kanonik dipakai apa adanya: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: satu `CONTEXT.md` + `docs/adr/` di root repo. See `docs/agents/domain.md`.

### Design system

Cek `DESIGN.md` di root repo sebelum nulis atau ubah CSS/komponen UI apapun. Semua token warna, spacing, dan typography wajib ambil dari sana — jangan generate nilai baru. Kalau ada kebutuhan UI yang nggak ke-cover di `DESIGN.md`, stop dan tanya dulu daripada nebak.

## Tooling

Pakai **bun**, bukan npm/yarn/pnpm/node — install (`bun add`/`bun install`), jalankan script (`bun run <script>`), dan test (`bun test`) semua lewat bun. Adapter SQLite untuk lapisan storage diuji lewat `bun:sqlite` (real SQLite engine, bukan mock) di balik seam eksekutor yang sama dipakai `expo-sqlite` saat runtime.

### Expo SDK

Prioritaskan Expo SDK buat semua fungsi native (calendar, BlurView, GlassEffect, SQLite, dll) sebelum bikin custom implementation atau install library third-party. Cek dulu lewat MCP `expo` apakah API/module yang dibutuhkan udah tersedia di Expo SDK. Kalau nggak ada, baru boleh build sendiri atau cari alternatif lain — jangan skip langkah cek MCP-nya.

## Commit conventions

Do not add any Claude/AI identity or co-author trailer to commit messages (e.g. no `Co-Authored-By: Claude`). Commits should read as if written solely by the human author.