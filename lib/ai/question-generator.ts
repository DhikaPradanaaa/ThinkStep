import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedQuestion {
  content: string;
  type: 'SHORT_ANSWER' | 'MULTIPLE_CHOICE' | 'ESSAY';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;
  subtopic: string;
  phase: string;
  capaianPembelajaran: string;
  hintTier1: string;
  hintTier2: string;
  hintTier3: string;
  correctAnswer: string;
  explanation: string;
  isHots: boolean;
  bloomLevel: string; // C1-C6
}

// Mapping grade level ke Fase Kurikulum Merdeka
function getPhaseForGrade(gradeLevel: string): { phase: string; phaseDesc: string } {
  const grade = gradeLevel.toLowerCase().replace('kelas', '').trim();
  const num = parseInt(grade);
  if (num <= 2) return { phase: 'Fase A', phaseDesc: 'Kelas 1-2 SD' };
  if (num <= 4) return { phase: 'Fase B', phaseDesc: 'Kelas 3-4 SD' };
  if (num <= 6) return { phase: 'Fase C', phaseDesc: 'Kelas 5-6 SD' };
  if (num <= 7) return { phase: 'Fase D', phaseDesc: 'Kelas 7 SMP' };
  if (num <= 9) return { phase: 'Fase D', phaseDesc: 'Kelas 7-9 SMP' };
  if (num <= 10) return { phase: 'Fase E', phaseDesc: 'Kelas 10 SMA' };
  return { phase: 'Fase F', phaseDesc: 'Kelas 11-12 SMA' };
}

// Topik per mapel per fase (kurikulum merdeka)
const TOPICS_BY_SUBJECT: Record<string, Record<string, string[]>> = {
  Matematika: {
    'Fase A': ['Bilangan 1-10', 'Penjumlahan dasar', 'Pengurangan dasar', 'Bentuk Geometri'],
    'Fase B': ['Perkalian', 'Pembagian', 'Bilangan bulat', 'Pecahan sederhana', 'Pengukuran'],
    'Fase C': ['Bilangan pecahan', 'Desimal', 'FPB dan KPK', 'Bangun datar', 'Perbandingan'],
    'Fase D': ['Aljabar', 'Persamaan Linear', 'Bilangan Bulat dan Pecahan', 'Himpunan', 'Statistika Dasar', 'Teorema Pythagoras', 'Peluang', 'Sistem Persamaan Linear'],
    'Fase E': ['Fungsi', 'Trigonometri', 'Statistika', 'Program Linear', 'Matriks'],
    'Fase F': ['Kalkulus', 'Vektor', 'Transformasi Geometri', 'Distribusi Probabilitas', 'Limit'],
  },
  IPA: {
    'Fase A': ['Bagian tubuh', 'Hewan sekitar', 'Tanaman', 'Cuaca'],
    'Fase B': ['Makhluk hidup', 'Benda padat-cair-gas', 'Energi dan gerak', 'Ekosistem sederhana'],
    'Fase C': ['Sistem organ tubuh', 'Rantai makanan', 'Gaya dan tekanan', 'Cahaya dan bunyi'],
    'Fase D': ['Sel dan organisme', 'Zat dan campuran', 'Gaya dan Hukum Newton', 'Sistem pencernaan', 'Suhu dan Kalor', 'Ekosistem', 'Getaran dan Gelombang', 'Genetika Dasar'],
    'Fase E': ['Kimia organik', 'Fisika modern', 'Biologi sel', 'Ekologi', 'Keseimbangan lingkungan'],
    'Fase F': ['Bioteknologi', 'Fisika nuklir', 'Kimia analitik', 'Evolusi', 'Bioetika'],
  },
  IPS: {
    'Fase A': ['Keluarga', 'Rumah', 'Lingkungan sekitar', 'Teman dan sekolah'],
    'Fase B': ['Peta dan denah', 'Sejarah daerah', 'Pekerjaan', 'Kebudayaan lokal'],
    'Fase C': ['Sejarah Indonesia', 'Geografi Indonesia', 'Ekonomi dasar', 'Keberagaman budaya'],
    'Fase D': ['Sejarah Nasional', 'Geografi fisik dan sosial', 'Ekonomi & perdagangan', 'Sosiologi dasar', 'Kewarganegaraan', 'Sejarah Dunia'],
    'Fase E': ['Sejarah modern', 'Geografi manusia', 'Sistem ekonomi', 'Sosiologi'],
    'Fase F': ['Geopolitik', 'Ekonomi makro', 'Sosiologi kontemporer', 'Sejarah kontemporer'],
  },
  'Bahasa Indonesia': {
    'Fase A': ['Membaca huruf', 'Kalimat sederhana', 'Cerita pendek', 'Kosakata dasar'],
    'Fase B': ['Paragraf', 'Teks narasi', 'Kosakata', 'Ejaan dan tanda baca'],
    'Fase C': ['Teks deskripsi', 'Teks laporan', 'Kalimat efektif', 'Puisi sederhana'],
    'Fase D': ['Teks argumentasi', 'Teks eksposisi', 'Cerpen', 'Puisi', 'Bahasa Indonesia baku', 'Surat resmi', 'Teks prosedur'],
    'Fase E': ['Esai argumentatif', 'Kritik sastra', 'Teks ilmiah', 'Novel'],
    'Fase F': ['Karya ilmiah', 'Sastra kontemporer', 'Diskusi dan debat', 'Analisis wacana'],
  },
  'Bahasa Inggris': {
    'Fase A': ['Greetings', 'Numbers and colors', 'Family members', 'Animals'],
    'Fase B': ['Simple sentences', 'Present tense', 'Daily activities', 'Classroom objects'],
    'Fase C': ['Simple paragraph', 'Past tense', 'Descriptive text', 'Telling time'],
    'Fase D': ['Narrative text', 'Descriptive text', 'Recount text', 'Simple grammar tenses', 'Procedure text', 'Report text'],
    'Fase E': ['Analytical exposition', 'Discussion text', 'Advanced grammar', 'Listening comprehension'],
    'Fase F': ['Academic writing', 'Critical analysis', 'Research-based writing', 'Complex discourse'],
  },
};

