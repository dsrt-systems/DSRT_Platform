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
  const category = searchParams.get('category')
  const q = searchParams.get('q')?.trim()

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
      .from('venture_documents')
      .select('id, title, slug, icon, parent_document_id, category, tags, position, visibility, is_pinned, version, updated_at, created_at, created_by')
      .eq('venture_id', venture.id)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('updated_at', { ascending: false })

    if (!isMember) {
      query = query.eq('visibility', 'public')
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (q && q.length >= 2) {
      query = query.or(`title.ilike.%${q}%,content_text.ilike.%${q}%`)
    }

    const { data: docs, error } = await query

    if (error) throw error

    return NextResponse.json({ documents: docs || [] })
  } catch (e: any) {
    console.error('List documents error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to fetch documents' }, { status: 500 })
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

    const body = await req.json().catch(() => ({}))

    const title = (body.title || 'Untitled document').trim().slice(0, 200)
    const category = body.category || 'General'
    const parentId = body.parent_document_id || null

    const defaultBlocks = [
      {
        id: `blk_${Date.now()}_1`,
        type: 'paragraph',
        content: 'Start typing or press / to insert blocks...'
      }
    ]

    const { data: doc, error } = await supabase
      .from('venture_documents')
      .insert({
        venture_id: venture.id,
        title,
        icon: body.icon || '📄',
        category,
        parent_document_id: parentId,
        content_blocks: body.content_blocks || defaultBlocks,
        content_text: title,
        visibility: body.visibility || 'venture_members',
        created_by: user.id,
        last_edited_by: user.id,
        version: 1
      })
      .select()
      .single()

    if (error) throw error

    await supabase.rpc('fn_venture_audit', {
      p_venture_id: venture.id,
      p_action: 'document.created',
      p_target_type: 'document',
      p_target_id: doc.id,
      p_after: doc
    })

    return NextResponse.json({ success: true, document: doc })
  } catch (e: any) {
    console.error('Create document error:', e)
    return NextResponse.json({ error: e?.message || 'Create failed' }, { status: 500 })
  }
}