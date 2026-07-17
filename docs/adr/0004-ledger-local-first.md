# Ledger local-first; server hanya untuk BJour+

Ledger BJour hidup sepenuhnya lokal di perangkat (DB lokal), tanpa akun login: buka app → langsung mencatat, offline, privat — meniru kekuatan yang membuat Money Manager (Realbyte) dicintai 50jt+ user. Akun (Appwrite, lihat ADR-0001) baru diminta saat Aktivasi BJour+, ketika Ledger disalin ke server untuk dianalisis LLM; insentif signup menjadi eksplisit ("buat akun untuk membuka analisismu").

## Consequences

- Loop inti pencatatan tidak pernah menyentuh jaringan; kecepatan input adalah kontrak produk.
- Sebelum Aktivasi tidak ada backup/sync — kehilangan perangkat = kehilangan Ledger. Diterima untuk fase awal.
- Peran Appwrite menyempit dari "backend semua data" (asumsi awal ADR-0001) menjadi backend BJour+ saja: auth, salinan Ledger untuk analisis, Function LLM, kuota.

## Considered Options

- **Akun & server sejak transaksi pertama** — ditolak: signup menghadang sebelum nilai terasa dan tiap pencatatan butuh koneksi.
- **Local-first + sync opsional sejak awal** — ditolak: dua mode penyimpanan + sinkronisasi dua arah adalah kompleksitas terbesar, tidak sepadan sebelum produk terbukti.
