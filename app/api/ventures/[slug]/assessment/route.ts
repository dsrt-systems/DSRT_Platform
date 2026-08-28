import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ventures/[slug]/assessment
 * Returns the complete assessment state so the frontend can hydrate
 * the shell + all steps at once.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch venture and verify ownership
  const { data: venture, error: vErr } = await supabase
    .from('ventures')
    .select('id, slug, name, tagline, description, logo_url, cover_url, industry, sector, sub_category, stage, user_id, founder_id, assessment_status, assessment_current_step, assessment_schema_version, has_verified_assessment, intelligence_score, intelligence_vector')
    .eq('slug', slug)
    .maybeSingle()

  if (vErr || !venture) {
    return NextResponse.json({ error: 'Venture not found' }, { status: 404 })
  }

  const isOwner = venture.user_id === user.id || venture.founder_id === user.id
  if (!isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Load all assessment tables in parallel
  const [
    assessmentRes,
    problemRes,
    insightRes,
    customerRes,
    alternativesRes,
    solutionRes,
    marketRes,
    competitorsRes,
    differentiationRes,
    founderAnswersRes,
    capabilitiesRes,
    assumptionsRes,
    risksRes,
    milestonesRes,
    nextMoveRes,
  ] = await Promise.all([
    supabase.from('venture_assessments').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_problems').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_insights').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_customer_profiles').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_alternatives').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_solutions').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_markets').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_competitors').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_differentiation').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_founder_answers').select('*').eq('venture_id', venture.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('venture_capabilities').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_assumptions').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_risks').select('*').eq('venture_id', venture.id).maybeSingle(),
    supabase.from('venture_milestones').select('*').eq('venture_id', venture.id).order('position'),
    supabase.from('venture_next_moves').select('*').eq('venture_id', venture.id).maybeSingle(),
  ])

  // If no assessment exists yet, create one (self-heal)
  let assessment = assessmentRes.data
  if (!assessment) {
    const { data: newAssessment } = await supabase
      .from('venture_assessments')
      .insert({
        venture_id: venture.id,
        owner_id: user.id,
        status: 'in_progress',
        current_step: 1,
        schema_version: 1,
      })
      .select()
      .single()
    assessment = newAssessment

    await supabase
      .from('ventures')
      .update({ assessment_status: 'in_progress', assessment_current_step: 1 })
      .eq('id', venture.id)
  }

  return NextResponse.json({
    venture,
    assessment,
    steps: {
      step1_venture: {
        name: venture.name,
        tagline: venture.tagline,
        description: venture.description,
        logo_url: venture.logo_url,
        cover_url: venture.cover_url,
        stage: venture.stage,
        industry: venture.industry,
        sector: venture.sector,
        sub_category: venture.sub_category,
      },
      step2_problem: problemRes.data,
      step3_insight: insightRes.data,
      step4_customer: {
        profile: customerRes.data,
        alternatives: alternativesRes.data || [],
      },
      step5_solution: solutionRes.data,
      step6_market: marketRes.data,
      step7_competition: {
        competitors: competitorsRes.data || [],
        differentiation: differentiationRes.data,
      },
      step8_founder_team: {
        founder_answers: founderAnswersRes.data,
        capabilities: capabilitiesRes.data,
      },
      step9_reality_check: {
        assumptions: assumptionsRes.data || [],
        risks: risksRes.data,
      },
      step10_next_move: {
        next_move: nextMoveRes.data,
        milestones: milestonesRes.data || [],
      },
    },
  })
}