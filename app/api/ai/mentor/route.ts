import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mentorAgent } from '@/lib/ai/agents'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Rate limit: 20 AI requests per minute per user
  const limitResponse = await checkRateLimit({
    endpoint: 'ai_mentor',
    maxRequests: 20,
    windowSeconds: 60,
  })
  if (limitResponse) return limitResponse

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, conversationId, projectId } = await request.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  try {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, brings, tagline')
      .eq('id', user.id)
      .single()

    let projectContext = undefined
    if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (project) {
        const { count: teamCount } = await supabase
          .from('project_roles')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)

        const sprintDaysLeft = project.sprint_end_date
          ? Math.max(0, Math.ceil((new Date(project.sprint_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : undefined

        projectContext = {
          name: project.name,
          sector: project.sector || 'General',
          progress: project.progress_percent || 0,
          tasksCompleted: project.completed_tasks || 0,
          totalTasks: project.total_tasks || 0,
          teamSize: teamCount || 1,
          sprintDaysLeft,
        }
      }
    }

    let conversationHistory: any[] = []
    let currentConvoId = conversationId

    if (conversationId) {
      const { data: messages } = await supabase
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(20)

      conversationHistory = messages || []
    } else {
      const { data: newConvo } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          title: message.slice(0, 60),
        })
        .select()
        .single()

      currentConvoId = newConvo?.id
    }

    if (currentConvoId) {
      await supabase.from('ai_messages').insert({
        conversation_id: currentConvoId,
        role: 'user',
        content: message,
      })
    }

    const response = await mentorAgent(message, {
      userName: profile?.full_name?.split(' ')[0],
      userRole: profile?.brings?.[0],
      projectContext,
      conversationHistory,
    })

    if (currentConvoId) {
      await supabase.from('ai_messages').insert({
        conversation_id: currentConvoId,
        role: 'assistant',
        content: response.content,
      })
    }

    // Audit log (wrapped in try-catch to not fail the request)
    try {
      await supabase.rpc('log_audit', {
        p_user_id: user.id,
        p_action: 'ai_mentor_query',
        p_resource_type: 'ai_conversation',
        p_resource_id: currentConvoId,
      })
    } catch {
      // Silent fail
    }

    return NextResponse.json({
      response: response.content,
      conversationId: currentConvoId,
      model: response.model,
    })
  } catch (error: any) {
    console.error('Mentor error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to get AI response',
    }, { status: 500 })
  }
}