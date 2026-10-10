import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Crown, Medal, Zap, Users, Plus,
  Copy, Check, Lock, X, Hash, ChevronRight, LogIn
} from 'lucide-react';
import PlayerTagBadge from '@/components/PlayerTagBadge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Leader {
  rank: number;
  user_id: string;
  display_name: string;
  avatar: string | null;
  level: number;
  xp: number;
  streak: number;
  role: string;
  custom_tag: string | null;
  custom_tag_color: string | null;
}

interface League {
  id: string;
  name: string;
  code: string;
  owner_id: string;
  owner_name: string | null;
  created_at: string;
  is_private: boolean;
  max_members: number;
}

interface LeagueMember {
  user_id: string;
  username: string;
  xp: number;
  avatar: string | null;
}

const MAX_ROOM_MEMBERS = 10;

// ── Avatar Component ──────────────────────────────────────────────────────────
function AvatarComponent({ name, avatar, size = 'md', isMe = false }: { name: string; avatar?: string | null; size?: 'sm' | 'md' | 'lg'; isMe?: boolean }) {
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-lg' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (avatar) {
    return (
      <img src={avatar} alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2`}
        style={{ borderColor: isMe ? '#58CC02' : 'var(--border)' }} />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: isMe ? '#58CC02' : 'var(--surface)', color: isMe ? 'white' : 'var(--text-light)' }}>
      {(name?.[0] || '?').toUpperCase()}
    </div>
  );
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };
const MEDAL_COLORS = ['#FFC800', '#AFAFAF', '#FF9600'];

// ── League Card Component ─────────────────────────────────────────────────────
function LeagueCard({ league, myUserId, onLeave, onDelete }: { league: League; myUserId: string; onLeave: (id: string) => void; onDelete: (id: string) => void; }) {
  const navigate = useNavigate();
  const goToProfile = (userId: string) => {
    navigate(userId === myUserId ? '/app/profile' : `/app/profile/u/${userId}`);
  };
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');

  const isOwner = league.owner_id === myUserId;

  useEffect(() => {
    if (league.owner_name) {
      setOwnerName(league.owner_name);
    } else {
      const fetchOwner = async () => {
        const { data } = await supabase.from('profiles').select('display_name').eq('user_id', league.owner_id).single();
        if (data) setOwnerName(data.display_name || 'League Owner');
      };
      fetchOwner();
    }
  }, [league.owner_id, league.owner_name]);

  useEffect(() => {
    loadMembers();
  }, [league.id]);

  const loadMembers = async () => {
    setLoading(true);
    
    // Get all members
    const { data: membersList } = await supabase
      .from('league_members')
      .select('user_id')
      .eq('league_id', league.id);

    if (!membersList || membersList.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    // Get profiles
    const userIds = membersList.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, xp, avatar')
      .in('user_id', userIds);

    if (profiles) {
      const formatted = profiles.map(p => ({
        user_id: p.user_id,
        username: p.display_name || 'Learner',
        xp: p.xp || 0,
        avatar: p.avatar
      })).sort((a, b) => b.xp - a.xp);
      setMembers(formatted);
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="d-card overflow-hidden" style={{ borderColor: '#CE82FF40' }}>
      <div className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #CE82FF18, #CE82FF08)' }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#CE82FF', boxShadow: '0 3px 0 #B563F5' }}>
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{league.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {members.length}/{league.max_members || MAX_ROOM_MEMBERS} members · by {ownerName || 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Lock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--surface)' }}>
          <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="font-mono font-bold text-sm tracking-widest" style={{ color: 'var(--text)' }}>{league.code}</span>
        </div>
        <button onClick={copyCode} className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all" style={{ backgroundColor: copied ? '#58CC02' : '#CE82FF', boxShadow: `0 3px 0 ${copied ? '#45A301' : '#B563F5'}` }}>
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
        </button>
      </div>

      {!loading && (
        <div className="px-4 pb-3 space-y-1.5">
          {members.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No members yet. Share the code to invite friends!</p>
            </div>
          ) : (
            members.slice(0, 5).map((member, idx) => {
              const isMe = member.user_id === myUserId;
              return (
                <div key={member.user_id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: isMe ? '#58CC0212' : 'var(--surface)' }}>
                  <span className="w-5 text-center text-xs font-bold flex-shrink-0" style={{ color: idx === 0 ? '#FFC800' : idx === 1 ? '#AFAFAF' : idx === 2 ? '#FF9600' : 'var(--text-muted)' }}>{idx + 1}</span>
                  <button onClick={() => goToProfile(member.user_id)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <AvatarComponent name={member.username} avatar={member.avatar} size="sm" isMe={isMe} />
                    <span className="flex-1 text-xs font-bold truncate" style={{ color: isMe ? '#58CC02' : 'var(--text)' }}>{member.username}{isMe ? ' (you)' : ''}</span>
                  </button>
                  <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#FFC800' }}>{member.xp.toLocaleString()} XP</span>
                </div>
              );
            })
          )}
          {members.length > 5 && <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>+{members.length - 5} more members</p>}
        </div>
      )}

      <div className="px-4 pb-4">
        {isOwner ? (
          <button onClick={() => onDelete(league.id)} className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all" style={{ backgroundColor: 'rgba(255,75,75,0.12)', color: '#FF4B4B' }}>
            <X className="w-3.5 h-3.5" /> Disband League
          </button>
        ) : (
          <button onClick={() => onLeave(league.id)} className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
            <LogIn className="w-3.5 h-3.5" /> Leave League
          </button>
        )}
      </div>
    </div>
  );
}

// ── Create League Modal ───────────────────────────────────────────────────────
function CreateLeagueModal({ onClose, onCreated, myUserId }: { onClose: () => void; onCreated: (league: League) => void; myUserId: string; myName: string; }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a league name'); return; }
    if (trimmed.length < 3) { setError('Name must be at least 3 characters'); return; }

    setLoading(true);
    const leagueCode = generateCode();

    // Get user's display name
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', myUserId).single();
    
    const { data: league, error: createError } = await supabase
      .from('leagues')
      .insert({ name: trimmed, code: leagueCode, owner_id: myUserId, owner_name: profile?.display_name, max_members: MAX_ROOM_MEMBERS })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    await supabase.from('league_members').insert({ league_id: league.id, user_id: myUserId });

    setLoading(false);
    onCreated(league);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ backgroundColor: 'var(--white)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Create a League</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}><X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>LEAGUE NAME</label>
            <input value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="e.g. Squad Alpha 🔥" maxLength={30} className="w-full px-4 py-3 rounded-2xl text-sm font-medium border-2 outline-none transition-all" style={{ borderColor: error ? '#FF4B4B' : name ? '#CE82FF' : 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
            {error && <p className="text-xs mt-1" style={{ color: '#FF4B4B' }}>{error}</p>}
          </div>
          <div className="p-3 rounded-2xl flex items-start gap-2.5" style={{ backgroundColor: 'rgba(255,150,0,0.12)' }}>
            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FF9600' }} />
            <p className="text-xs" style={{ color: '#FF9600' }}>Max <strong>{MAX_ROOM_MEMBERS} members</strong> per league. Share the league code with friends to let them join!</p>
          </div>
        </div>
        <button onClick={handleCreate} disabled={loading} className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50" style={{ backgroundColor: '#CE82FF', boxShadow: '0 4px 0 #B563F5' }}>{loading ? 'Creating...' : 'Create League ✨'}</button>
      </motion.div>
    </div>
  );
}

// ── Join League Modal ─────────────────────────────────────────────────────────
function JoinLeagueModal({ onClose, onJoined, myUserId }: { onClose: () => void; onJoined: (league: League) => void; myUserId: string; myName: string; }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Enter a league code'); return; }

    setLoading(true);

    const { data: league } = await supabase.from('leagues').select('*').eq('code', trimmed).single();

    if (!league) {
      setError('League not found. Check the code and try again.');
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase.from('league_members').select('*').eq('league_id', league.id).eq('user_id', myUserId).single();

    if (existing) {
      setError('You\'re already in this league!');
      setLoading(false);
      return;
    }

    const { count } = await supabase.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', league.id);

    if (count && count >= (league.max_members || MAX_ROOM_MEMBERS)) {
      setError(`League is full (max ${league.max_members || MAX_ROOM_MEMBERS} members)`);
      setLoading(false);
      return;
    }

    const { error: joinError } = await supabase.from('league_members').insert({ league_id: league.id, user_id: myUserId });

    if (joinError) {
      setError('Failed to join league');
      setLoading(false);
      return;
    }

    setLoading(false);
    onJoined(league);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm rounded-3xl p-6 space-y-4" style={{ backgroundColor: 'var(--white)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Join a League</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}><X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: 'var(--text-muted)' }}>LEAGUE CODE</label>
            <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} placeholder="e.g. ABC123" maxLength={8} className="w-full px-4 py-3 rounded-2xl text-sm font-mono font-bold tracking-widest border-2 outline-none text-center" style={{ borderColor: error ? '#FF4B4B' : code ? '#1CB0F6' : 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
            {error && <p className="text-xs mt-1 text-center" style={{ color: '#FF4B4B' }}>{error}</p>}
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Ask your friend to share their league code with you.</p>
        </div>
        <button onClick={handleJoin} disabled={loading} className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50" style={{ backgroundColor: '#1CB0F6', boxShadow: '0 4px 0 #0C9BDE' }}>{loading ? 'Joining...' : 'Join League 🚀'}</button>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const goToProfile = (userId: string) => {
    navigate(userId === profile?.user_id ? '/app/profile' : `/app/profile/u/${userId}`);
  };
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'leagues'>('global');
  const [myLeagues, setMyLeagues] = useState<League[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [leaguesLoading, setLeaguesLoading] = useState(true);

  const myUserId = profile?.user_id ?? '';

  const loadLeagues = async () => {
    if (!myUserId) return;
    setLeaguesLoading(true);
    
    const { data: memberData } = await supabase.from('league_members').select('league_id').eq('user_id', myUserId);
    
    if (!memberData || memberData.length === 0) {
      setMyLeagues([]);
      setLeaguesLoading(false);
      return;
    }
    
    const { data: leagues } = await supabase.from('leagues').select('*').in('id', memberData.map(m => m.league_id));
    setMyLeagues(leagues || []);
    setLeaguesLoading(false);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const { data } = await supabase.from('profiles').select('user_id, display_name, avatar, level, xp, current_streak, role, custom_tag, custom_tag_color').order('xp', { ascending: false }).limit(500);
      if (data) {
        setLeaders(data.map((p, i) => ({ rank: i + 1, user_id: p.user_id, display_name: p.display_name || 'Learner', avatar: p.avatar, level: p.level || 1, xp: p.xp || 0, streak: p.current_streak || 0, role: p.role || 'user', custom_tag: p.custom_tag ?? null, custom_tag_color: p.custom_tag_color ?? null })));
      }
      setIsLoading(false);
    };
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (myUserId) loadLeagues();
  }, [myUserId]);

  const top3 = leaders.slice(0, 3);
  const myRank = leaders.findIndex(l => l.user_id === myUserId) + 1;

  const handleLeave = async (leagueId: string) => {
    await supabase.from('league_members').delete().eq('league_id', leagueId).eq('user_id', myUserId);
    loadLeagues();
  };

  const handleDelete = async (leagueId: string) => {
    await supabase.from('league_members').delete().eq('league_id', leagueId);
    await supabase.from('leagues').delete().eq('id', leagueId).eq('owner_id', myUserId);
    loadLeagues();
  };

  if (isLoading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="d-card h-16 animate-pulse" style={{ opacity: 0.5 }} />)}</div>;
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={item} className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #FFC800, #FF9600)' }}><Trophy className="w-8 h-8 text-white" /></div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Diamond League</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{leaders.length} players · {myRank > 0 ? `You're #${myRank}` : 'Join the leaderboard!'}</p>
        </motion.div>

        <motion.div variants={item} className="flex gap-2 p-1 rounded-2xl" style={{ backgroundColor: 'var(--surface)' }}>
          <button onClick={() => setActiveTab('global')} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: activeTab === 'global' ? 'var(--white)' : 'transparent', color: activeTab === 'global' ? 'var(--text)' : 'var(--text-muted)', boxShadow: activeTab === 'global' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>🌍 Global</button>
          <button onClick={() => setActiveTab('leagues')} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ backgroundColor: activeTab === 'leagues' ? 'var(--white)' : 'transparent', color: activeTab === 'leagues' ? 'var(--text)' : 'var(--text-muted)', boxShadow: activeTab === 'leagues' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>🏠 My Leagues</button>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === 'global' ? (
            <motion.div key="global" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {top3.length >= 1 && (
                <motion.div variants={item} className="flex items-end justify-center gap-3 pt-4 pb-2">
                  {(top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]]).map((entry, idx) => {
                    const rank = top3.length >= 3 ? (idx === 1 ? 1 : idx === 0 ? 2 : 3) : top3.length === 2 ? (idx === 1 ? 1 : 2) : 1;
                    const isFirst = rank === 1;
                    const isMe = entry.user_id === myUserId;
                    const podiumColors = ['#C0C0C0', '#FFD700', '#CD7F32'];
                    const heights = ['h-20', 'h-28', 'h-16'];
                    return (
                      <div key={rank} className={`flex flex-col items-center ${isFirst ? '-mt-4' : ''}`}>
                        {isFirst && <Crown className="w-5 h-5 mb-1" style={{ color: '#FFC800' }} />}
                        <button onClick={() => goToProfile(entry.user_id)} className="flex flex-col items-center">
                          <AvatarComponent name={entry.display_name} avatar={entry.avatar} size={isFirst ? 'lg' : 'md'} isMe={isMe} />
                        </button>
                        <div className={`w-16 ${heights[idx] ?? 'h-16'} rounded-t-2xl flex flex-col items-center justify-center mt-2`} style={{ backgroundColor: podiumColors[rank - 1] + '30', border: `2px solid ${podiumColors[rank - 1]}60` }}>
                          <span className="font-display text-lg font-black" style={{ color: podiumColors[rank - 1] }}>#{rank}</span>
                        </div>
                        <button onClick={() => goToProfile(entry.user_id)} className="text-[10px] font-bold mt-1 max-w-[60px] truncate text-center" style={{ color: 'var(--text)' }}>{entry.display_name}</button>
                        <PlayerTagBadge role={entry.role} rank={entry.rank} tag={entry.custom_tag} tagColor={entry.custom_tag_color} size="xs" />
                        <p className="text-[10px]" style={{ color: '#FFC800' }}>{entry.xp.toLocaleString()} XP</p>
                      </div>
                    );
                  })}
                </motion.div>
              )}
              <div className="d-card overflow-hidden p-0">
                {leaders.map((entry) => {
                  const isMe = entry.user_id === myUserId;
                  return (
                    <button key={entry.user_id} onClick={() => goToProfile(entry.user_id)} className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 text-left transition-colors active:opacity-70" style={{ borderColor: 'var(--border)', backgroundColor: isMe ? '#58CC0210' : 'transparent' }}>
                      <div className="w-7 flex-shrink-0 text-center">
                        {entry.rank <= 3 ? <Medal className="w-5 h-5 mx-auto" style={{ color: MEDAL_COLORS[entry.rank - 1] }} /> : <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{entry.rank}</span>}
                      </div>
                      <AvatarComponent name={entry.display_name} avatar={entry.avatar} size="md" isMe={isMe} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold truncate" style={{ color: isMe ? '#58CC02' : 'var(--text)' }}>{entry.display_name}</p>
                          {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: '#58CC0220', color: '#58CC02' }}>You</span>}
                          <PlayerTagBadge role={entry.role} rank={entry.rank} tag={entry.custom_tag} tagColor={entry.custom_tag_color} size="xs" />
                        </div>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Level {entry.level}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs flex-shrink-0">
                        <span className="flex items-center gap-0.5 font-bold" style={{ color: '#FFC800' }}><Zap className="w-3 h-3" /> {entry.xp.toLocaleString()}</span>
                        {entry.streak > 0 && <span className="flex items-center gap-0.5 font-bold" style={{ color: '#FF9600' }}><Flame className="w-3 h-3" /> {entry.streak}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="leagues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowCreate(true)} className="d-card p-4 flex flex-col items-center gap-2 transition-all active:scale-95 text-center" style={{ borderColor: '#CE82FF60' }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#CE82FF', boxShadow: '0 4px 0 #B563F5' }}><Plus className="w-6 h-6 text-white" /></div>
                  <div><p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Create League</p><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Start a private league</p></div>
                </button>
                <button onClick={() => setShowJoin(true)} className="d-card p-4 flex flex-col items-center gap-2 transition-all active:scale-95 text-center" style={{ borderColor: '#1CB0F660' }}>
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#1CB0F6', boxShadow: '0 4px 0 #0C9BDE' }}><ChevronRight className="w-6 h-6 text-white" /></div>
                  <div><p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Join League</p><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Enter a code from a friend</p></div>
                </button>
              </div>

              <div className="d-card p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(206,130,255,0.12)', borderColor: '#CE82FF40' }}>
                <Trophy className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#CE82FF' }} />
                <div><p className="text-sm font-bold" style={{ color: '#7C3AED' }}>Compete with Friends!</p><p className="text-xs mt-0.5" style={{ color: '#9C6BBE' }}>Create a private league, invite up to {MAX_ROOM_MEMBERS} friends with the league code, and see who tops the leaderboard first!</p></div>
              </div>

              {leaguesLoading ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="d-card h-48 animate-pulse" style={{ opacity: 0.5 }} />)}</div>
              ) : myLeagues.length === 0 ? (
                <div className="d-card p-8 text-center"><Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.4 }} /><p className="font-bold text-sm mb-1" style={{ color: 'var(--text-muted)' }}>No leagues yet</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Create a league or join one with a code to compete with your squad!</p></div>
              ) : (
                <div className="space-y-4">{myLeagues.map(league => <LeagueCard key={league.id} league={league} myUserId={myUserId} onLeave={handleLeave} onDelete={handleDelete} />)}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="h-4" />
      </motion.div>

      <AnimatePresence>
        {showCreate && <CreateLeagueModal onClose={() => setShowCreate(false)} onCreated={() => { loadLeagues(); setShowCreate(false); setActiveTab('leagues'); }} myUserId={myUserId} myName={profile?.display_name || ''} />}
        {showJoin && <JoinLeagueModal onClose={() => setShowJoin(false)} onJoined={() => { loadLeagues(); setShowJoin(false); setActiveTab('leagues'); }} myUserId={myUserId} myName={profile?.display_name || ''} />}
      </AnimatePresence>
    </>
  );
}