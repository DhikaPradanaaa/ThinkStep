import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });
    const user = session.user as any;

    const formData = await req.formData();
    const sessionId = formData.get('sessionId') as string;
    const text = formData.get('text') as string | null;
    const file = formData.get('file') as File | null;

    if (!sessionId || (!text && !file)) {
      return new NextResponse('Bad Request: Missing data', { status: 400 });
    }

    const learningSession = await prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { question: true, messages: true },
    });

    if (!learningSession || learningSession.userId !== user.id) {
      return new NextResponse('Not found', { status: 404 });
    }

    let fileUrl = null;
    let mimeType = null;
    let base64Data = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      
      // Basic sanitize filename
      const originalName = file.name || 'image.jpg';
      const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const filename = `${Date.now()}-${safeName}`;
      
      await writeFile(join(uploadDir, filename), buffer);
      fileUrl = `/uploads/${filename}`;
      
      mimeType = file.type || 'image/jpeg';
      base64Data = buffer.toString('base64');
    }

    // Call Gemini to evaluate
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Anda adalah guru penilai.
Tugas Anda adalah menilai jawaban siswa berdasarkan soal berikut:
Topik: ${learningSession.question?.topic}
Pertanyaan: ${learningSession.question?.content}
Kunci Jawaban yang Benar: ${learningSession.question?.correctAnswer}

Jawaban siswa (teks): ${text || 'Tidak ada teks.'}
${file ? 'Siswa juga mengunggah gambar penyelesaian (lihat lampiran gambar).' : ''}

Berikan penilaian dari 0 hingga 100.
Berikan feedback konstruktif (saran perbaikan atau pujian jika benar).
Kembalikan format JSON murni TANPA markdown block, dengan struktur persis seperti ini:
{
  "score": 85,
  "feedback": "Langkah pengerjaanmu sudah sangat baik, namun..."
}
`;

    const parts: any[] = [];
    if (file && base64Data && mimeType) {
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType,
        }
      });
    }
    parts.push({ text: prompt });

    let score = 0;
    let feedback = 'Tidak ada feedback';
    let isCorrect = false;

    try {
      const result = await model.generateContent(parts);
      const responseText = result.response.text();
      
      try {
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        score = typeof parsed.score === 'number' ? parsed.score : 0;
        feedback = parsed.feedback || feedback;
      } catch (e) {
        console.error('Failed to parse Gemini response', responseText);
        feedback = responseText;
      }
      isCorrect = score >= 70;
    } catch (aiError: any) {
      console.warn('Gemini API failed during submission:', aiError.message);
      feedback = "Maaf, AI saat ini sedang sibuk (terkena limit). Jawabanmu telah berhasil disimpan dan diteruskan ke Guru untuk dinilai secara manual.";
      score = 0;
      isCorrect = false;
    }

    // Update DB
    await prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        isCompleted: true,
        finalAnswerText: text,
        finalAnswerImageUrl: fileUrl,
        aiScore: score,
        aiFeedback: feedback,
        isCorrect: isCorrect,
        endedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, score, feedback });
  } catch (error: any) {
    console.error('Submit API Error:', error);
    return new NextResponse(`Internal Error: ${error?.message || 'Unknown'}`, { status: 500 });
  }
}
