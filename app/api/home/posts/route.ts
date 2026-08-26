import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Server-side HTML sanitization.
 * Strips Word/Google Docs junk, scripts, event handlers.
 */
function sanitizeHTML(html: string): string {
  if (!html) return ''
  return html
    .replace(/<\?xml[^>]*>/gi, '')
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?w:[^>]*>/gi, '')
    .replace(/<\/?meta[^>]*>/gi, '')
    .replace(/<\/?link[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+style='[^']*'/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/\s+id="[^"]*"/gi, '')
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    .replace(/\s+lang="[^"]*"/gi, '')
    .replace(/\s+xml:lang="[^"]*"/gi, '')
    .replace(/\s+dir="[^"]*"/gi, '')
    .replace(/<span[^>]*>/gi, '<span>')
    .replace(/<\/?font[^>]*>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Extract plain text from HTML for search indexing.
 */
function extractPlainText(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * POST /api/home/posts
 * Creates a new post with publisher identity (person, venture, project, community).
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const {
    publisher_type = 'person',
    publisher_id,
    type = 'update',
    title,
    content,
    content_text,
    content_html,
    content_blocks,
    media_urls = [],
    image_urls = [],
    video_url,
    file_urls,
    link_url,
    link_title,
    link_description,
    link_image,
    tags = [],
    visibility = 'global',
    event_date,
    event_end_date,
    event_location,
    is_online,
    registration_url,
    comments_permission = 'everyone',
    reposts_permission = true,
    quotes_permission = true,
    is_sensitive = false,
    content_warning,
    language_code = 'en',
    location,
    scheduled_at,
    is_draft = false,
    draft_id,
  } = body

  // Sanitize incoming HTML
  const rawHTML = content || content_text || ''
  const cleanHTML = sanitizeHTML(rawHTML)
  const plainText = extractPlainText(cleanHTML)

  // Validation
  const hasText = plainText.trim().length > 0
  const hasMedia = (media_urls?.length || 0) > 0 || (image_urls?.length || 0) > 0 || !!video_url
  if (!hasText && !hasMedia && !is_draft) {
    return NextResponse.json({ error: 'Post must have text or media' }, { status: 400 })
  }

  const effectivePublisherId = publisher_id || user.id

  // Permission check
  const { data: canPublish, error: permErr } = await supabase.rpc('fn_can_publish_as', {
    p_user_id: user.id,
    p_publisher_type: publisher_type,
    p_publisher_id: effectivePublisherId,
  })

  if (permErr) console.error('Permission check error:', permErr)
  if (!canPublish) {
    return NextResponse.json({
      error: 'You do not have permission to publish as this identity',
    }, { status: 403 })
  }

  try {
    const insertData: any = {
      user_id: user.id,
      publisher_type,
      publisher_id: effectivePublisherId,
      type,
      title: title?.trim() || null,
      content: cleanHTML || '',                  // ✅ Sanitized HTML — NEVER null
      content_text: plainText || '',              // ✅ Plain text for search
      content_html: cleanHTML || null,
      content_blocks: content_blocks || [],
      media_urls: media_urls.length ? media_urls : null,
      image_urls: image_urls.length ? image_urls : null,
      video_url: video_url || null,
      file_urls: file_urls || null,
      link_url: link_url || null,
      link_title: link_title || null,
      link_description: link_description || null,
      link_image: link_image || null,
      tags: tags.length ? tags : null,
      visibility,
      event_date: event_date || null,
      event_end_date: event_end_date || null,
      event_location: event_location || null,
      is_online: is_online || null,
      registration_url: registration_url || null,
      comments_permission,
      reposts_permission,
      quotes_permission,
      is_sensitive,
      content_warning: content_warning || null,
      language_code,
      location: location || null,
      scheduled_at: scheduled_at || null,
      is_draft,
      is_published_at: (is_draft || scheduled_at) ? null : new Date().toISOString(),
    }

    if (publisher_type === 'venture') {
      insertData.venture_id = effectivePublisherId
    } else if (publisher_type === 'project') {
      insertData.project_id = effectivePublisherId
    }

    let post: any
    if (draft_id) {
      const { data: updated } = await supabase
        .from('posts')
        .select('id, user_id')
        .eq('id', draft_id)
        .single()

      if (!updated || updated.user_id !== user.id) {
        return NextResponse.json({ error: 'Draft not found or not owned by you' }, { status: 403 })
      }

      const { data, error } = await supabase
        .from('posts')
        .update(insertData)
        .eq('id', draft_id)
        .select()
        .single()

      if (error) throw error
      post = data
    } else {
      const { data, error } = await supabase
        .from('posts')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      post = data
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (e: any) {
    console.error('Create post error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}