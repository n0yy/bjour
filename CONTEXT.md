# BJour (Big Journey)

App keuangan personal dua tingkat untuk pasar Indonesia: **BJour** — ledger pencatatan manual yang cepat dan local-first (ala Money Manager), dan **BJour+** — lapisan kecerdasan yang menurunkan rekomendasi LLM dari data ledger, tanpa form onboarding.

## Language

### Tingkat produk

**BJour**:
Tingkat dasar: Ledger local-first tanpa akun login. Gratis selamanya.
_Avoid_: app basic, free tier

**BJour+**:
Tingkat lanjutan di app yang sama: Journey (Goal, Plan, Verdict) yang digerakkan analisis cash flow dari Ledger. Membutuhkan akun login dan Aktivasi.
_Avoid_: premium, pro

**Aktivasi**:
Gerbang masuk BJour+: buat akun, pilih Life Stage, buat Goal pertama — satu layar, tanpa form profil finansial. Semua data finansial lain diturunkan dari Ledger.
_Avoid_: onboarding, registrasi

**Ambang Data**:
Syarat minimum isi Ledger sebelum Aktivasi terbuka (±1 bulan pencatatan termasuk cash-in rutin). Progres menujunya ditampilkan ke user.
_Avoid_: cold start, unlock requirement

### Ledger

**Ledger**:
Catatan seluruh Transaction user, hidup lokal di perangkat. Sumber kebenaran finansial BJour; disalin ke server hanya untuk analisis BJour+.

**Transaction**:
Satu catatan manual di Ledger: pemasukan, pengeluaran, atau transfer — dengan nominal, Aset, kategori/subkategori, catatan, dan tanggal.
_Avoid_: expense, entri

**Aset**:
Tempat uang berada: tunai, rekening bank, e-wallet, kartu. Saldonya diperbarui otomatis oleh setiap Transaction (double-entry); transfer memindahkan saldo antar Aset.
_Avoid_: akun (bentrok dengan akun login), rekening, dompet

**Cash Flow**:
Pola pemasukan dan pengeluaran yang diturunkan dari Ledger — bahan baku seluruh analisis BJour+ (penghasilan efektif, Living Cost, kapasitas menabung).

### Perjalanan & user (BJour+)

**Life Stage**:
Tahap hidup user yang memengaruhi rekomendasi: `single`, `mau-nikah`, atau `menikah`. Dipilih saat Aktivasi (tidak bisa diturunkan dari data), bertransisi maju, dan transisi menawarkan regenerasi Plan.
_Avoid_: jenis user, tipe user, status

**Journey**:
Perjalanan finansial user melintasi Life Stage-nya beserta seluruh Goal dan Plan di dalamnya. Isi dari BJour+.

**Partnership**:
Hubungan tertaut antara dua akun user. Punya dua tingkat: Link Terbatas dan Link Penuh.
_Avoid_: couple account, akun bersama

**Link Terbatas**:
Tingkat Partnership pada Life Stage `mau-nikah`: hanya Shared Goal dan Contribution ke Shared Goal yang saling terlihat.

**Link Penuh**:
Tingkat Partnership pada Life Stage `menikah`: transparansi total — seluruh data finansial kedua pihak saling terlihat.

**Unlink**:
Pemutusan Partnership secara sepihak dan seketika oleh salah satu pihak. Shared Goal membeku menjadi arsip baca-saja di kedua akun; riwayat Contribution masing-masing pihak tetap tercatat; akses ke data pihak lain dicabut seketika.
_Avoid_: hapus pasangan

### Tujuan & rekomendasi (BJour+)

**Goal**:
Target menabung milik satu user: nama, target rupiah, dan tenggat. Dinyatakan eksplisit oleh user (tidak diturunkan dari data).
_Avoid_: objective, target, impian

**Shared Goal**:
Goal milik sebuah Partnership, bukan milik satu user; kedua pihak berkontribusi.

**Contribution**:
Setoran tercatat dari satu user ke sebuah Goal atau Shared Goal. BJour hanya mencatat — uang sungguhan tetap di rekening user.
_Avoid_: deposit, top-up

**Living Cost**:
Biaya hidup bulanan user, diturunkan dari rata-rata pengeluaran per kategori di Ledger — bukan dari pengakuan user.

**Plan**:
Output terstruktur dari LLM: alokasi rupiah per pos (living cost, tabungan per Goal, dana darurat, dst.) beserta alasan singkat per pos, dihitung dari Cash Flow nyata. Diregenerasi saat life event, perubahan pola signifikan, atau atas permintaan user — bukan chat bebas, dibatasi kuota.
_Avoid_: rekomendasi (sebagai istilah teknis), advice

**Verdict**:
Penilaian kelayakan sebuah Goal di dalam Plan: realistis atau tidak terhadap Cash Flow user, beserta opsi penyesuaian (turunkan target atau perpanjang tenggat).
