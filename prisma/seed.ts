import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding ThinkStep database...')

  // ─── Buat School ───────────────────────────────
  const school = await prisma.school.upsert({
    where: { npsn: '20012345' },
    update: {},
    create: {
      name: 'SMP Negeri 1 ThinkStep',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      npsn: '20012345',
    },
  })
  console.log('✅ School created:', school.name)

  // ─── Buat Users ───────────────────────────────
  const passwordHash = await bcrypt.hash('demo123', 10)

  const guru = await prisma.user.upsert({
    where: { email: 'guru@thinkstep.demo' },
    update: {},
    create: {
      email: 'guru@thinkstep.demo',
      name: 'Bu Siti Rahayu',
      passwordHash,
      role: 'TEACHER',
      schoolId: school.id,
      avatarColor: '#059669',
    },
  })
  console.log('✅ Teacher created:', guru.name)

  const andi = await prisma.user.upsert({
    where: { email: 'andi@thinkstep.demo' },
    update: {},
    create: {
      email: 'andi@thinkstep.demo',
      name: 'Andi Kusuma',
      passwordHash,
      role: 'STUDENT',
      gradeLevel: 'Kelas 8',
      schoolId: school.id,
      avatarColor: '#3B82F6',
    },
  })

  const budi = await prisma.user.upsert({
    where: { email: 'budi@thinkstep.demo' },
    update: {},
    create: {
      email: 'budi@thinkstep.demo',
      name: 'Budi Santoso',
      passwordHash,
      role: 'STUDENT',
      gradeLevel: 'Kelas 8',
      schoolId: school.id,
      avatarColor: '#8B5CF6',
    },
  })

  const citra = await prisma.user.upsert({
    where: { email: 'citra@thinkstep.demo' },
    update: {},
    create: {
      email: 'citra@thinkstep.demo',
      name: 'Citra Dewi',
      passwordHash,
      role: 'STUDENT',
      gradeLevel: 'Kelas 7',
      schoolId: school.id,
      avatarColor: '#EC4899',
    },
  })
  console.log('✅ Students created:', andi.name, budi.name, citra.name)

  // ─── UserStats ───────────────────────────────
  await prisma.userStats.upsert({
    where: { userId: andi.id },
    update: {},
    create: {
      userId: andi.id,
      totalPoints: 2450,
      totalSessions: 55,
      totalCorrect: 48,
      totalNoHintCorrect: 39,
      currentStreak: 5,
      longestStreak: 12,
      autonomyIndex: 82,
      lastActiveDate: new Date(),
    },
  })

  await prisma.userStats.upsert({
    where: { userId: budi.id },
    update: {},
    create: {
      userId: budi.id,
      totalPoints: 1200,
      totalSessions: 30,
      totalCorrect: 21,
      totalNoHintCorrect: 12,
      currentStreak: 2,
      longestStreak: 5,
      autonomyIndex: 55,
      lastActiveDate: new Date(),
    },
  })

  await prisma.userStats.upsert({
    where: { userId: citra.id },
    update: {},
    create: {
      userId: citra.id,
      totalPoints: 680,
      totalSessions: 20,
      totalCorrect: 12,
      totalNoHintCorrect: 3,
      currentStreak: 0,
      longestStreak: 3,
      autonomyIndex: 28,
      lastActiveDate: new Date(),
    },
  })

  // ─── Badges ───────────────────────────────
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: andi.id, badgeId: 'first_session' } },
    update: {},
    create: { userId: andi.id, badgeId: 'first_session' },
  })
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: andi.id, badgeId: 'first_no_hint' } },
    update: {},
    create: { userId: andi.id, badgeId: 'first_no_hint' },
  })
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: andi.id, badgeId: 'streak_5' } },
    update: {},
    create: { userId: andi.id, badgeId: 'streak_5' },
  })
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId: andi.id, badgeId: 'math_master' } },
    update: {},
    create: { userId: andi.id, badgeId: 'math_master' },
  })

  // ─── Questions (Bank Soal) ───────────────────────────────
  const questions = [
    // MATEMATIKA - Kelas 7 & 8
    {
      content: 'Jika 2x + 5 = 15, berapa nilai x?',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'MEDIUM' as const,
      subject: 'Matematika',
      topic: 'Persamaan Linear Satu Variabel',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menyelesaikan persamaan linear satu variabel',
      hintTier1: 'Konsep apa yang kamu ingat tentang persamaan? Apa artinya tanda "=" dalam matematika?',
      hintTier2: 'Ingat: untuk mendapatkan nilai x, kita perlu membuat x "sendirian" di satu sisi. Operasi apa yang bisa menghilangkan angka 5 dari sisi kiri?',
      hintTier3: 'Coba kurangi kedua sisi persamaan dengan 5 terlebih dahulu. Setelah itu, kamu perlu membagi kedua sisi dengan koefisien x. Mulai dari mana?',
      correctAnswer: '5',
      explanation: '2x + 5 = 15 → 2x = 15 - 5 = 10 → x = 10/2 = 5',
      tags: JSON.stringify(['persamaan', 'linear', 'aljabar']),
      createdById: guru.id,
    },
    {
      content: 'Sebuah persegi panjang memiliki panjang (2x + 3) cm dan lebar (x + 1) cm. Jika kelilingnya 30 cm, tentukan nilai x!',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'HARD' as const,
      subject: 'Matematika',
      topic: 'Persamaan Linear Satu Variabel',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menerapkan persamaan linear dalam konteks geometri',
      hintTier1: 'Ingat rumus keliling persegi panjang. Apa hubungannya dengan panjang dan lebar?',
      hintTier2: 'Keliling = 2 × (panjang + lebar). Coba substitusikan panjang dan lebar yang diberikan ke dalam rumus ini!',
      hintTier3: 'Setelah substitusi: 2 × ((2x+3) + (x+1)) = 30. Sederhanakan bagian dalam kurung dulu, lalu selesaikan persamaannya!',
      correctAnswer: '4',
      explanation: 'K = 2(p + l) → 30 = 2((2x+3)+(x+1)) → 15 = 3x+4 → 3x = 11... tunggu, coba hitung ulang: 30 = 2(3x+4) → 15 = 3x+4 → x = 11/3 ≈ 3.67',
      tags: JSON.stringify(['keliling', 'persegi panjang', 'konteks']),
      createdById: guru.id,
    },
    {
      content: 'Teorema Pythagoras menyatakan bahwa pada segitiga siku-siku dengan sisi a, b, dan hipotenusa c, berlaku c² = a² + b². Jika a = 3 dan b = 4, berapa panjang c?',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'EASY' as const,
      subject: 'Matematika',
      topic: 'Teorema Pythagoras',
      gradeLevel: 'Kelas 8',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menerapkan Teorema Pythagoras',
      hintTier1: 'Coba ingat kembali Teorema Pythagoras. Apa yang kita ketahui dari soal ini?',
      hintTier2: 'Substitusikan a = 3 dan b = 4 ke dalam rumus c² = a² + b². Berapa hasil dari 3² dan 4²?',
      hintTier3: 'c² = 9 + 16 = 25. Sekarang, untuk mencari c, apa yang harus kamu lakukan dengan 25?',
      correctAnswer: '5',
      explanation: 'c² = 3² + 4² = 9 + 16 = 25, sehingga c = √25 = 5',
      tags: JSON.stringify(['pythagoras', 'segitiga', 'geometri']),
      createdById: guru.id,
    },
    {
      content: 'Hitunglah luas lingkaran dengan jari-jari 7 cm! (Gunakan π ≈ 22/7)',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'EASY' as const,
      subject: 'Matematika',
      topic: 'Lingkaran',
      gradeLevel: 'Kelas 8',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menghitung luas lingkaran',
      hintTier1: 'Rumus apa yang kamu ingat tentang lingkaran? Ada berapa rumus yang berkaitan dengan lingkaran?',
      hintTier2: 'Rumus luas lingkaran adalah L = π × r². Di sini r adalah jari-jari. Berapa nilai r dalam soal ini?',
      hintTier3: 'L = (22/7) × 7². Hitung dulu 7² = 49, lalu kalikan dengan 22/7. Apa yang terjadi dengan 49 dan 7 dalam pembagian?',
      correctAnswer: '154',
      explanation: 'L = π × r² = (22/7) × 7² = (22/7) × 49 = 22 × 7 = 154 cm²',
      tags: JSON.stringify(['lingkaran', 'luas', 'geometri']),
      createdById: guru.id,
    },
    {
      content: 'Sebuah toko memberikan diskon 20% untuk semua barang. Jika harga asal sebuah buku adalah Rp 50.000, berapa harga setelah diskon?',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'EASY' as const,
      subject: 'Matematika',
      topic: 'Persentase dan Diskon',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menghitung persentase dalam konteks kehidupan sehari-hari',
      hintTier1: 'Apa arti diskon 20%? Kalau kamu di toko dan melihat "diskon 20%", apa yang kamu pikirkan?',
      hintTier2: 'Diskon 20% artinya kamu membayar 80% dari harga asal (100% - 20% = 80%). Bagaimana cara menghitung 80% dari Rp 50.000?',
      hintTier3: 'Harga diskon = 80% × Rp 50.000 = (80/100) × 50.000. Atau bisa juga: diskon = 20% × 50.000, lalu kurangi dari harga asal.',
      correctAnswer: '40000',
      explanation: 'Diskon = 20% × 50.000 = 10.000. Harga setelah diskon = 50.000 - 10.000 = Rp 40.000',
      tags: JSON.stringify(['persentase', 'diskon', 'konteks']),
      createdById: guru.id,
    },
    // IPA - Hukum Newton
    {
      content: 'Sebuah benda bermassa 5 kg didorong dengan gaya 20 N. Berapakah percepatan benda tersebut? (Hukum Newton II: F = m × a)',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'MEDIUM' as const,
      subject: 'IPA',
      topic: 'Hukum Newton',
      gradeLevel: 'Kelas 8',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menerapkan Hukum Newton II dalam perhitungan',
      hintTier1: 'Coba identifikasi dulu: apa yang diketahui dan apa yang dicari dalam soal ini?',
      hintTier2: 'Hukum Newton II: F = m × a. Kita tahu F = 20 N dan m = 5 kg. Bagaimana cara mencari nilai a?',
      hintTier3: 'Dari F = m × a, maka a = F/m. Substitusikan nilai yang diketahui: a = 20/5. Berapa hasilnya?',
      correctAnswer: '4',
      explanation: 'Dari F = m × a → a = F/m = 20/5 = 4 m/s²',
      tags: JSON.stringify(['newton', 'gaya', 'percepatan', 'fisika']),
      createdById: guru.id,
    },
    {
      content: 'Mengapa seorang penumpang akan terdorong ke depan ketika bus berhenti mendadak? Jelaskan menggunakan Hukum Newton I!',
      type: 'ESSAY' as const,
      difficulty: 'MEDIUM' as const,
      subject: 'IPA',
      topic: 'Hukum Newton',
      gradeLevel: 'Kelas 8',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menjelaskan fenomena sehari-hari menggunakan Hukum Newton I',
      hintTier1: 'Coba ingat Hukum Newton I. Apa yang disebutnya tentang benda yang bergerak atau diam?',
      hintTier2: 'Hukum Newton I: "Setiap benda akan mempertahankan keadaannya (diam atau bergerak) kecuali ada gaya luar yang mempengaruhinya." Penumpang sedang bergerak bersama bus — apa yang terjadi ketika bus berhenti?',
      hintTier3: 'Ketika bus berhenti, ada gaya rem yang bekerja pada bus. Tapi gaya ini tidak langsung memengaruhi penumpang. Penumpang "ingin" terus bergerak ke depan karena... (sifat inersia). Apa nama sifat ini?',
      correctAnswer: 'Inersia/kelembaman',
      explanation: 'Karena inersia (sifat benda mempertahankan geraknya), penumpang yang sedang bergerak bersama bus akan terus bergerak ke depan saat bus berhenti mendadak, sehingga terasa terdorong ke depan.',
      tags: JSON.stringify(['newton', 'inersia', 'kelembaman', 'fenomena']),
      createdById: guru.id,
    },
    {
      content: 'Sebuah roket meluncur dengan memancarkan gas ke bawah. Jelaskan prinsip kerja roket menggunakan Hukum Newton III!',
      type: 'ESSAY' as const,
      difficulty: 'HARD' as const,
      subject: 'IPA',
      topic: 'Hukum Newton',
      gradeLevel: 'Kelas 8',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menjelaskan aplikasi Hukum Newton III',
      hintTier1: 'Apa yang disebutkan Hukum Newton III tentang gaya aksi dan reaksi?',
      hintTier2: 'Hukum Newton III: "Setiap aksi selalu ada reaksi yang besarnya sama tapi arahnya berlawanan." Gas dipancarkan ke bawah (aksi). Apa reaksinya?',
      hintTier3: 'Gas dipancarkan ke bawah (aksi) → roket mendapat gaya ke atas (reaksi). Gaya ini yang membuat roket meluncur ke atas. Besarnya gaya aksi = gaya reaksi, tapi arahnya berlawanan.',
      correctAnswer: 'Gaya aksi-reaksi',
      explanation: 'Roket memancarkan gas ke bawah (gaya aksi). Sesuai Hukum Newton III, ada gaya reaksi yang sama besar tapi berlawanan arah, yaitu gaya ke atas yang mendorong roket meluncur.',
      tags: JSON.stringify(['newton', 'aksi-reaksi', 'roket', 'aplikasi']),
      createdById: guru.id,
    },
    // IPA - Fotosintesis
    {
      content: 'Apa bahan-bahan yang dibutuhkan tumbuhan untuk melakukan fotosintesis? Tuliskan persamaan reaksi fotosintesis secara sederhana!',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'EASY' as const,
      subject: 'IPA',
      topic: 'Fotosintesis',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menjelaskan proses fotosintesis',
      hintTier1: 'Coba pikirkan: tumbuhan mendapatkan makanannya dari mana? Apa yang dibutuhkan untuk membuat makanan tersebut?',
      hintTier2: 'Fotosintesis membutuhkan cahaya matahari, air (H₂O dari akar), dan gas karbondioksida (CO₂ dari udara). Apa yang dihasilkan?',
      hintTier3: 'Persamaan sederhana: CO₂ + H₂O + Cahaya → Glukosa (C₆H₁₂O₆) + O₂. Tumbuhan menghasilkan glukosa sebagai makanan dan oksigen sebagai sampingan.',
      correctAnswer: 'CO2 + H2O + cahaya → Glukosa + O2',
      explanation: 'Fotosintesis: 6CO₂ + 6H₂O + energi cahaya → C₆H₁₂O₆ + 6O₂. Bahan: CO₂, H₂O, cahaya. Hasil: glukosa dan oksigen.',
      tags: JSON.stringify(['fotosintesis', 'tumbuhan', 'biologi']),
      createdById: guru.id,
    },
    // Bahasa Indonesia
    {
      content: 'Bacalah paragraf berikut:\n"Banjir melanda kota itu selama tiga hari. Ribuan warga terpaksa mengungsi. Pemerintah segera mengirimkan bantuan berupa makanan dan obat-obatan."\n\nTentukan gagasan utama paragraf tersebut!',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'EASY' as const,
      subject: 'Bahasa Indonesia',
      topic: 'Membaca Pemahaman',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat mengidentifikasi gagasan utama sebuah paragraf',
      hintTier1: 'Apa itu gagasan utama? Dimana biasanya gagasan utama berada dalam sebuah paragraf?',
      hintTier2: 'Gagasan utama adalah ide pokok yang menjadi inti paragraf. Biasanya terletak di kalimat pertama (deduktif) atau kalimat terakhir (induktif). Kalimat mana yang "merangkum" seluruh isi paragraf ini?',
      hintTier3: 'Coba tanya: "Paragraf ini membahas tentang apa secara keseluruhan?" Kalimat pertama menyebutkan banjir melanda — apakah kalimat-kalimat berikutnya menjelaskan lebih lanjut tentang banjir itu?',
      correctAnswer: 'Banjir melanda kota',
      explanation: 'Gagasan utama paragraf adalah "banjir melanda kota" (kalimat pertama). Kalimat-kalimat berikutnya menjelaskan dampak dan respons terhadap banjir tersebut.',
      tags: JSON.stringify(['membaca', 'paragraf', 'gagasan utama']),
      createdById: guru.id,
    },
    {
      content: 'Apa perbedaan antara kata "efektif" dan "efisien"? Berikan masing-masing satu contoh penggunaan dalam kalimat!',
      type: 'ESSAY' as const,
      difficulty: 'MEDIUM' as const,
      subject: 'Bahasa Indonesia',
      topic: 'Kosakata dan Diksi',
      gradeLevel: 'Kelas 8',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat membedakan penggunaan kata yang tepat dalam konteks',
      hintTier1: 'Kamu pernah mendengar kedua kata ini sebelumnya? Dalam konteks apa biasanya kata-kata ini digunakan?',
      hintTier2: '"Efektif" berkaitan dengan tercapainya tujuan/hasil yang diinginkan. "Efisien" berkaitan dengan penggunaan sumber daya (waktu, tenaga, biaya) yang minimal. Apa bedanya?',
      hintTier3: 'Contoh: "Metode belajar ini efektif meningkatkan nilainya" (tujuan tercapai). "Metode ini efisien karena hanya butuh 30 menit" (hemat waktu). Sekarang coba buat kalimatmu sendiri!',
      correctAnswer: 'Efektif = mencapai hasil; Efisien = hemat sumber daya',
      explanation: 'Efektif: berhasil mencapai tujuan. Efisien: mencapai hasil dengan sumber daya minimal. Keduanya berbeda: sesuatu bisa efektif tapi tidak efisien (atau sebaliknya).',
      tags: JSON.stringify(['kosakata', 'diksi', 'bahasa']),
      createdById: guru.id,
    },
    // Matematika tambahan
    {
      content: 'Tentukan himpunan penyelesaian dari pertidaksamaan: 3x - 6 > 9, untuk x bilangan bulat!',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'MEDIUM' as const,
      subject: 'Matematika',
      topic: 'Pertidaksamaan Linear',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menyelesaikan pertidaksamaan linear',
      hintTier1: 'Apa perbedaan antara persamaan (=) dan pertidaksamaan (> atau <)? Bagaimana cara menyelesaikannya?',
      hintTier2: 'Langkah menyelesaikan pertidaksamaan sama seperti persamaan, KECUALI: kalau kalikan/bagi dengan bilangan negatif, tanda pertidaksamaan berbalik. Coba isolasi x!',
      hintTier3: '3x - 6 > 9 → 3x > 15 → x > 5. Jadi x harus lebih besar dari 5. Untuk bilangan bulat, nilai x yang memenuhi adalah 6, 7, 8, ... Tuliskan dalam notasi himpunan!',
      correctAnswer: '{x | x > 5, x ∈ bilangan bulat}',
      explanation: '3x - 6 > 9 → 3x > 15 → x > 5. HP = {6, 7, 8, 9, ...}',
      tags: JSON.stringify(['pertidaksamaan', 'linear', 'himpunan']),
      createdById: guru.id,
    },
    {
      content: 'Sebuah segitiga memiliki sudut-sudut sebesar x°, (2x + 10)°, dan (x + 20)°. Berapa nilai x dan besar masing-masing sudut?',
      type: 'SHORT_ANSWER' as const,
      difficulty: 'MEDIUM' as const,
      subject: 'Matematika',
      topic: 'Sudut dan Segitiga',
      gradeLevel: 'Kelas 7',
      phase: 'Fase D',
      capaianPembelajaran: 'Siswa dapat menghitung sudut segitiga',
      hintTier1: 'Ada sifat penting tentang jumlah sudut dalam segitiga. Kamu masih ingat?',
      hintTier2: 'Jumlah semua sudut dalam segitiga = 180°. Coba tulis persamaan dengan menjumlahkan ketiga sudut dan samakan dengan 180°!',
      hintTier3: 'x + (2x+10) + (x+20) = 180 → 4x + 30 = 180 → 4x = 150 → x = 37,5. Substitusikan kembali untuk mencari setiap sudut!',
      correctAnswer: 'x = 37.5',
      explanation: 'x + (2x+10) + (x+20) = 180 → 4x + 30 = 180 → x = 37,5°. Sudut-sudutnya: 37,5°; 85°; 57,5°',
      tags: JSON.stringify(['sudut', 'segitiga', 'geometri']),
      createdById: guru.id,
    },
  ]

  console.log(`📚 Seeding ${questions.length} questions...`)
  for (const q of questions) {
    await prisma.question.create({ data: q })
  }
  console.log('✅ Questions seeded!')

  // ─── Sample Learning Sessions ───────────────────────────────
  const allQuestions = await prisma.question.findMany({ take: 5 })
  
  for (let i = 0; i < 3; i++) {
    const q = allQuestions[i]
    if (!q) continue
    
    const session = await prisma.learningSession.create({
      data: {
        userId: andi.id,
        questionId: q.id,
        subject: q.subject,
        isCompleted: true,
        isCorrect: i < 2,
        hintsUsed: i,
        pointsEarned: i === 0 ? 20 : i === 1 ? 15 : 5,
        startedAt: new Date(Date.now() - (3 - i) * 86400000),
        endedAt: new Date(Date.now() - (3 - i) * 86400000 + 600000),
      },
    })

    await prisma.message.createMany({
      data: [
        {
          sessionId: session.id,
          role: 'ASSISTANT',
          content: 'Halo! Soal yang menarik. Sebelum kita mulai, coba ceritakan — apa yang sudah kamu ketahui tentang topik ini?',
        },
        {
          sessionId: session.id,
          role: 'USER',
          content: 'Hmm, aku rasa aku perlu pikirkan dulu...',
        },
        {
          sessionId: session.id,
          role: 'ASSISTANT',
          content: 'Bagus! Cara berpikir yang benar. Coba ingat-ingat, konsep dasar apa yang berhubungan dengan soal ini?',
        },
      ],
    })
  }
  console.log('✅ Sample sessions created!')

  // ─── Sample Assignment ───────────────────────────────
  const assignment = await prisma.assignment.create({
    data: {
      title: 'Esai: Dampak Media Sosial pada Remaja',
      instructions: `## Tugas Esai

Tuliskan sebuah esai tentang **dampak positif dan negatif media sosial pada kehidupan remaja**.

### Ketentuan:
- Minimal 300 kata
- Struktur: Pendahuluan, Isi (minimal 2 paragraf), Penutup  
- Gunakan bahasa Indonesia yang baik dan benar
- Berikan contoh nyata dari pengalamanmu atau berita yang kamu baca

### Yang dinilai:
- Kelengkapan argumen
- Penggunaan bahasa
- **Orisinalitas tulisan** (bukan hasil copy-paste!)`,
      targetGrade: 'Kelas 8',
      schoolId: school.id,
      createdById: guru.id,
      deadline: new Date(Date.now() + 7 * 86400000),
      maxDurationMins: 90,
      minWordCount: 300,
      isPublished: true,
    },
  })
  console.log('✅ Sample assignment created:', assignment.title)

  // ─── Sample Writing Session (with anti-AI data) ───────────────────────────────
  const writingSession = await prisma.writingSession.create({
    data: {
      assignmentId: assignment.id,
      studentId: budi.id,
      status: 'SUBMITTED',
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 1800000),
      finalContent: 'Media sosial telah menjadi bagian tak terpisahkan dari kehidupan remaja modern. Di satu sisi, media sosial memberikan manfaat yang signifikan bagi perkembangan sosial dan pengetahuan remaja. Namun di sisi lain, penggunaan yang berlebihan dapat berdampak negatif pada kesehatan mental dan produktivitas mereka.',
      wordCount: 45,
    },
  })

  // Create some mock events
  const baseTime = BigInt(Date.now() - 3600000)
  await prisma.writingEvent.createMany({
    data: [
      {
        writingSessionId: writingSession.id,
        sequenceNumber: 1,
        absoluteTimestamp: baseTime,
        deltaFromPrevious: 0,
        eventType: 'FOCUS',
        cursorPosition: 0,
        contentLength: 0,
      },
      {
        writingSessionId: writingSession.id,
        sequenceNumber: 2,
        absoluteTimestamp: baseTime + BigInt(320000),
        deltaFromPrevious: 320000,
        eventType: 'INSERT',
        characters: 'Media sosial telah menjadi bagian tak terpisahkan dari kehidupan remaja modern.',
        cursorPosition: 79,
        contentLength: 79,
        contentSnapshot: 'Media sosial telah menjadi bagian tak terpisahkan dari kehidupan remaja modern.',
      },
    ],
  })

  // Create analysis report
  await prisma.writingAnalysisReport.create({
    data: {
      writingSessionId: writingSession.id,
      overallVerdict: 'SUSPICIOUS',
      confidenceScore: 35,
      flags: JSON.stringify([
        {
          type: 'PASTE_DETECTED',
          severity: 'WARNING',
          timestamp: 320000,
          description: '79 karakter muncul dalam 0ms setelah jeda panjang',
          evidence: { charCount: 79, durationMs: 0 },
        },
      ]),
      metrics: JSON.stringify({
        finalWordCount: 45,
        totalDurationMs: 1800000,
        averageWPM: 3,
        backspaceCount: 2,
        pasteAttempts: 1,
        longestPauseMs: 320000,
        averagePauseMs: 160000,
        focusLossCount: 1,
        revisionRatio: 0.04,
      }),
    },
  })
  console.log('✅ Writing session with analysis report created!')

  console.log('\n🎉 Database seeding selesai!')
  console.log('\nAkun demo:')
  console.log('  👩‍🏫 Guru   : guru@thinkstep.demo  / demo123')
  console.log('  👨‍🎓 Siswa 1: andi@thinkstep.demo  / demo123')
  console.log('  👨‍🎓 Siswa 2: budi@thinkstep.demo  / demo123')
  console.log('  👨‍🎓 Siswa 3: citra@thinkstep.demo / demo123')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
