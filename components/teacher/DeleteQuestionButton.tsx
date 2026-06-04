'use client'

export default function DeleteQuestionButton({ questionId, questionContent }: { questionId: string, questionContent: string }) {
  return (
    <button
      className="btn-ghost"
      style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--color-danger-main)' }}
      onClick={() => {
        if (confirm(`Hapus soal "${questionContent.slice(0, 50)}..."?`)) {
          fetch(`/api/question/${questionId}`, { method: 'DELETE' })
            .then(r => r.ok ? window.location.reload() : alert('Gagal menghapus soal'))
            .catch(() => alert('Gagal menghapus soal'))
        }
      }}
    >
      Hapus
    </button>
  )
}
