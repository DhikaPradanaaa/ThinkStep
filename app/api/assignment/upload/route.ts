import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string || 'general' // 'assignments' or 'submissions'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Ensure bucket exists
    const bucketName = 'attachments'
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (!buckets?.find(b => b.name === bucketName)) {
      await supabaseAdmin.storage.createBucket(bucketName, { public: true })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const originalName = file.name || 'file'
    const nameWithoutExt = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 40)
    const ext = originalName.split('.').pop() || 'dat'
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${nameWithoutExt}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filename, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 })
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filename)

    return NextResponse.json({ 
      success: true, 
      url: publicUrlData.publicUrl 
    })
  } catch (error) {
    console.error('Upload API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
