// Anti-AI Detection Engine — ThinkStep Backend v2
import { prisma } from '@/lib/db'

// Async wrapper called after submission — reads events from DB, runs analysis, saves report
export async function analyzeWritingSession(writingSessionId: string): Promise<void> {
  try {
    const session = await prisma.writingSession.findUnique({
      where: { id: writingSessionId },
      include: {
        events: { orderBy: { sequenceNumber: 'asc' } },
        pasteAttempts: true,
      },
    })

    if (!session) return

    const report = analyzeWritingEvents(
      session.events,
      {
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
      },
      writingSessionId
    )

    await prisma.writingAnalysisReport.upsert({
      where: { writingSessionId },
      create: {
        writingSessionId,
        overallVerdict: report.overallVerdict,
        confidenceScore: report.confidenceScore,
        flags: JSON.stringify(report.flags),
        metrics: JSON.stringify(report.metrics),
      },
      update: {
        overallVerdict: report.overallVerdict,
        confidenceScore: report.confidenceScore,
        flags: JSON.stringify(report.flags),
        metrics: JSON.stringify(report.metrics),
        generatedAt: new Date(),
      },
    })

    console.log(`[AntiAI] Session ${writingSessionId}: ${report.overallVerdict} (${report.confidenceScore}% confidence)`)
  } catch (error) {
    console.error('[AntiAI] Analysis failed:', error)
  }
}

export interface WritingMetrics {
  finalWordCount: number;
  totalDurationMs: number;
  averageWPM: number;
  backspaceCount: number;
  pasteAttempts: number;
  longestPauseMs: number;
  averagePauseMs: number;
  focusLossCount: number;
  revisionRatio: number;
}

export interface DetectionFlag {
  type: FlagType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: number;
  description: string;
  evidence: Record<string, unknown>;
}

export type FlagType =
  | 'PASTE_DETECTED'
  | 'ZERO_REVISION'
  | 'UNNATURAL_SPEED'
  | 'NO_THINKING_PAUSE'
  | 'LATE_START_RAPID_FILL'
  | 'FOCUS_LOSS_DETECTED'
  | 'PERFECT_FIRST_DRAFT';

export interface AnalysisReport {
  writingSessionId: string;
  overallVerdict: 'HUMAN' | 'SUSPICIOUS' | 'LIKELY_AI';
  confidenceScore: number;
  flags: DetectionFlag[];
  metrics: WritingMetrics;
  generatedAt: Date;
}

interface WritingEventLike {
  eventType: string;
  characters?: string | null;
  deleteCount?: number | null;
  cursorPosition: number;
  contentLength: number;
  absoluteTimestamp: bigint | number;
  deltaFromPrevious: number;
  sequenceNumber: number;
  contentSnapshot?: string | null;
}

interface WritingSessionLike {
  startedAt: Date;
  submittedAt?: Date | null;
}

// Thresholds (can be tuned via env)
const PASTE_SPEED_THRESHOLD_MS = Number(process.env.ANTIHAI_PASTE_SPEED_THRESHOLD_MS ?? 100);
const PASTE_MIN_CHARS = 50;
const MAX_HUMAN_WPM = Number(process.env.ANTIHAI_MAX_HUMAN_WPM ?? 120);
const MIN_WORDS_FOR_REVISION_CHECK = Number(process.env.ANTIHAI_MIN_WORDS_FOR_REVISION_CHECK ?? 150);
const MIN_PAUSE_BETWEEN_PARAGRAPHS_MS = Number(process.env.ANTIHAI_MIN_PARAGRAPH_PAUSE_MS ?? 3000);
const LATE_START_THRESHOLD_MS = Number(process.env.ANTIHAI_LATE_START_THRESHOLD_MINS ?? 5) * 60 * 1000;
const RAPID_FILL_THRESHOLD_MINS = Number(process.env.ANTIHAI_RAPID_FILL_THRESHOLD_MINS ?? 3);

