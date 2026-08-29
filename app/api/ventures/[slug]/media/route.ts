import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'image' | 'video' | 'document' | 'all'
  const featuredOnly = searchParams.get('featured') === '1'

  try {
    const { data: venture } = await supabase
      .from('ventures')
      .select('id, show_in_explore')
      .eq('slug', slug)
      .maybeSingle()

    if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

    const isMember = user && await supabase.rpc('is_venture_owner_or_member', {
      p_venture_id: venture.id,
      p_user_id: user.id
    })

    let query = supabase
      .from('venture_media_assets')
      .select('*')
      .eq('venture_id', venture.id)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    // Privacy filter
    if (!isMember) {
      query = query.eq('visibility', 'public')
    }

    if (type && type !== 'all') {
      query = query.eq('media_type', type)
    }

    if (featuredOnly) {
      query = query.eq('featured', true)
    }

    const { data: media, error } = await query

    if (error) throw error

    return NextResponse.json({ media: media || [] })
  } catch (e: any) {
    console.error('List media error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to fetch media' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: venture } = await supabase
      .from('ventures')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

    const isMember = await supabase.rpc('is_venture_owner_or_member', {
      p_venture_id: venture.id,
      p_user_id: user.id
    })

    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string || null
    const description = formData.get('description') as string || null
    const visibility = (formData.get('visibility') as string) || 'public'
    const featured = formData.get('featured') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Determine media type
    let mediaType: 'image' | 'video' | 'document' | 'other' = 'other'
    if (file.type.startsWith('image/')) mediaType = 'image'
    else if (file.type.startsWith('video/')) mediaType = 'video'
    else if (file.type.includes('pdf') || file.type.includes('word') || file.type.includes('document')) mediaType = 'document'

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'bin'
    const storagePath = `${venture.id}/media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('ventures')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadErr) throw uploadErr

    const { data: { publicUrl } } = supabase.storage.from('ventures').getPublicUrl(storagePath)

    // Insert database record
    const { data: asset, error: dbErr } = await supabase
      .from('venture_media_assets')
      .insert({
        venture_id: venture.id,
        storage_bucket: 'ventures',
        storage_path: storagePath,
        asset_url: publicUrl,
        media_type: mediaType,
        mime_type: file.type,
        file_size_bytes: file.size,
        title: title || file.name,
        description,
        visibility,
        featured,
        processing_status: 'ready',
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbErr) throw dbErr

    // Audit & Outbox
    await supabase.rpc('fn_venture_audit', {
      p_venture_id: venture.id,
      p_action: 'media.uploaded',
      p_target_type: 'media',
      p_target_id: asset.id,
      p_after: asset
    })

    return NextResponse.json({ success: true, asset })
  } catch (e: any) {
    console.error('Upload media error:', e)
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}