import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import { streamOllamaChat, checkOllamaAvailability, OllamaMessage } from '@/lib/ai/ollama-client'
import { streamGeminiChat, GeminiMessage } from '@/lib/ai/gemini-client'
import { containsDirectAnswer } from '@/lib/ai/answer-guard'

// Check internet connectivity by pinging a reliable endpoint
async function checkInternetConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);
    return res.status === 204 || res.ok;
  } catch {
    // Fallback: try another endpoint
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
      const res2 = await fetch('https://dns.google/resolve?name=google.com&type=A', {
        method: 'GET',
        signal: controller2.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId2);
      return res2.ok;
    } catch {
      return false;
    }
  }
}

export const maxDuration = 60; // Allow 60s for AI to stream

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 })

    const user = session.user as any
    const activeExam = await prisma.exam.findFirst({
      where: {
        schoolId: user.schoolId || 'no-school',
        targetGrade: user.gradeLevel,
        isActive: true,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
      },
    })

    if (activeExam) {
      return new NextResponse('Mode Ujian Aktif - AI tidak tersedia', { status: 403 })
    }

    const body = await req.json()
    const { sessionId, content } = body

    if (!sessionId || !content) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const learningSession = await prisma.learningSession.findUnique({
      where: { id: sessionId }
    })

    if (!learningSession || learningSession.userId !== user.id) {
      return new NextResponse('Session not found', { status: 404 })
    }

    if (learningSession.isCompleted) {
      return new NextResponse('Session already completed', { status: 400 })
    }

    // Save user message
    await prisma.message.create({
      data: {
        sessionId,
        role: 'USER',
        content,
      }
    })

    // Get previous messages to build history
    const previousMessages = await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    })

    // Setup streaming
    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          const systemPrompt = `Kamu adalah Lumina AI, asisten tutor pintar dari platform ThinkStep. 
Tugasmu adalah membantu siswa memahami suatu konsep atau menyelesaikan masalah dengan metode Sokrates (membimbing dengan pertanyaan, bukan memberi jawaban langsung).

ATURAN SANGAT PENTING (MUTLAK):
1. DILARANG KERAS memberikan jawaban akhir langsung atau kesimpulan untuk MATA PELAJARAN APAPUN (Matematika, Biologi, Sejarah, Geografi, dll). Kamu harus memancing siswa untuk mengingat atau berpikir kritis.
2. DILARANG PERNAH membuatkan kalimat, paragraf, esai, atau ringkasan secara utuh untuk siswa.
3. PENGECUALIAN RUMUS: Jika siswa secara eksplisit meminta RUMUS (contoh: "Apa rumus energi kinetik?"), BERIKAN RUMUS TERSEBUT secara langsung, tetapi JANGAN menghitungkan angka/soalnya.
4. Selalu tanyakan kembali pemahaman siswa atau bimbing mereka ke langkah selanjutnya.
5. Gunakan gaya bahasa yang ramah, santai, dan memotivasi. Sapa siswa dengan baik jika ini awal percakapan.
6. Gunakan Markdown untuk format teks.
7. Jika siswa bertanya hal di luar pendidikan, arahkan kembali ke topik pembelajaran secara sopan.`

          const ollamaMessages: OllamaMessage[] = [
            { role: 'system', content: systemPrompt },
            ...previousMessages.map(m => ({
              role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
              content: m.content,
            })),
          ]
          
          const geminiMessages: GeminiMessage[] = previousMessages.map(m => ({
            role: m.role === 'USER' ? 'user' as const : 'model' as const,
            content: m.content,
          }))

          let isOnline = false
          try {
            isOnline = await checkInternetConnectivity()
          } catch {
            isOnline = false
          }

          const hasGemini = !!process.env.GEMINI_API_KEY
          console.log(`[AI Router] isOnline=${isOnline}, hasGemini=${hasGemini}, key_prefix=${process.env.GEMINI_API_KEY?.slice(0, 8) ?? 'NONE'}`)

          let fullResponse = ''
          let isDirectAnswerFound = false
          let isControllerClosed = false  // Guard against double-close

          const safeClose = () => {
            if (!isControllerClosed) {
              isControllerClosed = true
              controller.close()
            }
          }

          const handleChunk = (chunk: string) => {
            if (isControllerClosed) return
            fullResponse += chunk
            if (!isDirectAnswerFound) {
              if (containsDirectAnswer(fullResponse)) {
                isDirectAnswerFound = true
                controller.enqueue(encoder.encode(' [Saya hampir memberikan jawaban langsung. Mari kita kembali ke proses berpikirmu!]'))
                safeClose()
              } else {
                controller.enqueue(encoder.encode(chunk))
              }
            }
          }

          const handleComplete = async () => {
            if (!isDirectAnswerFound) {
              await prisma.message.create({ data: { sessionId, role: 'ASSISTANT', content: fullResponse } })
              safeClose()
            } else {
              const fallback = 'Maaf, saya hampir memberikan jawaban. Ceritakan lagi langkah apa yang sudah kamu pahami?'
              await prisma.message.create({ data: { sessionId, role: 'ASSISTANT', content: fallback } })
              // controller was already closed in handleChunk when isDirectAnswerFound was set
            }
          }

          let geminiFailedWithoutStreaming = false;

          if (isOnline && hasGemini) {
            // Use Gemini
            await new Promise<void>((resolve) => {
              streamGeminiChat(
                systemPrompt,
                geminiMessages,
                handleChunk,
                () => { handleComplete().then(resolve); },
                (error: Error) => {
                  console.error('Gemini error:', error);
                  if (fullResponse.length === 0) {
                    geminiFailedWithoutStreaming = true;
                    resolve();
                  } else {
                    const errorMsg = "\n\n[Maaf, terjadi kesalahan pada koneksi Gemini AI: " + error.message + "]";
                    controller.enqueue(encoder.encode(errorMsg));
                    prisma.message.create({ data: { sessionId, role: 'ASSISTANT', content: fullResponse + errorMsg } }).then(() => {
                      safeClose();
                      resolve();
                    });
                  }
                }
              )
            });

            if (!geminiFailedWithoutStreaming) {
              return;
            }
            console.log("Gemini failed before streaming, falling back to Ollama or Demo mode...");
          }

          // Fallback to Ollama
          const isOllamaOnline = await checkOllamaAvailability()

          if (!isOllamaOnline) {
            // Demo mode fallback
            const demoResponses = [
              'Pertanyaan yang bagus! Coba pikirkan dulu — apa yang sudah kamu ketahui tentang topik ini?',
              'Menarik! Kalau kita lihat dari sudut pandang berbeda, apa yang menurutmu menjadi kunci persoalan ini?',
              'Hebat! Kamu sudah dekat. Sekarang, bagaimana cara kamu membuktikan jawabanmu?',
            ]
            const demo = demoResponses[Math.floor(Math.random() * demoResponses.length)]
            controller.enqueue(encoder.encode(demo))
            await prisma.message.create({ data: { sessionId, role: 'ASSISTANT', content: demo } })
            safeClose()
            return
          }

          // Stream from Ollama — handleComplete will save message and close controller
          await streamOllamaChat(
            ollamaMessages,
            handleChunk,
            handleComplete,
            (error: Error) => {
              try { controller.error(error) } catch (_) {}
            }
          )
          // NOTE: Do NOT save or close here — handleComplete already did it
        } catch (error) {
          console.error("Streaming error:", error)
          try { controller.error(error) } catch (_) {}
        }
      }
    })

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
