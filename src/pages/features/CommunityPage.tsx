import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, X, Plus, Zap, ChevronDown, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { supabase } from '@/lib/supabase';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

// ─── Types ────────────────────────────────────────────────────────────────────
type PostType = 'general' | 'achievement' | 'streak' | 'project' | 'challenge';

interface DBPost {
  id: string;
  user_id: string;
  content: string;
  type: PostType;
  emoji: string;
  xp_gained: number;
  created_at: string;
  profiles: { display_name: string | null; level: number; avatar: string | null } | null;
  like_count?: number;
  liked_by_me?: boolean;
  comment_count?: number;
}

interface Post extends DBPost {
  like_count: number;
  liked_by_me: boolean;
  comment_count: number;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string | null; avatar: string | null } | null;
}

const TYPE_META: Record<PostType, { color: string; label: string; emoji: string }> = {
  general:     { color: '#2B7FFF', label: 'Thought',    emoji: '💬' },
  achievement: { color: '#58CC02', label: 'Achievement', emoji: '🏆' },
  streak:      { color: '#FF9600', label: 'Streak',      emoji: '🔥' },
  project:     { color: '#CE82FF', label: 'Project',     emoji: '🛠️' },
  challenge:   { color: '#FF4B4B', label: 'Challenge',   emoji: '⚔️' },
};

const POST_PROMPTS: Record<PostType, string> = {
  general:     "What's on your coding mind?",
  achievement: "Share an achievement you're proud of...",
  streak:      "How many days is your streak now?",
  project:     "Tell us about a project you built...",
  challenge:   "Which challenge did you just complete?",
};

// ─── Avatar helper ────────────────────────────────────────────────────────────
function Avatar({ name, avatar, size = 38 }: { name: string | null; avatar: string | null; size?: number }) {
  const colors = ['#2B7FFF','#58CC02','#FF9600','#CE82FF','#FF4B4B','#1CB0F6'];
  const bg = colors[((name ?? 'X').charCodeAt(0)) % colors.length];
  const letter = (name ?? '?')[0].toUpperCase();
  if (avatar) return <img src={avatar} alt={name ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.42, flexShrink: 0 }}>
      {letter}
    </div>
  );
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

