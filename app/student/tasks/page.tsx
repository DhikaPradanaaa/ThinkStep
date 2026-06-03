'use client'


import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import AppLayout from '@/components/layout/AppLayout'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus, Loader2, CheckCircle2, Circle, Clock, AlertCircle,
  Pencil, Trash2, X, BookOpen, Calendar,
  ListTodo, Flame, Filter, Save,
} from 'lucide-react'

// ── Types ──
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

interface Task {
  id: string
  title: string
  description: string | null
  subject: string | null
  deadline: string | null
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

interface TaskForm {
  title: string
  description: string
  subject: string
  deadline: string
  priority: TaskPriority
}

// ── Constants ──
const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  HIGH: { label: 'Tinggi', color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-500' },
  MEDIUM: { label: 'Sedang', color: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-400' },
  LOW: { label: 'Rendah', color: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-400' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: any; color: string; bg: string }> = {
  TODO: { label: 'Belum Dimulai', icon: Circle, color: 'text-ink-400', bg: 'bg-ink-100' },
  IN_PROGRESS: { label: 'Sedang Dikerjakan', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  DONE: { label: 'Selesai', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
}

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
}

const SUBJECTS = [
  'Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris',
  'PKn', 'Seni Budaya', 'Penjaskes', 'Informatika', 'Agama', 'Lainnya',
]

const EMPTY_FORM: TaskForm = {
  title: '',
  description: '',
  subject: '',
  deadline: '',
  priority: 'MEDIUM',
}

// ── Modal Komponen ──
function TaskModal({
  open,
  onClose,
  onSave,
  initial,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSave: (form: TaskForm) => void
  initial?: Task | null
  loading: boolean
}) {
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM)

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          title: initial.title,
          description: initial.description || '',
          subject: initial.subject || '',
          deadline: initial.deadline
            ? new Date(initial.deadline).toISOString().slice(0, 16)
            : '',
          priority: initial.priority,
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [open, initial])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-border scale-in overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface-alt/50">
          <h2 className="text-heading-sm text-ink-900">
            {initial ? '✏️ Edit Tugas' : '➕ Tambah Tugas Baru'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-ink-100 hover:text-ink-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Judul Tugas <span className="text-danger-main">*</span>
            </label>
            <input
              name="title"
              type="text"
              className="input-base"
              placeholder="cth. Kerjakan PR Matematika Bab 5"
              value={form.title}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Deskripsi <span className="text-text-muted font-normal">(opsional)</span>
            </label>
            <textarea
              name="description"
              className="input-base resize-none"
              placeholder="Tambahkan catatan atau detail tugas..."
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Mata Pelajaran */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Mata Pelajaran
              </label>
              <select
                name="subject"
                className="input-base cursor-pointer"
                value={form.subject}
                onChange={handleChange}
              >
                <option value="">— Pilih —</option>
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Prioritas */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5">
                Prioritas
              </label>
              <select
                name="priority"
                className="input-base cursor-pointer"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="LOW">🔵 Rendah</option>
                <option value="MEDIUM">🟡 Sedang</option>
                <option value="HIGH">🔴 Tinggi</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">
              Deadline <span className="text-text-muted font-normal">(opsional)</span>
            </label>
            <input
              name="deadline"
              type="datetime-local"
              className="input-base cursor-pointer"
              value={form.deadline}
              onChange={handleChange}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-3 shadow-lg shadow-brand-main/20"
              disabled={loading || !form.title.trim()}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  {initial ? 'Simpan' : 'Tambah'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Task Card ──
function TaskCard({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  loadingId,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onToggleStatus: (task: Task) => void
  loadingId: string | null
}) {
  const statusCfg = STATUS_CONFIG[task.status]
  const priorityCfg = PRIORITY_CONFIG[task.priority]
  const StatusIcon = statusCfg.icon
  const isLoading = loadingId === task.id

  const isOverdue =
    task.deadline &&
    task.status !== 'DONE' &&
    new Date(task.deadline) < new Date()

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
        task.status === 'DONE'
          ? 'border-emerald-200 bg-emerald-50/30 opacity-75'
          : isOverdue
          ? 'border-red-200'
          : 'border-border hover:border-ink-300'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Status Toggle Button */}
          <button
            onClick={() => onToggleStatus(task)}
            disabled={isLoading}
            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
              task.status === 'DONE'
                ? 'text-emerald-500 hover:text-emerald-600'
                : task.status === 'IN_PROGRESS'
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-ink-300 hover:text-ink-500'
            }`}
            title={`Ganti status ke "${STATUS_CONFIG[NEXT_STATUS[task.status]].label}"`}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <StatusIcon size={20} strokeWidth={task.status === 'DONE' ? 2.5 : 1.5} />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-semibold leading-snug mb-1 ${
                task.status === 'DONE'
                  ? 'line-through text-text-muted'
                  : 'text-ink-900'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-text-secondary mb-2 leading-relaxed line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Priority Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${priorityCfg.bg} ${priorityCfg.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                {priorityCfg.label}
              </span>

              {/* Subject Badge */}
              {task.subject && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-ink-100 text-ink-600">
                  <BookOpen size={10} />
                  {task.subject}
                </span>
              )}

              {/* Deadline Badge */}
              {task.deadline && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isOverdue
                      ? 'bg-red-100 text-red-700'
                      : 'bg-ink-50 text-ink-500'
                  }`}
                >
                  <Calendar size={10} />
                  {isOverdue && '⚠️ '}
                  {new Date(task.deadline).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              title="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-danger-main hover:bg-danger-light transition-colors"
              title="Hapus"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Content (client-side, wrapped in Suspense) ──
function TasksContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingPage, setLoadingPage] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [savingModal, setSavingModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | TaskStatus>('ALL')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // Redirect jika belum login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const url = filterStatus !== 'ALL' ? `/api/tasks?status=${filterStatus}` : '/api/tasks'
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setTasks(data.tasks)
    } catch {
      showNotification('error', 'Gagal memuat tugas.')
    } finally {
      setLoadingPage(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (status === 'authenticated') {
      setLoadingPage(true)
      loadTasks()
    }
  }, [status, loadTasks])

  function showNotification(type: 'success' | 'error', msg: string) {
    setNotification({ type, msg })
    setTimeout(() => setNotification(null), 3000)
  }

  // ── Tambah / Edit Task ──
  async function handleSaveTask(form: TaskForm) {
    setSavingModal(true)
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (editingTask) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? data.task : t))
        showNotification('success', 'Tugas berhasil diperbarui! ✅')
      } else {
        setTasks(prev => [data.task, ...prev])
        showNotification('success', 'Tugas baru berhasil ditambahkan! 🎯')
      }
      setModalOpen(false)
      setEditingTask(null)
    } catch (err: any) {
      showNotification('error', err.message || 'Gagal menyimpan tugas.')
    } finally {
      setSavingModal(false)
    }
  }

  // ── Toggle Status ──
  async function handleToggleStatus(task: Task) {
    const nextStatus = NEXT_STATUS[task.status]
    setLoadingId(task.id)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTasks(prev => prev.map(t => t.id === task.id ? data.task : t))
      if (nextStatus === 'DONE') showNotification('success', 'Tugas selesai! 🎉')
    } catch {
      showNotification('error', 'Gagal mengubah status.')
    } finally {
      setLoadingId(null)
    }
  }

  // ── Hapus Task ──
  async function handleDelete(id: string) {
    setDeletingId(id)
    // Optimistic update
    const prev = tasks
    setTasks(t => t.filter(task => task.id !== id))
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setTasks(prev)
        showNotification('error', 'Gagal menghapus tugas.')
      } else {
        showNotification('success', 'Tugas berhasil dihapus.')
      }
    } catch {
      setTasks(prev)
      showNotification('error', 'Terjadi kesalahan.')
    } finally {
      setDeletingId(null)
    }
  }

  function openAdd() {
    setEditingTask(null)
    setModalOpen(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setModalOpen(true)
  }

  // ── Stats ──
  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    overdue: tasks.filter(
      t => t.deadline && t.status !== 'DONE' && new Date(t.deadline) < new Date()
    ).length,
  }

  const filteredTasks =
    filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus)

  const userName = session?.user?.name ?? 'Siswa'
  const avatarColor = (session?.user as any)?.avatarColor

  if (status === 'loading' || loadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-ink-400 mx-auto mb-3" />
          <p className="text-text-muted text-sm">Memuat tugas...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout role="STUDENT" userName={userName} avatarColor={avatarColor}>
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold slide-up ${
            notification.type === 'success'
              ? 'bg-success-light text-success-dark border-success-main/30'
              : 'bg-danger-light text-danger-dark border-danger-main/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {notification.msg}
        </div>
      )}

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 fade-in">
          <div>
            <h1 className="text-display-sm text-ink-900 mb-1">Tugas Pribadi 📋</h1>
            <p className="text-body-sm text-text-secondary">
              Kelola dan pantau progress tugas belajarmu
            </p>
          </div>
          <button
            id="add-task-btn"
            onClick={openAdd}
            className="btn-primary py-3 px-5 shadow-lg shadow-brand-main/20 shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Tambah Tugas</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 slide-up">
          {[
            { label: 'Total', value: stats.total, icon: ListTodo, color: 'text-ink-600', bg: 'bg-ink-100' },
            { label: 'Dikerjakan', value: stats.inProgress, icon: Flame, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Selesai', value: stats.done, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Terlambat', value: stats.overdue, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink-900 leading-none">{value}</p>
                <p className="text-xs text-text-muted font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 slide-up">
          <Filter size={14} className="text-text-muted shrink-0" />
          {[
            { value: 'ALL', label: 'Semua' },
            { value: 'TODO', label: '⚪ Belum' },
            { value: 'IN_PROGRESS', label: '🟡 Dikerjakan' },
            { value: 'DONE', label: '✅ Selesai' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                filterStatus === value
                  ? 'bg-ink-900 text-white shadow-md'
                  : 'bg-white border border-border text-text-secondary hover:border-ink-400 hover:text-ink-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 slide-up">
            <div className="w-20 h-20 rounded-3xl bg-ink-100 flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner">
              {filterStatus === 'DONE' ? '🏆' : filterStatus === 'IN_PROGRESS' ? '⚡' : '📋'}
            </div>
            <h3 className="text-heading-sm text-ink-900 mb-2">
              {filterStatus === 'ALL'
                ? 'Belum ada tugas'
                : filterStatus === 'DONE'
                ? 'Belum ada tugas selesai'
                : filterStatus === 'IN_PROGRESS'
                ? 'Tidak ada tugas yang sedang dikerjakan'
                : 'Tidak ada tugas baru'}
            </h3>
            <p className="text-text-muted text-sm mb-6">
              {filterStatus === 'ALL'
                ? 'Mulai dengan menambahkan tugas pertamamu!'
                : 'Coba ganti filter untuk melihat tugas lain'}
            </p>
            {filterStatus === 'ALL' && (
              <button onClick={openAdd} className="btn-primary py-3 px-6 shadow-lg shadow-brand-main/20">
                <Plus size={18} /> Tambah Tugas Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 slide-up">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                loadingId={loadingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null) }}
        onSave={handleSaveTask}
        initial={editingTask}
        loading={savingModal}
      />
    </AppLayout>
  )
}

// ── Default Export with dynamic import (prevents SSR of useSession) ──
const TasksPageDynamic = dynamic(() => Promise.resolve(TasksContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-ink-400 mx-auto mb-3" />
        <p className="text-text-muted text-sm">Memuat...</p>
      </div>
    </div>
  ),
})

export default function TasksPage() {
  return <TasksPageDynamic />
}
