import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CommunityView } from "@/components/communities/CommunityView";
import { VisitTracker } from "@/components/community/VisitTracker";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!community) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: members },
    { data: posts },
    { data: events },
    { data: myMembership },
  ] = await Promise.all([
    supabase
      .from("community_members")
      .select(
        "*, users:user_id (id, full_name, username, avatar_url, tagline, brings, follower_count)",
      )
      .eq("community_id", community.id)
      .order("joined_at", { ascending: false })
      .limit(20),
    supabase
      .from("posts")
      .select(
        "*, users:user_id (id, full_name, username, avatar_url, tagline, brings)",
      )
      .eq("community_id", community.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("community_events")
      .select("*")
      .eq("community_id", community.id)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(5),
    user
      ? supabase
          .from("community_members")
          .select("*")
          .eq("community_id", community.id)
          .eq("user_id", user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const postIds = posts?.map((p) => p.id) || [];
  const [{ data: likes }, { data: bookmarks }] = await Promise.all([
    user
      ? supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)
      : { data: [] },
    user
      ? supabase
          .from("post_bookmarks")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds)
      : { data: [] },
  ]);

  const likedSet = new Set(likes?.map((l) => l.post_id) || []);
  const bookmarkedSet = new Set(bookmarks?.map((b) => b.post_id) || []);

  const enrichedPosts = (posts || []).map((p) => ({
    ...p,
    is_liked: likedSet.has(p.id),
    is_bookmarked: bookmarkedSet.has(p.id),
  }));

  const { data: currentUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <>
      {/* 🎯 Track visit when logged-in user enters this community page */}
      {user && <VisitTracker communityId={community.id} />}

      <CommunityView
        community={community}
        members={members || []}
        posts={enrichedPosts}
        events={events || []}
        isJoined={!!myMembership}
        currentUser={currentUser}
      />
    </>
  );
}
