export function generateWeeklyReportHTML(
  studentName: string,
  stats: {
    points: number;
    questionsSolved: number;
    autonomyIndex: number;
    hoursSpent: number;
  }
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Laporan Mingguan ThinkStep</h2>
      <p>Halo Orang Tua ${studentName},</p>
      <p>Berikut adalah ringkasan progres belajar anak Anda minggu ini:</p>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 10px;">🏆 <strong>Poin Diperoleh:</strong> ${stats.points} XP</li>
          <li style="margin-bottom: 10px;">✅ <strong>Soal Diselesaikan:</strong> ${stats.questionsSolved} Soal</li>
          <li style="margin-bottom: 10px;">🧠 <strong>Indeks Kemandirian:</strong> ${stats.autonomyIndex}%</li>
          <li>⏱️ <strong>Waktu Belajar:</strong> ${stats.hoursSpent.toFixed(1)} Jam</li>
        </ul>
      </div>

      <p>Kemandirian belajar ${studentName} berada di tingkat ${stats.autonomyIndex >= 70 ? 'Sangat Baik' : stats.autonomyIndex >= 40 ? 'Cukup Baik' : 'Butuh Bimbingan'}. Terus berikan dukungan positif!</p>
      
      <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.875rem; color: #64748b;">
        <p>ThinkStep AI - Mendampingi setiap langkah belajar.</p>
        <a href="https://thinkstep.example.com/parent/dashboard" style="color: #2563eb; text-decoration: none;">Lihat Dashboard Lengkap</a>
      </div>
    </div>
  `;
}