export function analyzeWritingEvents(
  events: WritingEventLike[],
  session: WritingSessionLike,
  writingSessionId: string
): AnalysisReport {
  const flags: DetectionFlag[] = [];
  const metrics = computeMetrics(events, session);
  const sessionStartMs = session.startedAt.getTime();

  // ─────────────────────────────────────
  // CEK 1: PASTE SPIKE
  // ─────────────────────────────────────
  for (const event of events) {
    if (
      event.eventType === 'INSERT' &&
      event.characters &&
      event.characters.length >= PASTE_MIN_CHARS &&
      event.deltaFromPrevious < PASTE_SPEED_THRESHOLD_MS
    ) {
      flags.push({
        type: 'PASTE_DETECTED',
        severity: 'CRITICAL',
        timestamp: Number(event.absoluteTimestamp) - sessionStartMs,
        description: `${event.characters.length} karakter muncul dalam ${event.deltaFromPrevious}ms — lebih cepat dari kecepatan ketik manusia`,
        evidence: {
          charCount: event.characters.length,
          durationMs: event.deltaFromPrevious,
          charsPerSecond: (event.characters.length / Math.max(event.deltaFromPrevious, 1)) * 1000,
        },
      });
    }
  }

  // ─────────────────────────────────────
  // CEK 2: ZERO REVISION
  // ─────────────────────────────────────
  const backspaceCount = events.filter(e => e.eventType === 'DELETE_BACK').length;
  if (metrics.finalWordCount >= MIN_WORDS_FOR_REVISION_CHECK && backspaceCount === 0) {
    flags.push({
      type: 'ZERO_REVISION',
      severity: 'WARNING',
      timestamp: 0,
      description: `Tidak ada backspace dalam ${metrics.finalWordCount} kata — penulisan manusia hampir selalu mengandung koreksi`,
      evidence: { wordCount: metrics.finalWordCount, backspaceCount: 0 },
    });
  }

  // ─────────────────────────────────────
  // CEK 3: UNNATURAL TYPING SPEED
  // ─────────────────────────────────────
  const WINDOW_SIZE = 30;
  for (let i = WINDOW_SIZE; i < events.length; i++) {
    const window = events.slice(i - WINDOW_SIZE, i);
    const windowWPM = computeWindowWPM(window);
    if (windowWPM > MAX_HUMAN_WPM) {
      flags.push({
        type: 'UNNATURAL_SPEED',
        severity: 'WARNING',
        timestamp: Number(events[i].absoluteTimestamp) - sessionStartMs,
        description: `Kecepatan mengetik mencapai ${windowWPM} WPM — melebihi batas manusia normal (${MAX_HUMAN_WPM} WPM)`,
        evidence: { measuredWPM: windowWPM, threshold: MAX_HUMAN_WPM },
      });
      i += WINDOW_SIZE;
    }
  }

  // ─────────────────────────────────────
  // CEK 4: NO THINKING PAUSE
  // ─────────────────────────────────────
  const paragraphBreaks = events.filter(e =>
    e.eventType === 'INSERT' && e.characters === '\n\n'
  );
  for (const paraEvent of paragraphBreaks) {
    if (paraEvent.deltaFromPrevious < MIN_PAUSE_BETWEEN_PARAGRAPHS_MS) {
      flags.push({
        type: 'NO_THINKING_PAUSE',
        severity: 'INFO',
        timestamp: Number(paraEvent.absoluteTimestamp) - sessionStartMs,
        description: `Paragraf baru dimulai hanya ${paraEvent.deltaFromPrevious}ms setelah ketikan sebelumnya`,
        evidence: { pauseDuration: paraEvent.deltaFromPrevious, threshold: MIN_PAUSE_BETWEEN_PARAGRAPHS_MS },
      });
    }
  }

  // ─────────────────────────────────────
  // CEK 5: LATE START + RAPID FILL
  // ─────────────────────────────────────
  if (events.length > 0) {
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    const timeToFirstKeystroke = Number(firstEvent.absoluteTimestamp) - sessionStartMs;
    const writingDuration = (Number(lastEvent.absoluteTimestamp) - Number(firstEvent.absoluteTimestamp)) / 60000;

    if (
      timeToFirstKeystroke > LATE_START_THRESHOLD_MS &&
      writingDuration < RAPID_FILL_THRESHOLD_MINS &&
      metrics.finalWordCount > 200
    ) {
      flags.push({
        type: 'LATE_START_RAPID_FILL',
        severity: 'WARNING',
        timestamp: timeToFirstKeystroke,
        description: `Menunggu ${Math.round(timeToFirstKeystroke / 60000)} menit sebelum mulai, lalu ${metrics.finalWordCount} kata selesai dalam ${writingDuration.toFixed(1)} menit`,
        evidence: { timeToFirstKeystroke, writingDuration, wordCount: metrics.finalWordCount },
      });
    }
  }

  // ─────────────────────────────────────
  // CEK 6: FOCUS LOSS
  // ─────────────────────────────────────
  const focusLossEvents = events.filter(e => e.eventType === 'BLUR');
  if (focusLossEvents.length > 2) {
    flags.push({
      type: 'FOCUS_LOSS_DETECTED',
      severity: 'INFO',
      timestamp: 0,
      description: `Editor kehilangan fokus ${focusLossEvents.length} kali — siswa mungkin berpindah tab`,
      evidence: { focusLossCount: focusLossEvents.length },
    });
  }

  const confidenceScore = computeConfidenceScore(flags);
  const overallVerdict = getVerdict(confidenceScore);

  return {
    writingSessionId,
    overallVerdict,
    confidenceScore,
    flags,
    metrics,
    generatedAt: new Date(),
  };
}

