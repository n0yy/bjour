# Appwrite sebagai backend

BJour butuh backend untuk auth, sinkronisasi Partnership antar dua akun, dan proxy panggilan LLM (API key tidak boleh di app). Kami memilih Appwrite (Cloud) alih-alih Supabase karena familiaritas developer — kecepatan solo dev dengan tools yang dikuasai mengalahkan keunggulan teoretis Postgres. Permission per-row TablesDB juga memetakan rapi ke model Link Terbatas/Link Penuh.

## Consequences

Appwrite tidak punya agregasi query (`SUM`/`GROUP BY`). Saldo Goal, total Contribution per pihak, dan laporan per kategori harus dihitung via counter field yang di-update per transaksi atau di Appwrite Functions — bukan query SQL. Ini diterima secara sadar; jika kebutuhan pelaporan melampaui pola ini, keputusan ini layak ditinjau ulang.

## Considered Options

- **Supabase** — agregasi trivial via SQL/view, RLS; ditolak karena learning curve untuk developer.
- **Firebase** — ditolak: Firestore menyulitkan query relasional dan security rules lebih sulit diaudit.
- **Backend custom (Hono)** — ditolak: waktu ke MVP terlalu lama untuk solo dev.
