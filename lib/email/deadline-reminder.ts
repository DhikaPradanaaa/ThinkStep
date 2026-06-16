export function generateDeadlineReminderHTML(
  studentName: string,
  assignmentTitle: string,
  deadline: Date,
  daysLeft: number
): string {
  const deadlineStr = deadline.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #ef4444; text-align: center;">Pengingat Tenggat Waktu Tugas</h2>
      <p>Halo ${studentName},</p>
      <p>Ini adalah pengingat bahwa Anda memiliki tugas yang belum dikerjakan dengan sisa waktu <strong>${daysLeft} hari lagi</strong>.</p>
      
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0; color: #b91c1c;">${assignmentTitle}</h3>
        <p style="margin-bottom: 0;"><strong>Tenggat Waktu:</strong> ${deadlineStr}</p>
      </div>

      <p>Segera kerjakan dan kumpulkan tugas Anda sebelum waktu habis untuk menghindari pengurangan nilai atau status gagal.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://thinkstep.example.com/student/assignments" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Lihat Tugas Sekarang</a>
      </div>

      <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.875rem; color: #64748b; text-align: center;">
        <p>ThinkStep AI - Mendampingi setiap langkah belajar.</p>
      </div>
    </div>
  `;
}