function computeConfidenceScore(flags: DetectionFlag[]): number {
  const WEIGHT: Record<string, number> = {
    PASTE_DETECTED: 40,
    ZERO_REVISION: 20,
    UNNATURAL_SPEED: 20,
    LATE_START_RAPID_FILL: 15,
    NO_THINKING_PAUSE: 5,
    FOCUS_LOSS_DETECTED: 5,
    PERFECT_FIRST_DRAFT: 10,
  };

  let score = 0;
  for (const flag of flags) {
    score += (WEIGHT[flag.type] ?? 5) * (flag.severity === 'CRITICAL' ? 1.5 : 1);
  }
  return Math.min(100, Math.round(score));
}

function getVerdict(score: number): 'HUMAN' | 'SUSPICIOUS' | 'LIKELY_AI' {
  if (score >= 50) return 'LIKELY_AI';
  if (score >= 20) return 'SUSPICIOUS';
  return 'HUMAN';
}

function computeMetrics(events: WritingEventLike[], session: WritingSessionLike): WritingMetrics {
  const insertEvents = events.filter(e => e.eventType === 'INSERT');
  const deletes = events.filter(e => e.eventType === 'DELETE_BACK' || e.eventType === 'DELETE_FORWARD');
  const pauses = events.map(e => e.deltaFromPrevious).filter(d => d > 500);

  const totalCharsInserted = insertEvents.reduce((sum, e) => sum + (e.characters?.length ?? 0), 0);
  const submittedAt = session.submittedAt?.getTime() ?? Date.now();
  const totalDurationMs = submittedAt - session.startedAt.getTime();

  const averageWPM = totalCharsInserted > 0
    ? Math.round((totalCharsInserted / 5) / (totalDurationMs / 60000))
    : 0;

  const lastEvent = events[events.length - 1];

  return {
    finalWordCount: lastEvent?.contentLength ?? 0,
    totalDurationMs,
    averageWPM,
    backspaceCount: deletes.length,
    pasteAttempts: events.filter(e => e.eventType === 'PASTE_BLOCKED').length,
    longestPauseMs: pauses.length > 0 ? Math.max(...pauses) : 0,
    averagePauseMs: pauses.length > 0 ? pauses.reduce((a, b) => a + b, 0) / pauses.length : 0,
    focusLossCount: events.filter(e => e.eventType === 'BLUR').length,
    revisionRatio: deletes.length / Math.max(insertEvents.length, 1),
  };
}

function computeWindowWPM(window: WritingEventLike[]): number {
  const chars = window
    .filter(e => e.eventType === 'INSERT')
    .reduce((sum, e) => sum + (e.characters?.length ?? 0), 0);
  const firstTs = Number(window[0]?.absoluteTimestamp ?? 0);
  const lastTs = Number(window[window.length - 1]?.absoluteTimestamp ?? 0);
  const durationMs = lastTs - firstTs;
  if (durationMs <= 0) return 0;
  return Math.round((chars / 5) / (durationMs / 60000));
}

export interface PlaybackFrame {
  timestamp: number;
  content: string;
  cursorPos: number;
  eventType: string;
  wpmAtThisPoint?: number;
  isAnomalyFrame: boolean;
  anomalyType?: string;
}

export function buildPlaybackFrames(events: WritingEventLike[], anomalyTimestamps: Set<number>): PlaybackFrame[] {
  const frames: PlaybackFrame[] = [];
  let currentContent = '';

  for (const event of events) {
    if (event.contentSnapshot) {
      currentContent = event.contentSnapshot;
    } else if (event.eventType === 'INSERT' && event.characters) {
      const pos = event.cursorPosition - event.characters.length;
      const safePos = Math.max(0, Math.min(pos, currentContent.length));
      currentContent = currentContent.slice(0, safePos) + event.characters + currentContent.slice(safePos);
    } else if (event.eventType === 'DELETE_BACK' && event.deleteCount) {
      const pos = event.cursorPosition;
      currentContent = currentContent.slice(0, pos) + currentContent.slice(pos + event.deleteCount);
    }

    const ts = Number(event.absoluteTimestamp);
    const isAnomaly = anomalyTimestamps.has(ts);

    frames.push({
      timestamp: ts,
      content: currentContent,
      cursorPos: event.cursorPosition,
      eventType: event.eventType,
      isAnomalyFrame: isAnomaly,
    });
  }

  return frames;
}

// Reduce frames for efficient playback (1 frame per 500ms, but keep anomaly frames)
export function reduceFrames(frames: PlaybackFrame[], targetInterval = 500): PlaybackFrame[] {
  const reduced: PlaybackFrame[] = [];
  let lastTimestamp = -Infinity;

  for (const frame of frames) {
    const shouldKeep =
      frame.timestamp - lastTimestamp >= targetInterval ||
      frame.isAnomalyFrame;

    if (shouldKeep) {
      reduced.push(frame);
      lastTimestamp = frame.timestamp;
    }
  }

  return reduced;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
