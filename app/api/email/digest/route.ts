import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const url = new URL(request.url)
  const manual = url.searchParams.get('manual') === 'true'

  if (
    !manual &&
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all real users (non-bots)
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, username, interest_topics')
    .eq('onboarding_complete', true)
    .eq('is_bot', false)

  if (!users || users.length === 0) {
    return NextResponse.json({ error: 'No users' })
  }

  // Get this week's top content
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: topPosts },
    { data: topEditorial },
    { data: newVentures },
    { data: newProjects },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('*, users(full_name, username)')
      .gte('created_at', weekAgo)
      .order('like_count', { ascending: false })
      .limit(5),
    supabase
      .from('editorial_posts')
      .select('*, editorial_categories(name, icon)')
      .gte('published_at', weekAgo)
      .order('view_count', { ascending: false })
      .limit(5),
    supabase
      .from('startups')
      .select('name, slug, tagline, stage')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('projects')
      .select('title, slug, tagline, stage')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const stats = { sent: 0, failed: 0 }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  for (const user of users) {
    try {
      const html = renderDigestHtml({
        userName: user.full_name?.split(' ')[0] || 'Builder',
        appUrl,
        topPosts: topPosts || [],
        topEditorial: topEditorial || [],
        newVentures: newVentures || [],
        newProjects: newProjects || [],
      })

      await resend.emails.send({
        from: 'DSRT <digest@dsrt.app>',
        to: user.email,
        subject: `Your DSRT Weekly Digest — ${new Date().toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
        html,
      })

      stats.sent++
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      stats.failed++
    }
  }

  return NextResponse.json({ success: true, ...stats })
}

function renderDigestHtml(data: any): string {
  const {
    userName,
    appUrl,
    topPosts,
    topEditorial,
    newVentures,
    newProjects,
  } = data

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>DSRT Weekly</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); color: #fff; padding: 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; }
  .content { padding: 32px; }
  .section { margin-bottom: 32px; }
  .section h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 0 0 12px 0; font-weight: 600; }
  .item { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
  .item:last-child { border-bottom: none; }
  .item h3 { margin: 0 0 4px 0; font-size: 15px; color: #111; }
  .item p { margin: 0; font-size: 13px; color: #6b7280; }
  .cta { display: inline-block; background: #111; color: #fff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
  .footer { padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DSRT Weekly</h1>
      <p style="opacity: 0.7; margin-top: 8px;">Hi ${userName}, here is what happened this week</p>
    </div>
    <div class="content">
      ${
        topEditorial.length
          ? `
      <div class="section">
        <h2>📰 Top News</h2>
        ${topEditorial
          .map(
            (p: any) => `
          <div class="item">
            <h3><a href="${appUrl}/pulse/${p.id}" style="color: #111; text-decoration: none;">${p.headline}</a></h3>
            <p>${p.editorial_categories?.icon || ''} ${p.editorial_categories?.name || ''} · ${p.view_count || 0} views</p>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        newVentures.length
          ? `
      <div class="section">
        <h2>🚀 New Ventures</h2>
        ${newVentures
          .map(
            (v: any) => `
          <div class="item">
            <h3><a href="${appUrl}/ventures/${v.slug}" style="color: #111; text-decoration: none;">${v.name}</a></h3>
            <p>${v.tagline || ''} · ${v.stage}</p>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        newProjects.length
          ? `
      <div class="section">
        <h2>⚡ New Projects</h2>
        ${newProjects
          .map(
            (p: any) => `
          <div class="item">
            <h3><a href="${appUrl}/projects/${p.slug}" style="color: #111; text-decoration: none;">${p.title}</a></h3>
            <p>${p.tagline || ''} · ${p.stage}</p>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      ${
        topPosts.length
          ? `
      <div class="section">
        <h2>💬 Most-liked posts</h2>
        ${topPosts
          .map(
            (p: any) => `
          <div class="item">
            <p style="color: #111; font-size: 14px; margin-bottom: 4px;">"${(p.content || '').slice(0, 140)}${p.content && p.content.length > 140 ? '...' : ''}"</p>
            <p>— ${p.users?.full_name}</p>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }

      <div style="text-align: center; margin-top: 32px;">
        <a href="${appUrl}/feed" class="cta">Open DSRT →</a>
      </div>
    </div>
    <div class="footer">
      Built by builders. DSRT © 2025<br>
      dedicated to my beautiful wife hajra
    </div>
  </div>
</body>
</html>
  `.trim()
}