// Content Validator — ThinkStep Anti-AI Writing Engine
// Validates submitted essay/writing content for quality, completeness, and integrity

export interface ContentValidationResult {
  isValid: boolean
  wordCount: number
  sentenceCount: number
  paragraphCount: number
  errors: ContentValidationError[]
  warnings: ContentValidationWarning[]
}

export interface ContentValidationError {
  code: string
  message: string
}

export interface ContentValidationWarning {
  code: string
  message: string
}

export interface ContentValidationOptions {
  minWordCount?: number
  maxWordCount?: number
  minParagraphs?: number
  requireProperSentences?: boolean
}

/**
 * Counts words in a text string.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/**
 * Counts sentences (splits on . ! ? followed by space or end of string).
 */
export function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(?:\s|$)/g)
  return matches ? matches.length : 0
}

/**
 * Counts paragraphs (splits on double newlines).
 */
export function countParagraphs(text: string): number {
  return text.trim().split(/\n{2,}/).filter(p => p.trim().length > 0).length
}

/**
 * Main content validation function.
 * Checks min/max word count, sentence structure, and other quality signals.
 */
export function validateContent(
  content: string,
  options: ContentValidationOptions = {}
): ContentValidationResult {
  const {
    minWordCount = 50,
    maxWordCount = 10000,
    minParagraphs = 1,
    requireProperSentences = true,
  } = options

  const errors: ContentValidationError[] = []
  const warnings: ContentValidationWarning[] = []

  const trimmed = content.trim()
  const wordCount = countWords(trimmed)
  const sentenceCount = countSentences(trimmed)
  const paragraphCount = countParagraphs(trimmed)

  // ─────────────────────────────────────
  // ERROR: Minimum word count
  // ─────────────────────────────────────
  if (wordCount < minWordCount) {
    errors.push({
      code: 'WORD_COUNT_TOO_LOW',
      message: `Tulisanmu baru ${wordCount} kata. Minimum ${minWordCount} kata diperlukan untuk submisi.`,
    })
  }

  // ─────────────────────────────────────
  // ERROR: Maximum word count
  // ─────────────────────────────────────
  if (wordCount > maxWordCount) {
    errors.push({
      code: 'WORD_COUNT_TOO_HIGH',
      message: `Tulisanmu melebihi batas maksimum ${maxWordCount} kata (saat ini: ${wordCount} kata).`,
    })
  }

  // ─────────────────────────────────────
  // ERROR: Empty content
  // ─────────────────────────────────────
  if (trimmed.length === 0) {
    errors.push({
      code: 'CONTENT_EMPTY',
      message: 'Konten tidak boleh kosong.',
    })
  }

  // ─────────────────────────────────────
  // WARNING: Missing paragraphs
  // ─────────────────────────────────────
  if (paragraphCount < minParagraphs) {
    warnings.push({
      code: 'PARAGRAPH_COUNT_LOW',
      message: `Struktur tulisanmu hanya memiliki ${paragraphCount} paragraf. Tambahkan pemisah paragraf agar lebih terstruktur.`,
    })
  }

  // ─────────────────────────────────────
  // WARNING: No proper sentences detected
  // ─────────────────────────────────────
  if (requireProperSentences && wordCount > 20 && sentenceCount === 0) {
    warnings.push({
      code: 'NO_PROPER_SENTENCES',
      message: 'Tidak terdeteksi kalimat yang diakhiri tanda baca. Pastikan tulisanmu menggunakan tanda baca yang tepat.',
    })
  }

  // ─────────────────────────────────────
  // WARNING: Very repetitive content (basic check)
  // ─────────────────────────────────────
  const words = trimmed.toLowerCase().split(/\s+/)
  const wordFreq: Record<string, number> = {}
  for (const w of words) {
    const clean = w.replace(/[^a-z0-9]/gi, '')
    if (clean.length > 3) wordFreq[clean] = (wordFreq[clean] ?? 0) + 1
  }
  const maxFreq = Math.max(...Object.values(wordFreq))
  if (wordCount > 50 && maxFreq > wordCount * 0.15) {
    const mostRepeated = Object.entries(wordFreq).find(([, freq]) => freq === maxFreq)?.[0]
    warnings.push({
      code: 'HIGH_WORD_REPETITION',
      message: `Kata "${mostRepeated}" diulang ${maxFreq} kali — coba gunakan variasi kata agar tulisanmu lebih kaya.`,
    })
  }

  return {
    isValid: errors.length === 0,
    wordCount,
    sentenceCount,
    paragraphCount,
    errors,
    warnings,
  }
}

/**
 * Quick check: is this content long enough for analysis?
 */
export function isContentAnalyzable(content: string, minWords = 30): boolean {
  return countWords(content) >= minWords
}

/**
 * Sanitize content before saving (trim, normalize whitespace).
 */
export function sanitizeContent(content: string): string {
  return content
    .trim()
    .replace(/\r\n/g, '\n')    // Normalize line endings
    .replace(/\t/g, ' ')       // Replace tabs with spaces
    .replace(/ {2,}/g, ' ')    // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
}
