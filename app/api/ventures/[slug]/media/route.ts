import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET all media for a venture
export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).single()
  if (!venture) return NextResponse.json({ media: [] })
  const { data } = await supabase.from('venture_media').select('*').eq('venture_id', venture.id).eq('is_public', true).order('position')
  return NextResponse.json({ media: data || [] })
}

// POST - upload file to storage (returns URL)
export async function POST(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).or(`user_id.eq.${user.id},founder_id.eq.${user.id}`).single()
  if (!venture) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const kind = (formData.get('kind') as string) || 'gallery'
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = venture.id + '/' + kind + '_' + Date.now() + '.' + ext
    const bucket = kind === 'video' ? 'venture-media' : 'venture-media'

    const { data: upload, error: upErr } = await supabase.storage
      .from(bucket)
      .upload(filename, file, { cacheControl: '3600', upsert: true, contentType: file.type })

    if (upErr) throw upErr

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(upload.path)
    return NextResponse.json({ url: urlData.publicUrl, path: upload.path })
  } catch (e: any) {
    console.error('Media upload error:', e)
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}

// PUT - create media entry
export async function PUT(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).or(`user_id.eq.${user.id},founder_id.eq.${user.id}`).single()
  if (!venture) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase.from('venture_media').insert({
    venture_id: venture.id,
    type: body.type || 'image',
    url: body.url,
    thumbnail_url: body.thumbnail_url,
    title: body.title,
    position: body.position || 0,
    is_public: true,
    uploaded_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ media: data })
}

// DELETE
export async function DELETE(req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase.from('ventures').select('id').eq('slug', slug).or(`user_id.eq.${user.id},founder_id.eq.${user.id}`).single()
  if (!venture) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('venture_media').delete().eq('id', id).eq('venture_id', venture.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}