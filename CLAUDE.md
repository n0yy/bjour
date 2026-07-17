@AGENTS.md

## Agent skills

### Issue tracker

Issues dilacak sebagai file markdown lokal di `.scratch/<feature>/` (tanpa remote; PR bukan surface triage). See `docs/agents/issue-tracker.md`.

### Triage labels

Lima label kanonik dipakai apa adanya: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: satu `CONTEXT.md` + `docs/adr/` di root repo. See `docs/agents/domain.md`.

## Tooling

Pakai **bun**, bukan npm/yarn/pnpm/node — install (`bun add`/`bun install`), jalankan script (`bun run <script>`), dan test (`bun test`) semua lewat bun. Adapter SQLite untuk lapisan storage diuji lewat `bun:sqlite` (real SQLite engine, bukan mock) di balik seam eksekutor yang sama dipakai `expo-sqlite` saat runtime.
