// Pattern-based detection of direct answers
const FORBIDDEN_PATTERNS = [
  /jawabannya adalah/i,
  /jawaban yang benar adalah/i,
  /hasil akhirnya/i,
  /hasilnya adalah/i,
  /the answer is/i,
  /jadi,?\s*x\s*=\s*\d+/i,
  /x\s*=\s*\d+\s*($|[^a-z])/i,
  /nilai\s*x\s*=\s*\d+/i,
  /maka\s+\w+\s*=\s*\d+\s*($|\n)/i,
  /sehingga\s+\w+\s*=\s*\d+\s*($|\n)/i,
  /jadi\s+\d+/i,
  /kunci jawaban/i,
];

const PARTIAL_FORBIDDEN = [
  /= \d{1,4}\.?\d{0,2}$/m, // equation result at end of line
];

export function containsDirectAnswer(text: string): boolean {
  // Check strict patterns
  if (FORBIDDEN_PATTERNS.some(pattern => pattern.test(text))) {
    return true;
  }
  
  // For partial patterns, only flag if it's very short response (likely just giving the answer)
  if (text.length < 100 && PARTIAL_FORBIDDEN.some(p => p.test(text))) {
    return true;
  }
  
  return false;
}

export function sanitizeAIResponse(text: string): string {
  // Remove any accidental answer reveals
  let sanitized = text;
  
  // Replace direct equation answers with ellipsis
  sanitized = sanitized.replace(/(?:jadi|sehingga|maka),?\s+\w+\s*=\s*\d+\.?\d*/gi, 
    '... (coba kamu pikirkan sendiri ya!)');
  
  return sanitized;
}

// Demo responses for when Ollama is not available
const DEMO_SOCRATIC_RESPONSES = [
  "Pertanyaan yang bagus! 🤔 Sebelum kita cari jawabannya, coba pikirkan dulu: informasi apa saja yang sudah kamu ketahui dari soal ini?",
  "Menarik! Kamu sudah cukup dekat dengan konsepnya. Coba bayangkan, kalau kamu punya situasi serupa di kehidupan nyata, kira-kira langkah apa yang pertama kali akan kamu lakukan?",
  "Bagus sekali usahamu! 💪 Nah, sekarang coba kamu lihat lagi soalnya — ada kata kunci apa yang menurutmu paling penting untuk dipahami?",
  "Hmm, menarik cara berpikirmu! Coba kita mundur sebentar — konsep dasar apa yang berhubungan dengan soal ini yang sudah kamu pelajari sebelumnya?",
  "Kamu sudah di jalur yang benar! 🌟 Sekarang, kalau kamu pecah soal ini jadi bagian-bagian yang lebih kecil, bagian mana yang menurutmu paling mudah untuk diselesaikan dulu?",
  "Wah, pertanyaanmu menunjukkan kamu sudah mulai berpikir kritis! Coba ceritakan ke saya — bagaimana cara berpikirmu sejauh ini untuk menyelesaikan soal ini?",
  "Pendekatan yang kreatif! 😊 Tapi coba kita cek dulu — apakah ada asumsi yang kamu buat yang mungkin perlu diverifikasi?",
  "Kamu hampir benar! Coba ingat-ingat kembali — ada rumus atau konsep yang pernah dipelajari yang mungkin bisa membantu di sini?",
];

const DEMO_HINT_RESPONSES: Record<number, string[]> = {
  1: [
    "[HINT-1] 💡 Konsep apa yang kamu ingat yang berhubungan dengan topik ini? Coba pikirkan apa yang sudah kamu pelajari sebelumnya tentang materi ini!",
    "[HINT-1] 💡 Sebelum menjawab, coba tanyakan ke dirimu sendiri: 'Apa yang sebenarnya ditanyakan soal ini?' Kadang memahami pertanyaannya lebih penting dari langsung mencari jawabannya.",
    "[HINT-1] 💡 Coba lihat soal ini dari sudut pandang berbeda — kalau kamu harus menjelaskan soal ini ke teman, kamu akan mulai dari mana?",
  ],
  2: [
    "[HINT-2] 💡 Ingat, dalam masalah seperti ini, biasanya ada langkah-langkah yang harus dilakukan secara berurutan. Langkah pertama yang paling logis menurut kamu apa?",
    "[HINT-2] 💡 Ada hubungannya dengan konsep yang baru dipelajari. Coba ingat-ingat — rumus atau prinsip dasar apa yang biasanya dipakai untuk masalah jenis ini?",
    "[HINT-2] 💡 Petunjuk: fokus pada hubungan antara variabel-variabel yang ada di soal. Bagaimana satu variabel mempengaruhi variabel lainnya?",
  ],
  3: [
    "[HINT-3] 💡 Ini petunjuk terakhirku untuk kamu: coba substitusikan nilai-nilai yang diketahui ke dalam rumus yang relevan, lalu sederhanakan langkah per langkah. Kamu pasti bisa! Mulai dari mana kamu akan coba?",
    "[HINT-3] 💡 Kita sudah dekat! Coba tuliskan apa yang diketahui dan apa yang dicari. Setelah itu, hubungkan keduanya — biasanya ada satu langkah kunci yang menghubungkan semuanya. Apa langkah kunci itu menurutmu?",
    "[HINT-3] 💡 Bayangkan soal ini dalam dua bagian: bagian yang diketahui dan bagian yang dicari. Jembatan antara keduanya biasanya adalah prinsip atau hukum yang relevan. Prinsip apa yang paling sesuai di sini?",
  ],
};

export function getDemoResponse(isHint: boolean, hintTier?: number): string {
  if (isHint && hintTier && DEMO_HINT_RESPONSES[hintTier]) {
    const responses = DEMO_HINT_RESPONSES[hintTier];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  return DEMO_SOCRATIC_RESPONSES[Math.floor(Math.random() * DEMO_SOCRATIC_RESPONSES.length)];
}