function getTodayTopic(subject: string, phase: string, dateString: string): string {
  const topics = TOPICS_BY_SUBJECT[subject]?.[phase] ?? ['Konsep Dasar'];
  // Rotate topic based on day of year so each day has a different topic
  const dayOfYear = Math.floor(
    (new Date(dateString).getTime() - new Date(new Date(dateString).getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return topics[dayOfYear % topics.length];
}

export async function generateDailyQuestions(
  subject: string,
  gradeLevel: string,
  dateString: string
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const { phase, phaseDesc } = getPhaseForGrade(gradeLevel);
  const topic = getTodayTopic(subject, phase, dateString);

  const prompt = `
Kamu adalah ahli kurikulum Kurikulum Merdeka Indonesia. 
Buatkan tepat 5 soal ${subject} untuk siswa ${gradeLevel} (${phaseDesc}).
Topik hari ini: "${topic}"
Tanggal: ${dateString}

ATURAN DISTRIBUSI SOAL (WAJIB DIIKUTI):
1. Soal 1: EASY  — Taksonomi Bloom C1 (Mengingat) — pengetahuan faktual sederhana
2. Soal 2: EASY  — Taksonomi Bloom C2 (Memahami) — pemahaman konsep
3. Soal 3: MEDIUM — Taksonomi Bloom C3 (Menerapkan) — aplikasi konsep dalam situasi
4. Soal 4: MEDIUM — Taksonomi Bloom C4 (Menganalisis) — analisis kritis
5. Soal 5: HARD  — HOTS C5/C6 (Mengevaluasi/Mencipta) — masalah kompleks, kontekstual, open-ended, membutuhkan penalaran tinggi

ATURAN KUALITAS SOAL:
- Setiap soal HARUS relevan dengan topik "${topic}" dan sesuai Kurikulum Merdeka
- Soal harus kontekstual dan bermakna (bukan hafalan semata)
- Soal HOTS (soal ke-5) harus: menggunakan konteks nyata/sehari-hari, meminta siswa mengevaluasi atau menciptakan sesuatu
- Semua soal harus dalam Bahasa Indonesia${subject === 'Bahasa Inggris' ? ' kecuali konten soal Bahasa Inggris yang boleh dalam Bahasa Inggris' : ''}
- Hint harus bertingkat: Hint 1 (metacognitive), Hint 2 (konseptual), Hint 3 (hampir jawaban)

WAJIB kembalikan HANYA array JSON valid (tanpa markdown, tanpa penjelasan tambahan) dengan format PERSIS:
[
  {
    "content": "teks soal lengkap di sini",
    "type": "SHORT_ANSWER",
    "difficulty": "EASY",
    "topic": "${topic}",
    "subtopic": "sub-topik spesifik",
    "phase": "${phase}",
    "capaianPembelajaran": "Siswa mampu...",
    "hintTier1": "pertanyaan meta-kognitif untuk memancing refleksi",
    "hintTier2": "petunjuk konseptual yang lebih spesifik",
    "hintTier3": "petunjuk yang mendekati jawaban",
    "correctAnswer": "jawaban yang benar",
    "explanation": "penjelasan lengkap mengapa jawaban ini benar",
    "isHots": false,
    "bloomLevel": "C1"
  }
]

Pastikan soal ke-5 memiliki "isHots": true dan "difficulty": "HARD".
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse JSON dari response
  const jsonStr = responseText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  let questions: GeneratedQuestion[];
  try {
    questions = JSON.parse(jsonStr);
  } catch (parseError) {
    // Try to extract JSON array from response
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (!match) throw new Error(`Failed to parse AI response: ${jsonStr.slice(0, 200)}`);
    questions = JSON.parse(match[0]);
  }

  // Validate and enforce structure
  if (!Array.isArray(questions) || questions.length !== 5) {
    throw new Error(`Expected 5 questions, got ${Array.isArray(questions) ? questions.length : 'non-array'}`);
  }

  // Force correct difficulty and HOTS assignment
  const difficultyMap: Array<'EASY' | 'MEDIUM' | 'HARD'> = ['EASY', 'EASY', 'MEDIUM', 'MEDIUM', 'HARD'];
  return questions.map((q, i) => ({
    ...q,
    difficulty: difficultyMap[i],
    isHots: i === 4, // Last question is always HOTS
    type: (q.type as any) in { SHORT_ANSWER: 1, MULTIPLE_CHOICE: 1, ESSAY: 1 }
      ? q.type
      : 'SHORT_ANSWER',
  }));
}