// ─── Post Composer ────────────────────────────────────────────────────────────
function Composer({
  profile, gameState: _gameState, onPost,
}: {
  profile: ReturnType<typeof useAuth>['profile'];
  gameState: ReturnType<typeof useGame>['gameState'];
  onPost: (post: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PostType>('general');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    const meta = TYPE_META[type];

    // Auto-fill XP gained for achievement/streak posts
    const xp_gained =
      type === 'achievement' ? (profile?.xp ?? 0) :
      type === 'streak' ? (profile?.current_streak ?? 0) : 0;

    const { data, error } = await supabase
      .from('community_posts')
      .insert({ user_id: user.id, content: content.trim(), type, emoji: meta.emoji, xp_gained })
      .select('*')
      .single();

    if (!error && data) {
      // Fetch own profile for display
      const { data: ownProfile } = await supabase
        .from('profiles')
        .select('display_name, level, avatar')
        .eq('user_id', user.id)
        .single();
      onPost({ ...data, profiles: ownProfile ?? null, like_count: 0, liked_by_me: false, comment_count: 0 });
      setContent('');
      setOpen(false);
    }
    setLoading(false);
  };

  if (!open) return (
    <motion.button variants={I} onClick={() => setOpen(true)}
      className="d-card w-full flex items-center gap-3 text-left !p-4 cursor-pointer hover:border-blue-400 transition-colors"
      style={{ color: 'var(--text-muted)' }}>
      <Avatar name={profile?.display_name ?? null} avatar={profile?.avatar ?? null} size={34} />
      <span className="text-sm flex-1">Share what you're working on...</span>
      <Plus className="w-4 h-4" style={{ color: '#2B7FFF' }} />
    </motion.button>
  );

  return (
    <motion.div variants={I} className="d-card !p-4 space-y-3">
      {/* Type selector */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(TYPE_META) as PostType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            className="px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all"
            style={{
              backgroundColor: type === t ? TYPE_META[t].color : 'var(--surface)',
              color: type === t ? '#fff' : 'var(--text-muted)',
            }}>
            {TYPE_META[t].emoji} {TYPE_META[t].label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="flex gap-2.5">
        <Avatar name={profile?.display_name ?? null} avatar={profile?.avatar ?? null} size={36} />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value.slice(0, 500))}
          placeholder={POST_PROMPTS[type]}
          className="flex-1 text-sm resize-none focus:outline-none bg-transparent"
          style={{ minHeight: 70, color: 'var(--text)' }}
          autoFocus
        />
      </div>

      {/* Auto-data preview */}
      {(type === 'streak' || type === 'achievement') && (
        <div className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: TYPE_META[type].color + '15', color: TYPE_META[type].color }}>
          {type === 'streak' && `🔥 Your current streak: ${profile?.current_streak ?? 0} days`}
          {type === 'achievement' && `⚡ Your total XP: ${(profile?.xp ?? 0).toLocaleString()}`}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: content.length > 450 ? '#FF4B4B' : 'var(--text-muted)' }}>{content.length}/500</span>
        <div className="flex gap-2">
          <button onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Cancel</button>
          <button onClick={handlePost} disabled={!content.trim() || loading}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-opacity"
            style={{ backgroundColor: TYPE_META[type].color, opacity: !content.trim() ? 0.5 : 1 }}>
            <Send className="w-3 h-3" /> {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Comment Section ────────────────────────────────────────────────────────────
function CommentSection({ postId, onCountChange }: { postId: string; onCountChange: (delta: number) => void }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      const rows = data ?? [];
      const userIds = [...new Set(rows.map((c: any) => c.user_id))];
      const { data: profilesData } = userIds.length > 0
        ? await supabase.from('profiles').select('user_id, display_name, avatar').in('user_id', userIds)
        : { data: [] };
      const profileMap: Record<string, any> = {};
      (profilesData ?? []).forEach((pr: any) => { profileMap[pr.user_id] = pr; });
      if (!active) return;
      setComments(rows.map((c: any) => ({ ...c, profiles: profileMap[c.user_id] ?? null })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [postId]);

  const submit = async () => {
    if (!text.trim() || !user || posting) return;
    setPosting(true);
    const content = text.trim();
    const { data, error } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, user_id: user.id, content })
      .select('*')
      .single();
    if (!error && data) {
      setComments(prev => [...prev, { ...data, profiles: { display_name: profile?.display_name ?? null, avatar: profile?.avatar ?? null } }]);
      onCountChange(1);
      setText('');
    }
    setPosting(false);
  };

  const remove = async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    onCountChange(-1);
    await supabase.from('community_comments').delete().eq('id', id).eq('user_id', user?.id ?? '');
  };

  return (
    <div className="mt-3 pt-3 space-y-2.5" style={{ borderTop: '1px solid var(--border)' }}>
      {loading ? (
        <p className="text-[11px] text-center py-2" style={{ color: 'var(--text-muted)' }}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-center py-1" style={{ color: 'var(--text-muted)' }}>No comments yet — be the first to reply!</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="flex gap-2 items-start">
            <Avatar name={c.profiles?.display_name ?? null} avatar={c.profiles?.avatar ?? null} size={26} />
            <div className="flex-1 min-w-0 rounded-2xl px-3 py-2" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px]">{c.profiles?.display_name ?? 'Coder'}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(c.created_at)}</span>
                  {currentUserIdMatches(user?.id, c.user_id) && (
                    <button onClick={() => remove(c.id)} style={{ color: 'var(--text-muted)' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{c.content}</p>
            </div>
          </div>
        ))
      )}

      {user && (
        <div className="flex gap-2 items-center">
          <Avatar name={profile?.display_name ?? null} avatar={profile?.avatar ?? null} size={26} />
          <input
            value={text}
            onChange={e => setText(e.target.value.slice(0, 300))}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="Write a comment..."
            className="flex-1 text-xs rounded-2xl px-3 py-2 focus:outline-none"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
          />
          <button onClick={submit} disabled={!text.trim() || posting}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-opacity"
            style={{ backgroundColor: '#2B7FFF', opacity: !text.trim() ? 0.5 : 1 }}>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
function currentUserIdMatches(a?: string, b?: string) { return !!a && a === b; }

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onLike, onDelete, onCommentCountChange }: {
  post: Post;
  currentUserId?: string;
  onLike: (id: string, liked: boolean) => void;
  onDelete: (id: string) => void;
  onCommentCountChange: (postId: string, delta: number) => void;
}) {
  const meta = TYPE_META[post.type] ?? TYPE_META.general;
  const name = post.profiles?.display_name ?? 'Coder';
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <motion.div variants={I} layout className="d-card !p-4">
      <div className="flex gap-3">
        <Avatar name={name} avatar={post.profiles?.avatar ?? null} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-bold text-sm">{name}</span>
              {post.profiles?.level && (
                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,200,0,0.12)', color: '#FF9600' }}>
                  Lv.{post.profiles.level}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.created_at)}</span>
              {currentUserId === post.user_id && (
                <button onClick={() => onDelete(post.id)} className="w-5 h-5 flex items-center justify-center rounded-lg" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Type badge */}
          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 mb-2"
            style={{ backgroundColor: meta.color + '18', color: meta.color }}>
            {meta.emoji} {meta.label}
          </span>

          <p className="text-sm" style={{ color: 'var(--text)', lineHeight: 1.5 }}>{post.content}</p>

          {/* XP badge */}
          {post.xp_gained > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl"
              style={{ backgroundColor: 'rgba(255,200,0,0.12)', color: '#FF9600' }}>
              <Zap className="w-3 h-3" /> {post.xp_gained.toLocaleString()} {post.type === 'streak' ? 'day streak' : 'XP total'}
            </div>
          )}

          {/* Like */}
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => onLike(post.id, post.liked_by_me)}
              className="flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-90"
              style={{ color: post.liked_by_me ? '#FF4B4B' : 'var(--text-muted)' }}>
              <motion.div animate={{ scale: post.liked_by_me ? [1, 1.4, 1] : 1 }} transition={{ duration: 0.3 }}>
                <Heart className="w-4 h-4" fill={post.liked_by_me ? '#FF4B4B' : 'none'} />
              </motion.div>
              {post.like_count > 0 && post.like_count}
            </button>

            <button
              onClick={() => setCommentsOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs font-bold"
              style={{ color: commentsOpen ? '#2B7FFF' : 'var(--text-muted)' }}>
              <MessageCircle className="w-4 h-4" />
              {post.comment_count > 0 ? post.comment_count : 'Comment'}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {commentsOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CommentSection postId={post.id} onCountChange={(delta) => onCommentCountChange(post.id, delta)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────
function LeaderboardTab({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<Array<{ id: string; display_name: string | null; xp: number; level: number; current_streak: number; avatar: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('id, display_name, xp, level, current_streak, avatar').order('xp', { ascending: false }).limit(25)
      .then(({ data }) => { setUsers(data ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Loading rankings...</div>;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-2">
      {users.map((u, i) => {
        const isMe = u.id === currentUserId;
        return (
          <motion.div key={u.id} variants={I} className="d-card !p-3 flex items-center gap-3"
            style={isMe ? { borderColor: '#2B7FFF', backgroundColor: 'rgba(43,127,255,0.12)' } : {}}>
            <div className="w-8 text-center font-display font-black" style={{ color: i < 3 ? '#FF9600' : 'var(--text-muted)', fontSize: i < 3 ? 18 : 13 }}>
              {i < 3 ? medals[i] : `#${i + 1}`}
            </div>
            <Avatar name={u.display_name} avatar={u.avatar} size={34} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">
                {u.display_name ?? 'Coder'}
                {isMe && <span className="ml-1 text-[9px] font-normal" style={{ color: '#2B7FFF' }}>(you)</span>}
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Lv.{u.level}</span>
                {u.current_streak > 0 && <span>🔥{u.current_streak}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-black text-sm" style={{ color: '#2B7FFF' }}>{u.xp.toLocaleString()}</div>
              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>XP</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { profile, user } = useAuth();
  const { gameState } = useGame();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');
  const [filter, setFilter] = useState<PostType | 'all'>('all');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(0);
  const PAGE_SIZE = 15;

  // Load posts
  const loadPosts = async (page = 0) => {
    const from = page * PAGE_SIZE;
    let q = supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (filter !== 'all') q = q.eq('type', filter);

    const { data, error } = await q;
    if (error || !data) { setLoading(false); return; }

    // Fetch profiles for all unique user_ids (profiles.user_id = auth.users.id)
    const userIds = [...new Set(data.map((p: any) => p.user_id))];
    const { data: profilesData } = userIds.length > 0
      ? await supabase.from('profiles').select('user_id, display_name, level, avatar').in('user_id', userIds)
      : { data: [] };
    const profileMap: Record<string, any> = {};
    (profilesData ?? []).forEach((pr: any) => { profileMap[pr.user_id] = pr; });

    // Get like counts, comment counts + whether current user liked each
    const ids = data.map((p: any) => p.id);
    const [{ data: likeCounts }, { data: myLikes }, { data: commentCounts }] = await Promise.all([
      supabase.from('community_likes').select('post_id').in('post_id', ids),
      user ? supabase.from('community_likes').select('post_id').in('post_id', ids).eq('user_id', user.id) : Promise.resolve({ data: [] }),
      supabase.from('community_comments').select('post_id').in('post_id', ids),
    ]);

    const countMap: Record<string, number> = {};
    (likeCounts ?? []).forEach((l: any) => { countMap[l.post_id] = (countMap[l.post_id] ?? 0) + 1; });
    const mySet = new Set((myLikes ?? []).map((l: any) => l.post_id));
    const commentMap: Record<string, number> = {};
    (commentCounts ?? []).forEach((c: any) => { commentMap[c.post_id] = (commentMap[c.post_id] ?? 0) + 1; });

    const enriched: Post[] = (data as any[]).map(p => ({
      ...p,
      profiles: profileMap[p.user_id] ?? null,
      like_count: countMap[p.id] ?? 0,
      liked_by_me: mySet.has(p.id),
      comment_count: commentMap[p.id] ?? 0,
    }));

    if (page === 0) setPosts(enriched);
    else setPosts(prev => [...prev, ...enriched]);
    setHasMore(data.length === PAGE_SIZE);
    pageRef.current = page;
  };

  useEffect(() => {
    setLoading(true);
    loadPosts(0).finally(() => setLoading(false));
  }, [filter, user]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, async payload => {
        const newPost = payload.new as DBPost;
        if (!newPost) return;
        // Fetch profile for this user (profiles.user_id = auth user id)
        const { data: prof } = await supabase.from('profiles').select('display_name, level, avatar').eq('user_id', newPost.user_id).single();
        const enriched: Post = { ...newPost, profiles: prof ?? null, like_count: 0, liked_by_me: false, comment_count: 0 } as Post;
        // Only add if matches current filter and not already present
        if (filter === 'all' || filter === newPost.type) {
          setPosts(prev => [enriched, ...prev.filter(p => p.id !== enriched.id)]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const handleLike = async (postId: string, liked: boolean) => {
    if (!user) return;
    // Optimistic
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked_by_me: !liked, like_count: liked ? p.like_count - 1 : p.like_count + 1 } : p
    ));
    if (liked) {
      await supabase.from('community_likes').delete().match({ post_id: postId, user_id: user.id });
    } else {
      await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    await supabase.from('community_posts').delete().eq('id', postId).eq('user_id', user.id);
  };

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handleCommentCountChange = (postId: string, delta: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count + delta) } : p));
  };

  const loadMore = async () => {
    setLoadingMore(true);
    await loadPosts(pageRef.current + 1);
    setLoadingMore(false);
  };

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-4 max-w-lg mx-auto">

      {/* Header */}
      <motion.div variants={I} className="d-card !p-4 text-center">
        <div className="text-3xl mb-1">🌍</div>
        <h1 className="font-display text-xl font-bold">Community</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Real coders. Real progress. Share yours.
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={I} className="d-card !p-1.5 flex gap-1.5">
        {(['feed', 'leaderboard'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 py-2 rounded-2xl text-sm font-bold capitalize transition-all"
            style={{
              backgroundColor: activeTab === t ? '#2B7FFF' : 'transparent',
              color: activeTab === t ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === t ? '0 3px 0 #1a5fcc' : 'none',
            }}>
            {t === 'feed' ? '📰 Feed' : '🏆 Rankings'}
          </button>
        ))}
      </motion.div>

      {activeTab === 'leaderboard' ? (
        <LeaderboardTab currentUserId={user?.id} />
      ) : (
        <>
          {/* Composer */}
          {user && <Composer profile={profile} gameState={gameState} onPost={handleNewPost} />}

          {/* Filters */}
          <motion.div variants={I} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', ...Object.keys(TYPE_META)] as Array<PostType | 'all'>).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="flex-shrink-0 px-3 py-1.5 rounded-2xl border-2 text-[10px] font-bold transition-all"
                style={{
                  borderColor: filter === f ? (f === 'all' ? '#2B7FFF' : TYPE_META[f as PostType].color) : 'var(--border)',
                  backgroundColor: filter === f ? (f === 'all' ? '#EBF2FF' : TYPE_META[f as PostType].color + '15') : 'var(--white)',
                  color: filter === f ? (f === 'all' ? '#2B7FFF' : TYPE_META[f as PostType].color) : 'var(--text-muted)',
                }}>
                {f === 'all' ? '✨ All' : `${TYPE_META[f as PostType].emoji} ${TYPE_META[f as PostType].label}`}
              </button>
            ))}
          </motion.div>

          {/* Feed */}
          {loading ? (
            <div className="text-center py-10">
              <div className="text-2xl mb-2 animate-bounce">⏳</div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading community...</p>
            </div>
          ) : posts.length === 0 ? (
            <motion.div variants={I} className="d-card text-center py-12">
              <div className="text-4xl mb-3">👋</div>
              <h3 className="font-bold">Be the first to post!</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Share your progress and inspire others</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onCommentCountChange={handleCommentCountChange}
                />
              ))}
            </AnimatePresence>
          )}

          {/* Load more */}
          {hasMore && !loading && posts.length > 0 && (
            <button onClick={loadMore} disabled={loadingMore}
              className="w-full d-card !p-3 text-sm font-bold flex items-center justify-center gap-2"
              style={{ color: 'var(--text-muted)' }}>
              <ChevronDown className="w-4 h-4" />
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}