import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MAX_IMAGE_SIZE = 20 * 1024 * 1024   // 20 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024  // 500 MB
const MAX_DOC_SIZE = 100 * 1024 * 1024    // 100 MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: venture } = await supabase
    .from('ventures')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!venture) return NextResponse.json({ error: 'Venture not found' }, { status: 404 })

  const isOwner = await supabase.rpc('is_venture_owner_or_member', {
    p_venture_id: venture.id,
    p_user_id: user.id
  })

  if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { file_name, mime_type, file_size } = body

    if (!file_name || !mime_type || file_size === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // ─── Determine media type & validate ───
    let mediaType: 'image' | 'video' | 'document' | 'other' = 'other'
    let maxSize = MAX_DOC_SIZE

    if (ALLOWED_IMAGE_TYPES.includes(mime_type)) {
      mediaType = 'image'
      maxSize = MAX_IMAGE_SIZE
    } else if (ALLOWED_VIDEO_TYPES.includes(mime_type)) {
      mediaType = 'video'
      maxSize = MAX_VIDEO_SIZE
    } else if (ALLOWED_DOC_TYPES.includes(mime_type)) {
      mediaType = 'document'
      maxSize = MAX_DOC_SIZE
    } else {
      return NextResponse.json({
        error: `Unsupported file type: ${mime_type}`
      }, { status: 400 })
    }

    if (file_size > maxSize) {
      return NextResponse.json({
        error: `File too large. Max ${Math.round(maxSize / (1024 * 1024))}MB for ${mediaType}`
      }, { status: 400 })
    }

    // ─── Generate signed upload URL ───
    const ext = file_name.split('.').pop() || mime_type.split('/')[1]
    const cleanExt = ext.replace(/[^a-z0-9]/gi, '').slice(0, 8)
    const storagePath = `${venture.id}/media/${mediaType}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${cleanExt}`

    const { data: signed, error: signErr } = await supabase.storage
      .from('ventures')
      .createSignedUploadUrl(storagePath)

    if (signErr || !signed) {
      console.error('Sign URL error:', signErr)
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ventures')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      upload_url: signed.signedUrl,
      upload_token: signed.token,
      storage_path: storagePath,
      public_url: publicUrl,
      media_type: mediaType,
    })
  } catch (e: any) {
    console.error('Media upload URL error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}